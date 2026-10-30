import { profile } from '../data/site.js'

export default function Footer({ homePrefix = '' }) {
  const year = new Date().getFullYear()
  const homeTop = homePrefix ? homePrefix : '#top'

  return (
    <footer className="border-t border-black/5 py-10 dark:border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-[11px] font-semibold text-white dark:bg-white dark:text-ink">
            {profile.initials}
          </span>
          <p className="text-xs text-zinc-500">
            © {year} {profile.name}
          </p>
        </div>
        <div className="flex items-center gap-5 text-xs text-zinc-500">
          <a href="blog.html" className="transition hover:text-ink dark:hover:text-white">
            博客
          </a>
          <a href={homeTop} className="transition hover:text-ink dark:hover:text-white">
            回到顶部
          </a>
        </div>
      </div>
    </footer>
  )
}
