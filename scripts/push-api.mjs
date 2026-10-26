#!/usr/bin/env node
/**
 * 在 github.com 的 git 通道不可用时（代理 502），改用 GitHub REST API 推送。
 *
 * 用法：
 *   node scripts/push-api.mjs            # 推送到 origin 指向的仓库的 main 分支
 *   node scripts/push-api.mjs --dry-run  # 只看会推哪些文件
 *
 * 凭据来源：优先环境变量 GH_TOKEN / GITHUB_TOKEN，否则用 git credential fill 读本机已存的 token。
 *
 * 原理：Git Data API —— 上传 blob → 拼 tree → 建 commit → 更新 main 引用。
 * 只上传内容有变化的文件，已存在于远端的文件会被自动跳过。
 */
import { execFileSync } from 'node:child_process'
import path from 'node:path'

const DRY = process.argv.includes('--dry-run')
const CWD = process.cwd()
const BRANCH = process.env.PUSH_BRANCH || 'main'

const git = (...args) =>
  execFileSync('git', args, { cwd: CWD, maxBuffer: 1 << 28 }).toString().trim()
const gitRaw = (...args) =>
  execFileSync('git', args, { cwd: CWD, maxBuffer: 1 << 28, encoding: 'buffer' })

/* ---------- 1. 解析仓库与 token ---------- */
function repoFromRemote() {
  const url = git('remote', 'get-url', 'origin')
  const m = url.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/)
  if (!m) throw new Error(`无法从 origin 解析仓库：${url}`)
  return `${m[1]}/${m[2]}`
}

function tokenFromCredential() {
  try {
    const out = execFileSync('git', ['credential', 'fill'], {
      cwd: CWD,
      input: 'protocol=https\nhost=github.com\n\n',
      maxBuffer: 1 << 20,
    }).toString()
    return out.split('\n').find((l) => l.startsWith('password='))?.slice(9)?.trim() || ''
  } catch {
    return ''
  }
}

const REPO = process.env.GITHUB_REPOSITORY || repoFromRemote()
const TOK = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || tokenFromCredential()
if (!TOK) throw new Error('没有可用的 GitHub token，请设置 GH_TOKEN 环境变量')

const base = `/repos/${REPO}`

async function api(p, method = 'GET', body) {
  const res = await fetch(`https://api.github.com${p}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOK}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'coco-site-push',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${p} -> ${res.status}\n${text.slice(0, 500)}`)
  return text ? JSON.parse(text) : null
}

/* ---------- 2. 远端当前状态 ---------- */
const ref = await api(`${base}/git/ref/heads/${BRANCH}`)
const remoteHead = ref.object.sha
const remoteCommit = await api(`${base}/git/commits/${remoteHead}`)
const remoteTree = remoteCommit.tree.sha

const remoteTreeList = await api(`${base}/git/trees/${remoteTree}?recursive=1`)
const remoteFiles = new Map(
  remoteTreeList.tree.filter((e) => e.type === 'blob').map((e) => [e.path, e.sha])
)

/* ---------- 3. 本地 HEAD 的文件表 ---------- */
const localFiles = new Map()
for (const line of git('ls-tree', '-r', 'HEAD').split('\n').filter(Boolean)) {
  const [meta, p] = line.split('\t')
  const [, type, sha] = meta.split(/\s+/)
  if (type === 'blob') localFiles.set(p, sha)
}

/* ---------- 4. 差集 ---------- */
const uploads = []
for (const [p, sha] of localFiles) {
  if (remoteFiles.get(p) !== sha) uploads.push(p)
}
const deletes = [...remoteFiles.keys()].filter((p) => !localFiles.has(p))

if (!uploads.length && !deletes.length) {
  console.log('远端已是最新，无需推送。')
  process.exit(0)
}

console.log(`仓库 ${REPO}  远端 ${remoteHead.slice(0, 8)}`)
console.log(`新增/修改 ${uploads.length} 个，删除 ${deletes.length} 个`)
uploads.forEach((p) => console.log(`  M ${p}`))
deletes.forEach((p) => console.log(`  D ${p}`))
if (DRY) process.exit(0)

/* ---------- 5. 上传 blob ---------- */
const entries = []
for (const p of uploads) {
  const content = gitRaw('cat-file', 'blob', localFiles.get(p))
  const blob = await api(`${base}/git/blobs`, 'POST', {
    content: content.toString('base64'),
    encoding: 'base64',
  })
  const mode = git('ls-tree', 'HEAD', p).split(' ')[0]
  entries.push({ path: p, mode, type: 'blob', sha: blob.sha })
  console.log(`  ↑ ${p} ${blob.sha.slice(0, 8)} (${(content.length / 1024).toFixed(0)}KB)`)
}
for (const p of deletes) entries.push({ path: p, mode: '100644', type: 'blob', sha: null })

/* ---------- 6. 建 tree / commit / 更新引用 ---------- */
const tree = await api(`${base}/git/trees`, 'POST', { base_tree: remoteTree, tree: entries })

const message = git('log', '-1', '--format=%B', 'HEAD')
const author = {
  name: git('log', '-1', '--format=%an', 'HEAD'),
  email: git('log', '-1', '--format=%ae', 'HEAD'),
  date: git('log', '-1', '--format=%aI', 'HEAD'),
}
const commit = await api(`${base}/git/commits`, 'POST', {
  message,
  tree: tree.sha,
  parents: [remoteHead],
  author,
  committer: author,
})

const out = await api(`${base}/git/refs/heads/${BRANCH}`, 'PATCH', {
  sha: commit.sha,
  force: false,
})
console.log(`\n完成：${BRANCH} -> ${out.object.sha.slice(0, 8)}`)
console.log('GitHub Actions 会自动开始部署。')
