import { useEffect, useState } from 'react'
import { useTheme } from '../theme.jsx'
import { profile } from '../data/site.js'
import { IconClose, IconMenu, IconMoon, IconSun } from './Icons.jsx'

const links = [
  { hash: '#about', label: '关于' },
  { hash: '#skills', label: '技能' },
  { hash: '#journey', label: '经历' },
  { hash: '#projects', label: '项目' },
]

const linkClass =
  'rounded-lg px-3 py-2 text-sm text-zinc-600 transition hover:bg-black/5 hover:text-ink dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white'

export default function Nav({ homePrefix = '', current = 'home' }) {
  const { theme, toggle } = useTheme()
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const blogHref = 'blog.html'
  const homeHref = homePrefix ? homePrefix : '#top'

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${solid ? 'nav-solid' : ''}`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href={homeHref} className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-[15px] font-semibold tracking-wide text-white dark:bg-white dark:text-ink">
            {profile.initials}
          </span>
          <span className="text-sm font-medium tracking-tight">{profile.name}</span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((item) => (
            <a key={item.hash} href={`${homePrefix}${item.hash}`} className={linkClass}>
              {item.label}
            </a>
          ))}
          <a
            href={blogHref}
            className={`group flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition ${
              current === 'blog'
                ? 'font-medium text-ink dark:text-white'
                : 'text-zinc-600 hover:bg-black/5 hover:text-ink dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white'
            }`}
          >
            博客
          </a>
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            className="grid h-9 w-9 place-items-center rounded-full border border-black/10 bg-white/60 text-zinc-600 transition hover:text-ink hover:shadow-sm dark:border-white/15 dark:bg-white/5 dark:text-zinc-300 dark:hover:text-white"
          >
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>

          <a
            href={`${homePrefix}#contact`}
            className="hidden rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/20 sm:inline-flex dark:bg-white dark:text-ink"
          >
            联系我
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="打开菜单"
            aria-expanded={open}
            className="grid h-9 w-9 place-items-center rounded-full border border-black/10 bg-white/60 text-zinc-700 md:hidden dark:border-white/15 dark:bg-white/5 dark:text-zinc-200"
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-black/5 bg-white/95 px-5 pb-4 pt-2 backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-[#0b0b0f]/95">
          {links.map((item) => (
            <a
              key={item.hash}
              href={`${homePrefix}${item.hash}`}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-3 text-sm text-zinc-700 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
            >
              {item.label}
            </a>
          ))}
          <a
            href={blogHref}
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-3 text-sm text-zinc-700 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            博客
          </a>
          <a
            href={`${homePrefix}#contact`}
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-xl bg-ink px-3 py-3 text-center text-sm font-medium text-white dark:bg-white dark:text-ink"
          >
            联系我
          </a>
        </div>
      )}
    </header>
  )
}
