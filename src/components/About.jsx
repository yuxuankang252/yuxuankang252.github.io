import { about, profile } from '../data/site.js'
import Reveal from './Reveal.jsx'
import { IconArrowUpRight } from './Icons.jsx'

export default function About() {
  return (
    <section id="about" className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
        <div>
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">About</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-[2.6rem]">关于我</h2>
          </Reveal>

          <Reveal delay={80}>
            <div className="mt-7 space-y-5 text-[15.5px] leading-[1.9] text-zinc-600 dark:text-zinc-400">
              {about.paragraphs.map((text) => (
                <p key={text.slice(0, 12)}>{text}</p>
              ))}
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              {about.stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <p className="text-2xl font-semibold tracking-tight">
                    {item.value}
                    <span className="text-zinc-400 dark:text-zinc-600">{item.suffix}</span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">{item.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={120} as="aside">
          <div className="rounded-3xl border border-black/5 bg-white/70 p-6 shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/[0.05]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Quick facts</p>
            <dl className="mt-5 space-y-4 text-sm">
              {about.facts.map((fact, index) => (
                <div key={fact.label}>
                  {index > 0 && <div className="mb-4 h-px bg-black/5 dark:bg-white/10" />}
                  <div className="flex items-start justify-between gap-4">
                    <dt className="shrink-0 text-zinc-500">{fact.label}</dt>
                    <dd className="text-right font-medium">{fact.value}</dd>
                  </div>
                </div>
              ))}
              <div className="h-px bg-black/5 dark:bg-white/10" />
              <div className="flex items-start justify-between gap-4">
                <dt className="shrink-0 text-zinc-500">状态</dt>
                <dd className="flex items-center gap-1.5 text-right font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {profile.availability}
                </dd>
              </div>
            </dl>

            <a
              href="#contact"
              className="mt-6 flex items-center justify-between rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-ink"
            >
              聊聊技术
              <IconArrowUpRight />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
