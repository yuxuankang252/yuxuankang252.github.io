import { projects } from '../data/site.js'
import Reveal from './Reveal.jsx'

function CoverArt({ art }) {
  if (art === 'curve') {
    return (
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 250" fill="none" aria-hidden="true">
        <path
          d="M0 200 L60 180 L110 188 L160 140 L210 150 L260 96 L310 108 L360 54 L400 66"
          stroke="rgba(255,255,255,.9)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M0 200 L60 180 L110 188 L160 140 L210 150 L260 96 L310 108 L360 54 L400 66 V250 H0Z"
          fill="rgba(255,255,255,.12)"
        />
        <circle cx="360" cy="54" r="5" fill="white" />
      </svg>
    )
  }

  if (art === 'layout') {
    return (
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 250" fill="none" aria-hidden="true">
        <rect x="40" y="34" width="150" height="182" rx="12" fill="rgba(255,255,255,.22)" />
        <rect x="58" y="58" width="80" height="7" rx="3.5" fill="white" opacity=".9" />
        <rect x="58" y="80" width="112" height="6" rx="3" fill="white" opacity=".55" />
        <rect x="58" y="96" width="100" height="6" rx="3" fill="white" opacity=".55" />
        <rect x="58" y="112" width="112" height="6" rx="3" fill="white" opacity=".55" />
        <rect x="210" y="86" width="150" height="130" rx="12" fill="rgba(255,255,255,.16)" />
        <rect x="228" y="110" width="70" height="7" rx="3.5" fill="white" opacity=".85" />
        <rect x="228" y="132" width="110" height="6" rx="3" fill="white" opacity=".5" />
        <rect x="228" y="148" width="88" height="6" rx="3" fill="white" opacity=".5" />
      </svg>
    )
  }

  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 250" fill="none" aria-hidden="true">
      <circle cx="150" cy="120" r="66" stroke="white" strokeWidth="1.6" opacity=".85" />
      <circle cx="250" cy="120" r="66" stroke="white" strokeWidth="1.6" opacity=".55" />
      <path d="M150 54v132M84 120h132" stroke="white" strokeWidth="1" opacity=".4" />
      <circle cx="150" cy="120" r="4" fill="white" />
      <circle cx="250" cy="120" r="4" fill="white" />
      <path d="M216 84l68-30M216 156l68 30" stroke="white" strokeWidth="1.2" opacity=".5" strokeDasharray="4 4" />
    </svg>
  )
}

export default function Projects() {
  return (
    <section id="projects" className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="blob right-0 top-24 h-[22rem] w-[22rem] bg-indigo-300/25 dark:bg-indigo-700/20" />
      </div>

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">Work</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-[2.6rem]">做过的东西</h2>
          </div>
          <p className="max-w-sm text-[14px] leading-relaxed text-zinc-500">
            都是从零开始的练习项目，代码和结论都能复现。
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {projects.map((project, index) => (
            <Reveal key={project.title} delay={index * 80}>
              <article className="card-hover h-full overflow-hidden rounded-3xl border border-black/5 bg-white/70 shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
                <div className={`relative aspect-[16/10] overflow-hidden bg-gradient-to-br ${project.gradient}`}>
                  <CoverArt art={project.art} />
                  <span className="absolute left-4 top-4 rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                    {project.kind}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-[16px] font-semibold tracking-tight">{project.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-[1.8] text-zinc-600 dark:text-zinc-400">
                    {project.desc}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-zinc-500/10 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-white/10 dark:text-zinc-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
