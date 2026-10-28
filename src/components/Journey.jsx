import { journey } from '../data/site.js'
import Reveal from './Reveal.jsx'

const dotColors = {
  indigo: 'bg-indigo-500',
  fuchsia: 'bg-fuchsia-500',
  cyan: 'bg-cyan-500',
}

const badgeColors = {
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400',
  fuchsia: 'bg-fuchsia-500/10 text-fuchsia-600 dark:bg-fuchsia-400/10 dark:text-fuchsia-400',
  cyan: 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-400',
}

export default function Journey() {
  return (
    <section id="journey" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="grid gap-12 lg:grid-cols-[20rem_1fr] lg:gap-16">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">Journey</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-[2.6rem]">最近的脚步</h2>
          <p className="mt-4 text-[15px] leading-[1.85] text-zinc-600 dark:text-zinc-400">
            以课程实验为主线，每一段都尽量留下可复现的代码与文字记录。
          </p>
        </Reveal>

        <Reveal delay={100}>
          <ol className="relative border-l border-black/10 pl-7 dark:border-white/10">
            {journey.map((item, index) => (
              <li key={item.title} className={index === journey.length - 1 ? 'relative' : 'relative pb-10'}>
                <span className="absolute -left-[35px] top-1.5 grid h-4 w-4 place-items-center rounded-full bg-white ring-1 ring-black/10 dark:bg-[#0b0b0f] dark:ring-white/20">
                  <span className={`h-1.5 w-1.5 rounded-full ${dotColors[item.accent]}`} />
                </span>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                  {item.time}
                </p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-2 max-w-2xl text-[14.5px] leading-[1.85] text-zinc-600 dark:text-zinc-400">
                  {item.desc}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`rounded-md px-2 py-0.5 text-[11.5px] font-medium ${badgeColors[item.accent]}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  )
}
