# 个人网站（React + Tailwind CSS）

线上地址：**https://yuxuankang252.github.io/myweb/**

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
  lib/meting.js             ← 音乐接口封装（歌单地址、歌词解析都在这里）
  components/               Nav / Hero / About / Skills / Journey / Projects / Contact / Footer
                            + MusicPlayer.jsx（右下角悬浮播放器）
  pages/                    Home.jsx、Blog.jsx
  theme.jsx                 深浅色主题（localStorage 记忆）
  index.css                 Tailwind 指令 + 自定义样式
public/.nojekyll            GitHub Pages 用，别删
.github/workflows/deploy.yml  推送即自动部署
```

**改内容只需要动 `src/data/site.js`**，头像想换真人照片，改 `src/components/Hero.jsx` 里注释标出的那块。

## 音乐播放器

右下角的悬浮按钮，点开是一个小播放器：封面、曲名、进度条、歌词单行、上一首/下一首、音量；右上角列表图标可以看完整歌单。

数据来自 [祈杰の Meting-API](https://api.qijieya.cn/meting/)（免费公开接口，带 `Access-Control-Allow-Origin: *`，纯前端可直接 fetch）：

```
https://api.qijieya.cn/meting/?server=netease&type=playlist&id=<歌单ID>
```

每条记录有 `name` / `artist` / `url`（302 跳到 mp3）/ `pic`（封面）/ `lrc`（歌词文本）。

- **换歌单**：改 `src/lib/meting.js` 里的 `PLAYLIST_ID`（现在 `7254616088`）。换别的平台把 `SERVER` 改成 `tencent`。
- **不自动播放**：浏览器会拦截没有用户操作的自动播放，所以进页面默认静音不动，点了才响。
- **音频不经过你的仓库**：歌单和音频都走第三方接口，仓库里没有音乐文件；接口挂了播放器会提示「加载失败」，不影响页面其它部分。


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
