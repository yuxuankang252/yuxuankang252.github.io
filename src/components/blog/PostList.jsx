import { useEffect, useRef, useState } from 'react'
import { formatDate, posts, postsByTag, tags } from '../../lib/posts.js'
import Reveal from '../Reveal.jsx'
import { IconArrowRight } from '../Icons.jsx'

function TagPill({ tag, active }) {
  return (
    <a
      href={tag ? `#/tag/${encodeURIComponent(tag)}` : '#/'}
      aria-current={active ? 'page' : undefined}
      className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition ${
        active
          ? 'border-transparent bg-ink text-white dark:bg-white dark:text-ink'
          : 'border-black/10 bg-white/60 text-zinc-600 hover:border-black/20 hover:text-ink dark:border-white/12 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:border-white/25 dark:hover:text-white'
      }`}
    >
      {tag || '全部'}
    </a>
  )
}

export default function PostList({ activeTag = '' }) {
  const list = postsByTag(activeTag)
  const [entered, setEntered] = useState(false)
  const firstRun = useRef(true)

  /* 切换标签时列表重新淡入，避免内容瞬间跳一下 */
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      setEntered(true)
      return
    }
    setEntered(false)
    const timer = setTimeout(() => setEntered(true), 20)
    return () => clearTimeout(timer)
  }, [activeTag])

  return (
    <div className="mx-auto max-w-4xl">
      <Reveal>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">Blog</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-[2.6rem]">写下来的东西</h1>
        <p className="mt-4 max-w-xl text-[15px] leading-[1.85] text-zinc-600 dark:text-zinc-400">
          实验记录、踩坑复盘，和读代码时的笔记。写下来才算真正弄懂。
        </p>
      </Reveal>

      <Reveal delay={80} className="mt-8 flex flex-wrap items-center gap-2">
        <TagPill tag="" active={!activeTag} />
        {tags.map((tag) => (
          <TagPill key={tag.name} tag={tag.name} active={activeTag === tag.name} />
        ))}
        <span className="ml-auto font-mono text-[12px] tabular-nums text-zinc-400 dark:text-zinc-500">
          {list.length} / {posts.length} 篇
        </span>
      </Reveal>

      {list.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-black/10 px-6 py-16 text-center dark:border-white/15">
          <p className="text-[15px] text-zinc-500">
            {posts.length === 0 ? '还没有文章。在 src/posts/ 里新建一个 .md 就会出现在这里。' : '这个标签下还没有文章。'}
          </p>
          <a
            href="#/"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-[13.5px] font-medium text-ink transition hover:border-black/20 dark:border-white/15 dark:text-white dark:hover:border-white/30"
          >
            看全部文章
            <IconArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      ) : (
        <div
          className={`mt-8 transition-all duration-300 ${entered ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}
        >
          {list.map((post, index) => (
            <Reveal key={post.slug} delay={Math.min(index, 4) * 60}>
              <a
                href={`#/post/${post.slug}`}
                className="group relative block border-t border-black/8 py-7 transition-colors hover:border-black/20 dark:border-white/10 dark:hover:border-white/25"
              >
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11.5px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                  <span>{formatDate(post.meta.date)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{post.minutes} 分钟</span>
                  {post.meta.tags.map((tag) => (
                    <span key={tag} className="normal-case rounded bg-black/[0.06] px-1.5 py-0.5 text-[10.5px] tracking-normal text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                      {tag}
                    </span>
                  ))}
                </div>

                <h2 className="mt-2.5 flex items-start gap-2 text-[20px] font-semibold leading-snug tracking-tight transition group-hover:text-indigo-600 sm:text-[21px] dark:group-hover:text-indigo-300">
                  {post.meta.title}
                  <IconArrowRight className="mt-1.5 h-4 w-4 shrink-0 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                </h2>

                {post.meta.summary && (
                  <p className="mt-2 max-w-2xl text-[14px] leading-[1.85] text-zinc-600 dark:text-zinc-400">
                    {post.meta.summary}
                  </p>
                )}
              </a>
            </Reveal>
          ))}
          <div className="border-t border-black/8 dark:border-white/10" />
        </div>
      )}
    </div>
  )
}
