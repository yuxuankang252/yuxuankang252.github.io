# 个人网站（React + Tailwind CSS）

线上地址：**https://yuxuankang252.github.io/**

静态站点，两个部分：**个人介绍**（首页）与 **博客**（Markdown 写作，构建时编译成 HTML）。

技术栈：React 19 + Vite 8 + Tailwind CSS 3，`npm run build` 产出纯静态文件，可部署到 GitHub Pages。

## 本地开发

```bash
npm install      # 第一次需要
npm run dev      # 开发服务器，默认 http://localhost:5173
npm run build    # 构建，产物在 dist/
npm run preview  # 预览构建结果
```

## 目录结构

```
index.html                  首页入口
blog.html                   博客入口（Vite 多页）
plugins/markdown.mjs        ← 把 .md 编译成 HTML 的 Vite 插件
src/
  data/site.js              ← 所有文案：姓名、GitHub、技能、经历
  posts/                    ← 文章放这里，一个 .md 一篇
  components/               Nav / Hero / About / Skills / Journey / Contact / Footer / MusicPlayer
  components/blog/          博客的列表页、正文页、目录
  pages/                    Home.jsx、Blog.jsx
  assets/                   hero-monster.jpg（首屏插画）
  lib/posts.js              文章数据整理（排序、标签统计、上一篇/下一篇）
  lib/meting.js             音乐接口封装（Meting-API）
  theme.jsx                 深浅色主题（localStorage 记忆）
  index.css                 Tailwind 指令 + 自定义样式
scripts/push-api.mjs        git 通道不通时的备用推送脚本
public/.nojekyll            GitHub Pages 用，别删
.github/workflows/deploy.yml  推送即自动部署
```

**改文案只需要动 `src/data/site.js`；写文章只需要往 `src/posts/` 里加文件。**

## 写一篇博客

### 四步

```bash
npm run new -- "文章标题"              # 1. 生成 src/posts/文章标题.md 骨架
npm run dev                            # 2. 打开 http://localhost:5173/blog.html 边写边看
git add -A && git commit -m "post: 文章标题" && git push   # 3. 上线
```

第 4 步是等 1~2 分钟，Actions 构建完刷新线上地址就能看到。

`npm run new` 第二个参数是链接里的英文短名，可省略：

```bash
npm run new -- "梯度校验" grad-check   # -> src/posts/grad-check.md，链接 #/post/grad-check
npm run new -- "梯度校验"              # -> 用标题生成，中文也能用（分享时浏览器会自动编码）
```

### 文件长什么样

```markdown
---
title: 用 NumPy 从零实现反向传播
date: 2026-10-06
tags: [机器学习, NumPy]
summary: 一句话摘要，会显示在列表页和分享描述里。
draft: false
---

正文从这里开始，用普通 Markdown 写就行。
```

| 字段 | 作用 |
|---|---|
| `title` | 列表和文章页的大标题，也写进浏览器标签 |
| `date` | 排序用，`YYYY-MM-DD`，越新越靠前 |
| `tags` | 写成 `[机器学习, NumPy]`，列表页就能按标签筛选 |
| `summary` | 列表卡片上的两行摘要；留空会用默认文案 |
| `draft` | `true` 就不上线，写一半可以先存着 |

### 写的时候要知道的几件事

- **小标题**：`##` 和 `###` 会自动生成锚点、汇总成右侧目录、并参与滚动高亮。`#` 一级标题不用写（页面已有标题）。
- **代码块**：用 ` ```python ` 这样的围栏，构建时用 highlight.js 上色，每块右上角自动出现「复制」按钮。语言名写错也不会崩，只是不上色。
- **图片**：放进 `public/posts/`，正文写 `![](posts/xxx.png)`。`public/` 下的文件会原样复制到 `dist/`，所以路径是相对站点根目录的。
- **表格、引用、任务列表、脚注**：markdown-it 默认都支持，直接写。
- **站外链接**：自动加 `target="_blank"`，不用自己写。

### 链接与原理

文章链接是 hash 形式（`blog.html#/post/slug`），刷新不会 404 —— GitHub Pages 没有服务端路由，这是唯一稳妥的做法。

