#!/usr/bin/env node
/**
 * 新建一篇博客：自动生成带头部信息的 Markdown 骨架。
 *
 *   npm run new -- "标题"
 *   npm run new -- "标题" 自定义-slug
 *
 * 不传 slug 就用标题生成；标题是纯中文也行（链接里会是中文，微信/QQ 分享会自动编码）。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const POSTS = path.join(ROOT, 'src/posts')

const plain = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const title = (plain[0] || '').trim()
const wantedSlug = (plain[1] || '').trim()

function usage() {
  console.log(`
用法：
  npm run new -- "文章标题"
  npm run new -- "文章标题" my-post-slug

第二个参数是链接里显示的英文短名（可省略，省略时用标题自动生成）。
`)
}

if (!title) {
  usage()
  process.exit(1)
}

const today = (() => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
})()

function toSlug(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

let slug = wantedSlug ? toSlug(wantedSlug) : toSlug(title)
if (!slug) slug = `post-${today.replace(/-/g, '')}`

const file = path.join(POSTS, `${slug}.md`)
if (fs.existsSync(file)) {
  console.error(`已经有一篇叫 ${slug}.md 的文章了，换个 slug 再试：`)
  console.error(`  npm run new -- "${title}" ${slug}-2`)
  process.exit(1)
}

const body = `---
title: ${title}
date: ${today}
tags: []
summary:
draft: false
---

## 想解决什么问题

（一句话说清这篇要讲什么，读者为什么该看。）

## 怎么做的

（步骤、命令、关键代码。代码块写 \`\`\`python 这样的围栏。）

## 卡住的地方

（踩了什么坑、怎么绕过去的。这一段最值钱，别省。）

## 结论

（做完了得到什么结果，数据是什么，下一步想做什么。）
`

fs.mkdirSync(POSTS, { recursive: true })
fs.writeFileSync(file, body, 'utf8')

console.log(`
已创建  src/posts/${slug}.md
链接    /#/post/${slug}

接下来：
  1. 边写边看   npm run dev   然后打开 http://localhost:5173/#/blog
  2. 写完上线   npm run publish

提示：
  · tags 写成 [机器学习, NumPy] 这样，列表页就能按标签筛选
  · summary 留空会显示默认文案，建议写一句话
  · 不想现在公开就把 draft 改成 true，站点上就不会出现
`)
