import { useEffect, useRef, useState } from 'react'
import { formatDate, neighborsOf } from '../../lib/posts.js'
import { IconArrowLeft, IconArrowRight } from '../Icons.jsx'
import Toc from './Toc.jsx'

/* 顶部阅读进度条 */
function ReadingProgress() {
  const [ratio, setRatio] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      setRatio(max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className="fixed left-0 top-0 z-[60] h-[2px] bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-[width] duration-150 ease-out"
      style={{ width: `${ratio * 100}%` }}
    />
  )
}

/* 优先用 Clipboard API，不可用时退回隐藏 textarea + execCommand */
async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      /* 继续走降级 */
    }
  }
  try {
    const holder = document.createElement('textarea')
    holder.value = text
    holder.setAttribute('readonly', '')
    holder.style.cssText = 'position:fixed;top:-1000px;left:0;opacity:0'
    document.body.appendChild(holder)
    holder.select()
    const ok = document.execCommand('copy')
    holder.remove()
    return ok
  } catch {
    return false
  }
}

/* 给每个代码块挂一个复制按钮：正文是静态 HTML，这里直接操作 DOM */
function useCodeCopyButtons(ref, slug) {
  useEffect(() => {
    const root = ref.current
    if (!root) return

    const blocks = [...root.querySelectorAll('pre.code-block')]
    const cleanups = blocks.map((pre) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'code-copy'
      button.textContent = '复制'
      button.setAttribute('aria-label', '复制这段代码')

      let timer = 0
      const onClick = async () => {
        const code = pre.querySelector('code')
        const ok = await copyText(code ? code.innerText : '')
        button.textContent = ok ? '已复制' : '复制失败'
        clearTimeout(timer)
        timer = setTimeout(() => {
          button.textContent = '复制'
        }, 1600)
      }

      button.addEventListener('click', onClick)
      pre.appendChild(button)

      return () => {
        clearTimeout(timer)
        button.removeEventListener('click', onClick)
        button.remove()
      }
    })

    return () => cleanups.forEach((fn) => fn())
  }, [ref, slug])
}

export default function PostView({ post }) {
  const articleRef = useRef(null)
  const { prev, next } = neighborsOf(post.slug)
  useCodeCopyButtons(articleRef, post.slug)

  return (
    <>
      <ReadingProgress />

      <div className="mx-auto max-w-5xl">
        <a
          href="#/"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-zinc-500 transition hover:text-ink dark:text-zinc-400 dark:hover:text-white"
        >
          <IconArrowLeft className="h-3.5 w-3.5" />
          全部文章
        </a>

        <header className="mt-7 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11.5px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
            <time dateTime={post.meta.date}>{formatDate(post.meta.date)}</time>
            <span aria-hidden="true">·</span>
            <span>{post.minutes} 分钟读完</span>
          </div>

          <h1 className="mt-4 text-[1.9rem] font-semibold leading-[1.25] tracking-tight sm:text-[2.5rem]">
            {post.meta.title}
          </h1>

          {post.meta.summary && (
            <p className="mt-4 text-[15px] leading-[1.85] text-zinc-600 dark:text-zinc-400">{post.meta.summary}</p>
          )}

          {post.meta.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {post.meta.tags.map((tag) => (
                <a
                  key={tag}
                  href={`#/tag/${encodeURIComponent(tag)}`}
                  className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11.5px] font-medium text-indigo-600 transition hover:bg-indigo-500/20 dark:bg-indigo-400/10 dark:text-indigo-300 dark:hover:bg-indigo-400/20"
                >
                  {tag}
                </a>
              ))}
            </div>
          )}
        </header>

        {/* 移动端：目录折叠起来 */}
        {post.toc.length > 1 && (
          <details className="mt-8 rounded-2xl border border-black/8 bg-white/60 px-4 py-3 lg:hidden dark:border-white/10 dark:bg-white/[0.04]">
            <summary className="cursor-pointer text-[13px] font-medium text-zinc-600 dark:text-zinc-300">
              本文目录（{post.toc.length} 节）
            </summary>
            <div className="mt-3">
              <Toc items={post.toc} compact />
            </div>
          </details>
        )}

        <div className="mt-10 grid gap-14 lg:grid-cols-[minmax(0,1fr)_13rem]">
          <article
            ref={articleRef}
            className="prose-coco min-w-0"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          <aside className="hidden lg:block">
            <Toc items={post.toc} />
          </aside>
        </div>

        {(prev || next) && (
          <nav className="mt-16 grid gap-3 border-t border-black/8 pt-8 sm:grid-cols-2 dark:border-white/10">
            {prev ? (
              <a
                href={`#/post/${prev.slug}`}
                className="group rounded-2xl border border-black/8 bg-white/60 p-5 transition hover:border-black/20 hover:shadow-soft dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/25"
              >
                <p className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                  <IconArrowLeft className="h-3 w-3" />
                  更新的一篇
                </p>
                <p className="mt-2 text-[14.5px] font-medium leading-snug transition group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                  {prev.meta.title}
                </p>
              </a>
            ) : (
              <span className="hidden sm:block" />
            )}

            {next && (
              <a
                href={`#/post/${next.slug}`}
                className="group rounded-2xl border border-black/8 bg-white/60 p-5 text-right transition hover:border-black/20 hover:shadow-soft dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/25"
              >
                <p className="flex items-center justify-end gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                  更早的一篇
                  <IconArrowRight className="h-3 w-3" />
                </p>
                <p className="mt-2 text-[14.5px] font-medium leading-snug transition group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                  {next.meta.title}
                </p>
              </a>
            )}
          </nav>
        )}
      </div>
    </>
  )
}
