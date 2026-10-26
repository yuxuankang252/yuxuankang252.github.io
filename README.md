# 个人网站（React + Tailwind CSS）

线上地址：**https://yuxuankang252.github.io/**

静态站点，两个部分：**个人介绍**（首页）与 **博客**（占位中，下一步接 Markdown）。

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
src/
  data/site.js              ← 所有文案：姓名、GitHub、技能、经历、项目
  components/               Nav / Hero / About / Skills / Journey / Projects / Contact / Footer / MusicPlayer
  pages/                    Home.jsx、Blog.jsx
  assets/                   hero-monster.jpg（首屏插画）
  lib/meting.js             音乐接口封装（Meting-API）
  theme.jsx                 深浅色主题（localStorage 记忆）
  index.css                 Tailwind 指令 + 自定义样式
scripts/push-api.mjs        git 通道不通时的备用推送脚本
public/.nojekyll            GitHub Pages 用，别删
.github/workflows/deploy.yml  推送即自动部署
```

**改内容只需要动 `src/data/site.js`**。

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

## 下一步：Markdown 博客

计划用 `import.meta.glob('./posts/*.md', { query: '?raw', import: 'default' })` 读入 Markdown，  
构建时渲染成静态 HTML（代码块语法高亮），文章按时间倒序展示在 `blog.html`。
