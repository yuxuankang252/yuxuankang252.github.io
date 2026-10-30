#!/usr/bin/env node
/**
 * 一条命令发布：暂存 → 提交 → 推送 → 提示等部署。
 *
 *   npm run publish
 *
 * git push 走不通时（本机代理只放行 api.github.com，会报 502）自动改用
 * scripts/push-api.mjs 的 Git Data API 通道，不需要你记住两套命令。
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const git = (args, opts = {}) =>
  execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', ...opts })

// 1. 暂存全部改动
git(['add', '-A'])

// 2. 没有改动就别空提交
const staged = git(['diff', '--cached', '--name-status']).trim()
if (!staged) {
  console.log('没有需要发布的改动。')
  process.exit(0)
}

const lines = staged.split(/\r?\n/).filter(Boolean)

// 3. 提交信息：优先用这次动过的文章标题（新增或修改都算）
const changedPosts = lines
  .filter((l) => /^[AM]\s+src\/posts\/.+\.md$/.test(l))
  .map((l) => l.split(/\s+/)[2])

let message = 'chore: 更新站点内容'
if (changedPosts.length) {
  const titles = changedPosts.map((file) => {
    try {
      const raw = fs.readFileSync(path.join(ROOT, file), 'utf8')
      const m = raw.match(/^title:\s*(.+)$/m)
      return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : path.basename(file, '.md')
    } catch (e) {
      return path.basename(file, '.md')
    }
  })
  message = `post: ${titles.join('、')}`
}

git(['commit', '-m', message])
console.log(`已提交  ${message}`)
console.log(lines.map((l) => '  ' + l).join('\n'))

// 4. 推送：先走 git，不通就换 API
let pushed = false
try {
  git(['push', 'origin', 'HEAD:main'], { timeout: 25000, stdio: 'pipe' })
  pushed = true
  console.log('\n已通过 git 推送。')
} catch (e) {
  console.log('\ngit 推送不通（代理只放行 api.github.com），改用 API 通道…')
}

if (!pushed) {
  try {
    execFileSync(process.execPath, [path.join(ROOT, 'scripts/push-api.mjs')], {
      cwd: ROOT,
      stdio: 'inherit',
    })
  } catch (e) {
    console.error('\n推送失败。检查网络后重试：node scripts/push-api.mjs')
    process.exit(1)
  }
}

console.log(`
完成。GitHub Actions 会自动构建，1~2 分钟后刷新就能看到：
  首页  https://yuxuankang252.github.io/
  博客  https://yuxuankang252.github.io/blog.html
`)
