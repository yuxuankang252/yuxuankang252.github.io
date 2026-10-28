import { useCallback, useEffect, useRef, useState } from 'react'
import { journey } from '../data/site.js'
import Reveal from './Reveal.jsx'
import { IconChevronLeft, IconChevronRight } from './Icons.jsx'

/* 时间轴节点颜色 */
const dotColors = {
  indigo: 'bg-indigo-500',
  fuchsia: 'bg-fuchsia-500',
  cyan: 'bg-cyan-500',
}

/* 封面插图：不用图片，直接画，体积为零 */
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

export default function Journey() {
  const trackRef = useRef(null)
  const cardRefs = useRef([])
  const drag = useRef(null)
  const snapTimer = useRef(0)
  const [active, setActive] = useState(0)
  const [edges, setEdges] = useState({ start: true, end: false })

  const total = journey.length

  // 当前第几条：以卡片左边缘最接近可视区左缘为准；滑到两端时强制取首尾
  const indexAt = useCallback(() => {
    const track = trackRef.current
    if (!track) return 0
    const max = track.scrollWidth - track.clientWidth
    const x = track.scrollLeft
    if (max <= 2 || x <= 2) return 0
    if (x >= max - 2) return total - 1
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
  }, [total])

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

  const goTo = useCallback(
    (index) => {
      const track = trackRef.current
      if (!track) return
      const i = Math.min(Math.max(index, 0), total - 1)
      const el = cardRefs.current[i]
      if (!el) return
      const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0
      track.scrollTo({ left: Math.max(0, el.offsetLeft - pad), behavior: 'smooth' })
    },
    [total]
  )

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

  return (
    <section id="journey" className="relative overflow-hidden py-20 sm:py-28">
      {/* 旧链接 #projects 依然能落到这里 */}
      <span id="projects" aria-hidden="true" className="absolute -top-24 block h-0 w-0" />

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="blob left-0 top-20 h-[20rem] w-[20rem] bg-indigo-300/20 dark:bg-indigo-700/20" />
      </div>

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">Journey</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-[2.6rem]">最近的脚步</h2>
            <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-zinc-500">
              课程实验和做出来的东西按时间排成一条线，从最近的一条往回看。
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="font-mono text-[12px] tabular-nums text-zinc-400 dark:text-zinc-500">
              <span className="text-zinc-900 dark:text-zinc-100">{String(active + 1).padStart(2, '0')}</span>
              {' / '}
              {String(total).padStart(2, '0')}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => goTo(active - 1)}
                disabled={edges.start}
                aria-label="上一条"
                className="grid h-10 w-10 place-items-center rounded-full border border-black/8 bg-white/70 text-zinc-700 transition hover:-translate-y-0.5 hover:border-black/15 hover:text-zinc-950 disabled:pointer-events-none disabled:opacity-30 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-200 dark:hover:border-white/20"
              >
                <IconChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => goTo(active + 1)}
                disabled={edges.end}
                aria-label="下一条"
                className="grid h-10 w-10 place-items-center rounded-full border border-black/8 bg-white/70 text-zinc-700 transition hover:-translate-y-0.5 hover:border-black/15 hover:text-zinc-950 disabled:pointer-events-none disabled:opacity-30 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-200 dark:hover:border-white/20"
              >
                <IconChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Reveal>

        <Reveal delay={80} className="relative mt-10">
          <div
            ref={trackRef}
            role="group"
            aria-roledescription="轮播"
            aria-label="成长时间线，可左右滑动"
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onKeyDown={onKeyDown}
            className="no-scrollbar relative -mx-5 flex cursor-grab items-stretch gap-5 overflow-x-auto scroll-px-5 px-5 pb-2 pt-1 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500/40 sm:-mx-8 sm:scroll-px-8 sm:px-8"
            style={{ scrollSnapType: 'x mandatory', overscrollBehaviorX: 'contain' }}
          >
            {journey.map((item, index) => (
              <div
                key={item.title}
                ref={(el) => {
                  cardRefs.current[index] = el
                }}
                className="w-[86vw] shrink-0 snap-start sm:w-[min(80%,720px)]"
              >
                {/* 时间轴：圆点 + 连到下一张的细线 */}
                <div className="relative flex h-5 items-center">
                  <span
                    aria-hidden="true"
                    className="absolute left-[9px] top-1/2 h-px w-[calc(100%-9px+1.25rem)] bg-gradient-to-r from-black/15 to-black/[0.06] dark:from-white/20 dark:to-white/[0.06]"
                  />
                  <span className="relative z-10 grid h-[18px] w-[18px] place-items-center rounded-full bg-[#fafafa] ring-1 ring-black/10 dark:bg-[#08080a] dark:ring-white/20">
                    <span className={`h-2 w-2 rounded-full ${dotColors[item.accent]}`} />
                  </span>
                </div>

                <article
                  aria-label={`第 ${index + 1} 条，共 ${total} 条：${item.title}`}
                  className="card-hover group mt-3 grid overflow-hidden rounded-3xl border border-black/5 bg-white/70 shadow-soft backdrop-blur sm:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div
                    className={`relative aspect-[16/10] select-none overflow-hidden bg-gradient-to-br sm:aspect-auto sm:min-h-[288px] ${item.gradient}`}
                  >
                    <CoverArt art={item.art} />
                    <span className="absolute left-4 top-4 rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                      {item.kind}
                    </span>
                    <span
                      aria-hidden="true"
                      className="absolute bottom-3 right-4 font-mono text-[42px] font-semibold leading-none text-white/25 tabular-nums"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="flex flex-col p-6 sm:p-7">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                        {item.time}
                      </p>
                      {index === 0 && (
                        <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10.5px] font-medium text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
                          最新
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 text-[17px] font-semibold leading-snug tracking-tight">{item.title}</h3>
                    <p className="mt-2.5 text-[13.5px] leading-[1.8] text-zinc-600 dark:text-zinc-400">
                      {item.desc}
                    </p>
                    <div className="mt-auto flex flex-wrap gap-2 pt-5">
                      {item.tags.map((tag) => (
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
              </div>
            ))}
          </div>

          {/* 露出来的下一张边缘往背景淡出，避免文字被硬生生切断 */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 -right-5 hidden w-16 bg-gradient-to-l from-[#fafafa] via-[#fafafa]/65 to-transparent transition-opacity duration-300 sm:-right-8 sm:block dark:from-[#08080a] dark:via-[#08080a]/65 ${
              edges.end ? 'opacity-0' : 'opacity-100'
            }`}
          />
        </Reveal>

        <div className="mt-6 flex items-center justify-center gap-2">
          {journey.map((item, index) => (
            <button
              key={item.title}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`跳到第 ${index + 1} 条：${item.title}`}
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
