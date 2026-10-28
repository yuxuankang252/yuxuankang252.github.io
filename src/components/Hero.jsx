import { heroTagline, profile, techStrip } from '../data/site.js'
import { IconArrowRight, IconBook, IconGithub } from './Icons.jsx'
import heroMonster from '../assets/hero-monster.jpg'

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-28 sm:pb-24 sm:pt-36">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="grid-bg absolute inset-0" />
        <div className="blob -left-28 -top-24 h-[24rem] w-[24rem] bg-indigo-400/35 dark:bg-indigo-600/25" />
        <div className="blob -right-20 top-4 h-[22rem] w-[22rem] bg-fuchsia-400/25 dark:bg-fuchsia-600/20" />
        <div className="blob left-1/3 top-72 h-[20rem] w-[20rem] bg-cyan-300/25 dark:bg-cyan-500/15" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.12fr_.88fr] lg:gap-12">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm backdrop-blur dark:border-white/15 dark:bg-white/5 dark:text-zinc-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            {profile.role}
          </div>

          <h1 className="mt-6 text-[2.55rem] font-semibold leading-[1.12] tracking-tight sm:text-6xl lg:text-[4.1rem]">
            你好，我是
            <br className="sm:hidden" />
            <span className="grad-text sm:ml-[0.18em]">{profile.name}</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            {heroTagline.lead}
            <span className="font-medium text-ink dark:text-white">{heroTagline.highlightA}</span>
            {heroTagline.middle}
            <span className="font-medium text-ink dark:text-white">{heroTagline.highlightB}</span>
            {heroTagline.tail}
          </p>

          {heroTagline.paragraphs.map((text) => (
            <p key={text} className="mt-4 max-w-xl text-[15px] leading-[1.85] text-zinc-500">
              {text}
            </p>
          ))}

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#journey"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-ink/25 dark:bg-white dark:text-ink dark:hover:shadow-white/10"
            >
              看看最近的脚步
              <IconArrowRight />
            </a>
            <a
              href="blog.html"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-6 py-3 text-[15px] font-medium text-ink shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-black/20 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:border-white/30"
            >
              <IconBook />
              读我的博客
            </a>
          </div>

          <div className="mt-9 flex items-center gap-4">
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white/60 text-zinc-600 transition hover:-translate-y-0.5 hover:text-ink hover:shadow-md dark:border-white/15 dark:bg-white/5 dark:text-zinc-300 dark:hover:text-white"
            >
              <IconGithub />
            </a>
            <span className="h-px w-8 bg-black/10 dark:bg-white/15" />
            <p className="text-xs text-zinc-500">还没想好</p>
          </div>
        </div>

        {/* 视觉卡：想换成自己的照片，替换 src/assets/hero-monster.jpg 即可，
            容器用 aspect-[9/5] + object-cover，任何比例的照片都会等比铺满、不拉伸 */}
        <div className="relative mx-auto w-full max-w-[24rem] lg:max-w-none">
          <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-tr from-indigo-500/25 via-violet-500/10 to-fuchsia-500/25 blur-2xl" />

          <div className="relative rounded-[2rem] border border-black/5 bg-white/70 p-3 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
            <div className="relative overflow-hidden rounded-[1.5rem] bg-zinc-100 dark:bg-white/5">
              <img
                src={heroMonster}
                alt="奶蛙怪兽插画"
                width={1200}
                height={666}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="aspect-[9/5] w-full object-cover object-center"
              />
              <span className="absolute bottom-3 left-3 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur sm:bottom-4 sm:left-4">
                {profile.since}
              </span>
            </div>

            <div className="flex items-center justify-between px-2 py-3">
              <div>
                <p className="text-sm font-semibold tracking-tight">{profile.name}</p>
                <p className="mt-0.5 text-[11.5px] text-zinc-500">Data Science · 2026</p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                {profile.status}
              </span>
            </div>
          </div>

          <div className="absolute -left-8 top-14 hidden rounded-2xl border border-black/5 bg-white/85 px-3.5 py-2.5 text-xs font-medium shadow-lg backdrop-blur sm:block dark:border-white/10 dark:bg-white/10">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Python · NumPy
          </div>
          <div className="absolute -right-6 bottom-32 hidden rounded-2xl border border-black/5 bg-white/85 px-3.5 py-2.5 text-xs font-medium shadow-lg backdrop-blur sm:block dark:border-white/10 dark:bg-white/10">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-fuchsia-500" />
            Tailwind CSS
          </div>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-6xl px-5 sm:mt-20 sm:px-8">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-black/5 pt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:border-white/10 dark:text-zinc-600">
          {techStrip.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
