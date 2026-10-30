import { useEffect, useState } from 'react'

/* 右侧目录：滚动时高亮当前读到的小节 */
export default function Toc({ items, compact = false }) {
  const [active, setActive] = useState(items[0]?.slug || '')

  useEffect(() => {
    if (!items.length) return
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        let current = items[0].slug
        for (const item of items) {
          const el = document.getElementById(item.slug)
          if (el && el.getBoundingClientRect().top < 160) current = item.slug
        }
        setActive(current)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [items])

  if (items.length < 2) return null

  return (
    <nav aria-label="文章目录" className={compact ? '' : 'sticky top-24'}>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
        本文目录
      </p>
      <ul className={`mt-3 space-y-1.5 ${compact ? 'border-l border-black/10 pl-4 dark:border-white/10' : ''}`}>
        {items.map((item) => (
          <li key={item.slug} className={item.level === 3 ? 'pl-3' : ''}>
            <a
              href={`#${item.slug}`}
              onClick={(event) => {
                event.preventDefault()
                const el = document.getElementById(item.slug)
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className={`block border-l-2 py-0.5 pl-3 text-[12.5px] leading-[1.6] transition ${
                active === item.slug
                  ? 'border-indigo-500 font-medium text-ink dark:text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
