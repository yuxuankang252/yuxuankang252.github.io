import { skills } from '../data/site.js'
import Reveal from './Reveal.jsx'
import { skillIcons } from './Icons.jsx'

const accents = {
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-400',
  fuchsia: 'bg-fuchsia-500/10 text-fuchsia-600 dark:bg-fuchsia-400/15 dark:text-fuchsia-400',
  cyan: 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-400/15 dark:text-cyan-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400',
}

const tagClass =
  'rounded-lg border border-black/5 bg-white/70 px-2.5 py-1 text-[12.5px] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300'

export default function Skills() {
  return (
    <section id="skills" className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="blob left-1/2 top-10 h-[26rem] w-[26rem] -translate-x-1/2 bg-violet-300/20 dark:bg-violet-700/15" />
      </div>

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">Toolbox</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-[2.6rem]">我会用什么</h2>
          <p className="mt-4 text-[15px] leading-[1.85] text-zinc-600 dark:text-zinc-400">
            按「能独立完成什么」来分组，而不是列一堆只听过名字的关键词。
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {skills.map((group, index) => {
            const Icon = skillIcons[group.icon]
            return (
              <Reveal key={group.title} delay={index * 80}>
                <div className="card-hover h-full rounded-3xl border border-black/5 bg-white/70 p-6 shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-10 w-10 place-items-center rounded-xl ${accents[group.accent]}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-[15px] font-semibold tracking-tight">{group.title}</h3>
                  </div>
                  <p className="mt-4 text-[13.5px] leading-relaxed text-zinc-500">{group.desc}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {group.tags.map((tag) => (
                      <span key={tag} className={tagClass}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