文章在**构建时**就被编译成 HTML 字符串（`plugins/markdown.mjs`），浏览器拿到的只有成品，不下载 markdown-it / highlight.js，所以 `blog` 这个包 gzip 后只有 8KB 左右。新增文件靠 `import.meta.glob` 自动发现，不需要注册、不需要改配置。

## 音乐播放器

贴在页面**右侧中间**的紫色抽屉把手，点一下从右边拉出面板（`MusicPlayer.jsx`）：

- 收起态：右边缘居中的小把手，播放中会轻微呼吸；点开即从右侧滑出
- 展开态：420px 宽的大卡片（移动端 92vw），封面 190px、三行滚动歌词、进度条、上一首/播放/下一首、音量
- 点右上角「列表」切到歌单，可看全部 37 首并直接点播，点「返回播放」或再拉出面板会回到播放界面
- 收起后音乐继续播；`Esc` 也能收起
- 歌单与音频来自 `https://api.qijieya.cn/meting/`，换歌单只改 `src/lib/meting.js` 里的 `PLAYLIST_ID`
- 想换边：把把手 / 面板容器上的 `right-0` 与 `left-0`、`rounded-l-*` 与 `rounded-r-*`、`border-r-0` 与 `border-l-0` 成对调换，再把 `index.css` 里 `mp-in` 的 `translateX(40px)` 改成 `-40px`、`transform-origin` 改成 `left center`

首屏那张插画想换：直接覆盖 `src/assets/hero-monster.jpg` 即可，**任何比例的照片都能用** —— 容器是 `aspect-[9/5]` + `object-cover`，图片会等比铺满、不会被拉伸；比例和 9:5 差太多的部分会被居中裁掉。想让照片完整露出来，就把 `Hero.jsx` 里 img 的 `aspect-[9/5]` 改成接近照片比例的值（例如竖图用 `aspect-[4/5]`）。

## 部署到 GitHub Pages

> 本仓库**已经配置完成**，日常只需要 `git add . && git commit && git push`，Actions 会自动构建并发布。
> 首次配置的完整步骤留在下面，换仓库或重建时参考。

1. 在 GitHub 新建一个空仓库，例如 `my-site`。
2. 在项目目录执行：
   ```bash
   git init
   git add .
   git commit -m "init: personal site"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/my-site.git
   git push -u origin main
   ```
3. 打开仓库 **Settings → Pages**，把 **Source** 改成 **GitHub Actions**。
4. 等 Actions 跑完（约 1 分钟），访问 `https://<你的用户名>.github.io/my-site/`。

`vite.config.js` 里设置了 `base: './'`，资源全部走相对路径，所以**仓库叫什么都不用改配置**。

如果仓库名恰好是 `<用户名>.github.io`，地址就是 `https://<用户名>.github.io/`。

> 不想用 Actions 也可以手动部署：`npm run build` 后把 `dist/` 里的文件推到 `gh-pages` 分支，Pages 的 Source 选那个分支。

## 博客是怎么工作的

`plugins/markdown.mjs` 是一个 30 行的 Vite 插件，在**构建时**把 `src/posts/*.md` 编译成 JS 模块：

```
.md 文件  →  gray-matter 读头部元信息
          →  markdown-it 把正文转 HTML（顺带给标题加 id、收集目录）
          →  highlight.js 给代码块上色
          →  export default { slug, meta, html, toc, minutes }
```

所以浏览器里**没有** markdown-it 和 highlight.js（整包 gzip 后 7.9 kB），只拿到现成的 HTML 字符串。`src/lib/posts.js` 用 `import.meta.glob` 把编译结果收集起来做排序和标签统计，`src/pages/Blog.jsx` 用一个极简 hash 路由决定显示列表还是正文。

不用 react-router 是有意的：GitHub Pages 上刷新 `/posts/xxx` 这类真实子路径会 404，hash 不会。
