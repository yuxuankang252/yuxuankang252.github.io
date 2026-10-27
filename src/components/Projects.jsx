import { useCallback, useEffect, useRef, useState } from 'react'
import { projects } from '../data/site.js'
import Reveal from './Reveal.jsx'
import { IconChevronLeft, IconChevronRight } from './Icons.jsx'

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
  const trackRef = useRef(null)
  const cardRefs = useRef([])
  const drag = useRef(null)
  const snapTimer = useRef(0)
  const [active, setActive] = useState(0)
  const [edges, setEdges] = useState({ start: true, end: false })

  // 当前第几张：以卡片左边缘最接近可视区左缘为准；滑到两端时强制取首尾
  const indexAt = useCallback(() => {
    const track = trackRef.current
    if (!track) return 0
    const max = track.scrollWidth - track.clientWidth
    const x = track.scrollLeft
    if (max <= 2 || x <= 2) return 0
    if (x >= max - 2) return projects.length - 1
    const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0
    let best = 0
    let bestDist = Infinity
    cardRefs.current.forEach((el, i) => {
      if (!el) return
      const dist = Math.abs(el.offsetLeft - pad - x)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    return best
  }, [])

  const sync = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const max = track.scrollWidth - track.clientWidth
    setActive(indexAt())
    setEdges({ start: track.scrollLeft <= 2, end: track.scrollLeft >= max - 2 })
  }, [indexAt])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        sync()
      })
    }
    sync()
    track.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', sync)
    return () => {
      track.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', sync)
      if (raf) cancelAnimationFrame(raf)
      clearTimeout(snapTimer.current)
    }
  }, [sync])

  const goTo = useCallback((index) => {
    const track = trackRef.current
    if (!track) return
    const i = Math.min(Math.max(index, 0), projects.length - 1)
    const el = cardRefs.current[i]
    if (!el) return
    const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0
    track.scrollTo({ left: Math.max(0, el.offsetLeft - pad), behavior: 'smooth' })
  }, [])

  /* 鼠标按住左右拖动（触屏用原生滑动，不接管） */
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    const track = trackRef.current
    if (!track) return
    drag.current = { x: e.clientX, left: track.scrollLeft, moved: 0 }
    track.style.scrollSnapType = 'none'
    track.style.cursor = 'grabbing'
    track.classList.add('select-none')
  }

  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    d.moved = Math.max(d.moved, Math.abs(dx))
    if (Math.abs(dx) > 2) trackRef.current.scrollLeft = d.left - dx
  }

  const onPointerUp = () => {
    if (!drag.current) return
    const moved = drag.current.moved
    drag.current = null
    const track = trackRef.current
    track.classList.remove('select-none')
    track.style.cursor = ''
    if (moved > 4) {
      // 先算出落点再做平滑吸附，动画结束前不要恢复 snap，否则会被瞬间吸走
      goTo(indexAt())
      clearTimeout(snapTimer.current)
      snapTimer.current = setTimeout(() => {
        track.style.scrollSnapType = 'x mandatory'
      }, 520)
    } else {
      track.style.scrollSnapType = 'x mandatory'
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      goTo(active - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      goTo(active + 1)
    }
  }

  const total = String(projects.length).padStart(2, '0')

  return (
    <section id="projects" className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="blob right-0 top-24 h-[22rem] w-[22rem] bg-indigo-300/25 dark:bg-indigo-700/20" />
      </div>

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">Work</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-[2.6rem]">做过的东西</h2>
            <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-zinc-500">
              都是从零开始的练习项目，代码和结论都能复现。
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-[12px] tabular-nums text-zinc-400 dark:text-zinc-500">
              <span className="text-zinc-900 dark:text-zinc-100">{String(active + 1).padStart(2, '0')}</span>
              {' / '}
              {total}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => goTo(active - 1)}
                disabled={edges.start}
                aria-label="上一个项目"
                className="grid h-10 w-10 place-items-center rounded-full border border-black/8 bg-white/70 text-zinc-700 transition hover:-translate-y-0.5 hover:border-black/15 hover:text-zinc-950 disabled:pointer-events-none disabled:opacity-30 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-200 dark:hover:border-white/20"
              >
                <IconChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => goTo(active + 1)}
                disabled={edges.end}
                aria-label="下一个项目"
                className="grid h-10 w-10 place-items-center rounded-full border border-black/8 bg-white/70 text-zinc-700 transition hover:-translate-y-0.5 hover:border-black/15 hover:text-zinc-950 disabled:pointer-events-none disabled:opacity-30 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-200 dark:hover:border-white/20"
              >
                <IconChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div
            ref={trackRef}
            role="group"
            aria-roledescription="轮播"
            aria-label="项目列表，可左右滑动"
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onKeyDown={onKeyDown}
            className="no-scrollbar relative -mx-5 mt-10 flex cursor-grab items-stretch gap-5 overflow-x-auto scroll-px-5 px-5 pb-2 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 sm:-mx-8 sm:scroll-px-8 sm:px-8"
            style={{ scrollSnapType: 'x mandatory', overscrollBehaviorX: 'contain' }}
          >
            {projects.map((project, index) => (
              <article
                key={project.title}
                ref={(el) => {
                  cardRefs.current[index] = el
                }}
                aria-label={`${index + 1} / ${projects.length}：${project.title}`}
                className="card-hover group grid w-[86vw] shrink-0 snap-start overflow-hidden rounded-3xl border border-black/5 bg-white/70 shadow-soft backdrop-blur sm:w-[min(80%,768px)] sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div
                  className={`relative aspect-[16/10] select-none overflow-hidden bg-gradient-to-br sm:aspect-auto sm:min-h-[280px] ${project.gradient}`}
                >
                  <CoverArt art={project.art} />
                  <span className="absolute left-4 top-4 rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                    {project.kind}
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute bottom-3 right-4 font-mono text-[42px] font-semibold leading-none text-white/25 tabular-nums"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <div className="flex flex-col p-6 sm:p-7">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                    {project.time}
                  </p>
                  <h3 className="mt-2 text-[17px] font-semibold leading-snug tracking-tight">{project.title}</h3>
                  <p className="mt-2.5 text-[13.5px] leading-[1.8] text-zinc-600 dark:text-zinc-400">
                    {project.desc}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-5">
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
            ))}
          </div>
        </Reveal>

        <div className="mt-6 flex items-center justify-center gap-2">
          {projects.map((project, index) => (
            <button
              key={project.title}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`跳到第 ${index + 1} 个：${project.title}`}
              aria-current={index === active}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === active
                  ? 'w-7 bg-indigo-500'
                  : 'w-1.5 bg-zinc-400/40 hover:bg-zinc-400/70 dark:bg-white/20 dark:hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
