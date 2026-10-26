import Nav from '../components/Nav.jsx'
import Footer from '../components/Footer.jsx'
import { IconArrowLeft } from '../components/Icons.jsx'

const steps = [
  {
    title: '写 Markdown',
    desc: '文章放在 posts/ 目录里，文件头部写标题、日期、标签等元信息。',
    code: 'posts/backprop-from-scratch.md',
  },
  {
    title: '渲染成 HTML',
    desc: '构建时把 Markdown 转成 HTML 字符串，交给 React 渲染，代码块带语法高亮。',
    code: 'import.meta.glob("./posts/*.md", { as: "raw" })',
  },
  {
    title: '列表与详情',
    desc: '博客首页按时间倒序列出文章，点进去是单篇正文，链接可直接分享。',
    code: '/blog.html#/posts/backprop-from-scratch',
  },
]

export default function Blog() {
  return (
    <>
      <Nav homePrefix="index.html" current="blog" />

      <main className="relative overflow-hidden px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="grid-bg absolute inset-0" />
          <div className="blob -left-24 -top-16 h-72 w-72 bg-indigo-400/30 dark:bg-indigo-600/25" />
          <div className="blob right-0 top-10 h-72 w-72 bg-fuchsia-400/20 dark:bg-fuchsia-600/20" />
        </div>

        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-zinc-600 backdrop-blur dark:border-white/15 dark:bg-white/5 dark:text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            正在搭建
          </p>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            博客<span className="text-indigo-500">·</span>即将上线
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-[1.9] text-zinc-600 dark:text-zinc-400">
            这里会放实验记录、踩坑复盘和读代码的笔记。文章用 Markdown 编写，再由 Vite 在构建时渲染成静态 HTML，和首页保持同一套设计语言。
          </p>

          <div className="mx-auto mt-10 grid max-w-xl gap-3 text-left">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-white/[0.04]"
              >
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-500/10 text-[11px] font-semibold text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-400">
                  {index + 1}
                </span>
                <div>
                  <p className="text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                    <span className="font-medium text-ink dark:text-white">{step.title}</span>
                    {' —— '}
                    {step.desc}
                  </p>
                  <code className="mt-2 inline-block rounded-md bg-black/5 px-2 py-1 text-[12px] text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
                    {step.code}
                  </code>
                </div>
              </div>
            ))}
          </div>

          <a
            href="index.html"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-white transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-ink/25 dark:bg-white dark:text-ink"
          >
            <IconArrowLeft />
            先看看个人介绍
          </a>
        </div>
      </main>

      <Footer homePrefix="index.html" />
    </>
  )
}
