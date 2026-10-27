import { useCallback, useEffect, useRef, useState } from 'react'
import { PLAYLIST_URL, fetchLyrics, fetchPlaylist, formatTime } from '../lib/meting.js'
import {
  IconChevronRight,
  IconList,
  IconMusic,
  IconNext,
  IconPause,
  IconPlay,
  IconPrev,
  IconVolume,
  IconVolumeMute,
} from './Icons.jsx'

const VOLUME_KEY = 'music:volume'

function readVolume() {
  try {
    const raw = localStorage.getItem(VOLUME_KEY)
    if (raw === null) return 0.75 // 首次访问：localStorage 读不到时 Number(null) 会变成 0（静音）
    const v = Number(raw)
    if (Number.isFinite(v) && v >= 0 && v <= 1) return v
  } catch (e) {}
  return 0.75
}

export default function MusicPlayer() {
  const audioRef = useRef(null)
  const wantPlay = useRef(false) // 记录"播不播"的意图，切歌后据此决定是否自动继续
  const lyricRef = useRef([])
  const failCount = useRef(0)
  const noteTimer = useRef(null)

  const [tracks, setTracks] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | ready | error
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('play') // play | list
  const [cur, setCur] = useState(0)
  const [dur, setDur] = useState(0)
  const [volume, setVolume] = useState(readVolume)
  const [muted, setMuted] = useState(false)
  const [lyricIdx, setLyricIdx] = useState(-1)
  const [note, setNote] = useState('')

  const track = tracks[index] || null

  const toast = useCallback((text) => {
    setNote(text)
    clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(() => setNote(''), 2600)
  }, [])

  useEffect(() => () => clearTimeout(noteTimer.current), [])

  // Esc 收起面板
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  /* ---------- 歌单 ---------- */
  const load = useCallback(async () => {
    if (status === 'loading' || status === 'ready') return
    setStatus('loading')
    try {
      const list = await fetchPlaylist()
      setTracks(list)
      setStatus('ready')
    } catch (e) {
      setStatus('error')
      toast('音乐加载失败，稍后再试试')
    }
  }, [status, toast])

  /* ---------- 音量 ---------- */
  useEffect(() => {
    const a = audioRef.current
    if (a) a.volume = muted ? 0 : volume
    try {
      localStorage.setItem(VOLUME_KEY, String(volume))
    } catch (e) {}
  }, [volume, muted])

  /* ---------- 切歌：换 src，按意图决定是否继续播 ---------- */
  useEffect(() => {
    const a = audioRef.current
    if (!a || !track) return

    a.src = track.url
    setCur(0)
    setDur(0)
    setLyricIdx(-1)

    if (wantPlay.current) {
      a.play()
        .then(() => setPlaying(true))
        .catch(() => {
          setPlaying(false)
          wantPlay.current = false
        })
    } else {
      setPlaying(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.url])

  /* ---------- 歌词 ---------- */
  useEffect(() => {
    if (!track?.lrc) {
      lyricRef.current = []
      setLyricIdx(-1)
      return
    }
    let alive = true
    fetchLyrics(track.lrc).then((lines) => {
      if (!alive) return
      lyricRef.current = lines
      setLyricIdx(-1)
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.lrc])

  /* ---------- 系统媒体控制（音量键 / 耳机键 / 锁屏卡片） ---------- */
  useEffect(() => {
    if (!('mediaSession' in navigator) || !track) return
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: track.name,
        artist: track.artist,
        artwork: track.pic ? [{ src: track.pic, sizes: '300x300', type: 'image/jpeg' }] : [],
      })
      navigator.mediaSession.setActionHandler('play', () => toggle())
      navigator.mediaSession.setActionHandler('pause', () => toggle())
      navigator.mediaSession.setActionHandler('previoustrack', () => prev())
      navigator.mediaSession.setActionHandler('nexttrack', () => step(1))
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.key])

  /* ---------- 交互 ---------- */
  const openPanel = () => {
    setOpen(true)
    setView('play') // 每次拉出都从"正在播放"这面开始，不沿用上次的列表视图
    if (status === 'idle') load()
  }

  const toggle = async () => {
    const a = audioRef.current
    if (!a || !track) return

    if (a.paused) {
      wantPlay.current = true
      try {
        await a.play()
        setPlaying(true)
      } catch (e) {
        setPlaying(false)
        wantPlay.current = false
        toast('浏览器拦下了播放，再点一次试试')
      }
    } else {
      wantPlay.current = false
      a.pause()
      setPlaying(false)
    }
  }

  const step = (d, force = false) => {
    if (tracks.length < 2) return
    const a = audioRef.current
    wantPlay.current = force || (a ? !a.paused : false)
    setIndex((i) => (i + d + tracks.length) % tracks.length)
  }

  const prev = () => {
    const a = audioRef.current
    if (a && a.currentTime > 3) {
      a.currentTime = 0
      setCur(0)
      return
    }
    step(-1)
  }

  const select = (i) => {
    if (i === index) {
      toggle()
      return
    }
    wantPlay.current = true
    setIndex(i)
  }

  const seek = (e) => {
    const a = audioRef.current
    const v = Number(e.target.value)
    if (!a || !Number.isFinite(v)) return
    a.currentTime = v
    setCur(v)
  }

  const onTimeUpdate = (e) => {
    const t = e.currentTarget.currentTime
    setCur(t)

    const lines = lyricRef.current
    if (!lines.length) return

    let lo = 0
    let hi = lines.length - 1
    let found = -1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (lines[mid].time <= t + 0.15) {
        found = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    setLyricIdx((prevIdx) => (prevIdx === found ? prevIdx : found))
  }

  const onError = () => {
    if (!track) return
    failCount.current += 1
    if (failCount.current >= 3) {
      wantPlay.current = false
      setPlaying(false)
      toast('连续几首都播不了，可能接口暂时不可用')
      return
    }
    toast('这首暂时播不了，自动切下一首')
    step(1, true)
  }

  const progress = dur > 0 ? Math.min(100, (cur / dur) * 100) : 0

  const lines = lyricRef.current
  const curLine = lyricIdx >= 0 ? lines[lyricIdx]?.text : ''
  const prevLine = lyricIdx > 0 ? lines[lyricIdx - 1]?.text : ''
  const nextLine = lyricIdx >= 0 ? lines[lyricIdx + 1]?.text : ''

  /* ---------- 渲染 ---------- */
  return (
    <>
      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => {
          failCount.current = 0
          setPlaying(true)
        }}
        onPause={() => setPlaying(false)}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 0)}
        onEnded={() => step(1, true)}
        onError={onError}
      />

      {/* 收起态：贴在右侧中间的抽屉把手 */}
      {!open && (
        <button
          type="button"
          onClick={openPanel}
          aria-label="打开音乐播放器"
          title="音乐"
          className="group fixed right-0 top-1/2 z-50 flex h-20 w-10 -translate-y-1/2 items-center justify-center rounded-l-2xl bg-gradient-to-b from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:w-[3.15rem] hover:shadow-xl hover:shadow-fuchsia-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:h-24 sm:w-11 dark:focus-visible:ring-offset-ink"
        >
          {playing && (
            <span className="absolute inset-0 rounded-l-2xl bg-fuchsia-300/25 mp-handle-pulse" aria-hidden="true" />
          )}
          <IconMusic className="relative h-[22px] w-[22px]" />
        </button>
      )}

      {/* 展开态：从右侧拉出的大面板 */}
      {open && (
        <div
          role="region"
          aria-label="音乐播放器"
          className="fixed right-0 top-1/2 z-50 -translate-y-1/2"
        >
          <div className="mp-in flex max-h-[calc(100dvh-1.5rem)] w-[min(92vw,420px)] flex-col overflow-hidden rounded-l-[1.75rem] border border-r-0 border-black/[0.07] bg-white/95 shadow-[0_28px_80px_-24px_rgba(9,9,11,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0d0d11]/95 dark:shadow-black/70">
            {/* 顶部：标签 + 歌单 + 收起（固定在面板顶端，不随内容滚动） */}
            <div className="flex shrink-0 items-center justify-between px-5 pb-1 pt-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                Now Playing
              </span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setView(view === 'list' ? 'play' : 'list')}
                  aria-label={view === 'list' ? '返回播放界面' : '查看播放列表'}
                  aria-pressed={view === 'list'}
                  className={`grid h-8 w-8 place-items-center rounded-full transition hover:bg-black/5 dark:hover:bg-white/10 ${
                    view === 'list'
                      ? 'text-indigo-500 dark:text-indigo-400'
                      : 'text-zinc-500 hover:text-ink dark:text-zinc-400 dark:hover:text-white'
                  }`}
                >
                  <IconList className="h-[17px] w-[17px]" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="收起播放器"
                  className="grid h-8 w-8 place-items-center rounded-full text-zinc-500 transition hover:bg-black/5 hover:text-ink dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <IconChevronRight className="h-[17px] w-[17px]" />
                </button>
              </div>
            </div>

            {/* 内容区独立滚动：歌单再长，顶部栏和收起按钮也不会被滚走 */}
            <div className="thin-scroll min-h-0 flex-1 overflow-y-auto">
              {view === 'play' ? (
                <div className="px-5 pb-5">
                  {/* 封面 */}
                  <div className="flex justify-center pt-1.5">
                    <div className="relative h-[190px] w-[190px] overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-indigo-500/20">
                      {track?.pic && (
                        <img
                          src={track.pic}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      )}
                      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,.28),transparent_58%)]" />
                    </div>
                  </div>

                  {/* 曲名 / 歌手 */}
                  <div className="mt-4 text-center">
                    <p className="line-clamp-2 px-1 text-[15px] font-semibold leading-snug tracking-tight">
                      {track?.name || (status === 'error' ? '加载失败' : '正在读取歌单…')}
                    </p>
                    <p className="mt-1 truncate text-[12px] text-zinc-500 dark:text-zinc-400">
                      {track?.artist || 'Coco 的歌单'}
                    </p>
                  </div>

                  {/* 歌词：上一行 / 当前行 / 下一行 */}
                  <div className="mt-3 h-[58px] space-y-1 text-center">
                    <p className="truncate text-[11.5px] text-zinc-400/80 dark:text-zinc-500">{prevLine || ' '}</p>
                    <p className="truncate text-[12.5px] font-medium text-ink dark:text-zinc-100">
                      {curLine || (playing ? '· · ·' : ' ')}
                    </p>
                    <p className="truncate text-[11.5px] text-zinc-400/80 dark:text-zinc-500">{nextLine || ' '}</p>
                  </div>

                  {/* 进度 */}
                  <div className="mt-2.5">
                    <input
                      type="range"
                      className="range w-full"
                      min={0}
                      max={dur || 0}
                      step={0.1}
                      value={cur}
                      onChange={seek}
                      style={{ '--p': `${progress}%` }}
                      aria-label="播放进度"
                      disabled={!dur}
                    />
                    <div className="mt-1.5 flex items-center justify-between text-[10.5px] tabular-nums text-zinc-400 dark:text-zinc-500">
                      <span>{formatTime(cur)}</span>
                      <span>{formatTime(dur)}</span>
                    </div>
                  </div>

                  {/* 控制 */}
                  <div className="mt-3 flex items-center justify-center gap-6">
                    <button
                      type="button"
                      onClick={prev}
                      aria-label="上一首"
                      className="grid h-10 w-10 place-items-center rounded-full text-zinc-600 transition hover:bg-black/5 hover:text-ink dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <IconPrev className="h-[19px] w-[19px]" />
                    </button>
                    <button
                      type="button"
                      onClick={toggle}
                      aria-label={playing ? '暂停' : '播放'}
                      className="grid h-14 w-14 place-items-center rounded-full bg-ink text-white shadow-lg shadow-ink/25 transition hover:scale-105 active:scale-95 dark:bg-white dark:text-ink dark:shadow-white/10"
                    >
                      {playing ? (
                        <IconPause className="h-[22px] w-[22px]" />
                      ) : (
                        <IconPlay className="h-[22px] w-[22px] translate-x-[1px]" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => step(1)}
                      aria-label="下一首"
                      className="grid h-10 w-10 place-items-center rounded-full text-zinc-600 transition hover:bg-black/5 hover:text-ink dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <IconNext className="h-[19px] w-[19px]" />
                    </button>
                  </div>

                  {/* 音量 */}
                  <div className="mt-4 flex items-center gap-2.5 border-t border-black/[0.06] pt-3.5 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setMuted((m) => !m)}
                      aria-label={muted ? '取消静音' : '静音'}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-zinc-500 transition hover:bg-black/5 hover:text-ink dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      {muted || volume === 0 ? <IconVolumeMute className="h-[17px] w-[17px]" /> : <IconVolume className="h-[17px] w-[17px]" />}
                    </button>
                    <input
                      type="range"
                      className="range flex-1"
                      min={0}
                      max={1}
                      step={0.01}
                      value={muted ? 0 : volume}
                      onChange={(e) => {
                        setMuted(false)
                        setVolume(Number(e.target.value))
                      }}
                      style={{ '--p': `${(muted ? 0 : volume) * 100}%` }}
                      aria-label="音量"
                    />
                    <span className="w-8 shrink-0 text-right text-[10.5px] tabular-nums text-zinc-400 dark:text-zinc-500">
                      {Math.round((muted ? 0 : volume) * 100)}
                    </span>
                  </div>
                </div>
              ) : (
                /* 播放列表 */
                <div className="border-t border-black/[0.06] dark:border-white/10">
                  <div className="flex items-center justify-between px-5 pb-1.5 pt-3">
                    <p className="text-[11.5px] font-medium text-zinc-500 dark:text-zinc-400">
                      {status === 'ready' ? `歌单 · ${tracks.length} 首` : '歌单'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setView('play')}
                      className="text-[11.5px] font-medium text-indigo-500 transition hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      返回播放
                    </button>
                  </div>

                  {status === 'loading' && (
                    <p className="px-5 py-10 text-center text-[12.5px] text-zinc-500">正在读取歌单…</p>
                  )}
                  {status === 'error' && (
                    <div className="px-5 py-10 text-center">
                      <p className="text-[12.5px] text-zinc-500">歌单没加载出来</p>
                      <button
                        type="button"
                        onClick={() => load()}
                        className="mt-2.5 rounded-full border border-black/10 px-3.5 py-1.5 text-[12px] font-medium transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                      >
                        重试
                      </button>
                    </div>
                  )}

                  {tracks.map((t, i) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => select(i)}
                      className={`flex w-full items-center gap-3 px-5 py-2.5 text-left transition hover:bg-black/[0.04] dark:hover:bg-white/[0.06] ${
                        i === index ? 'bg-black/[0.05] dark:bg-white/[0.08]' : ''
                      }`}
                    >
                      <span
                        className={`w-5 shrink-0 text-center text-[11px] tabular-nums ${
                          i === index
                            ? 'font-semibold text-indigo-500 dark:text-indigo-400'
                            : 'text-zinc-400 dark:text-zinc-500'
                        }`}
                      >
                        {i === index && playing ? '♪' : i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-[13px] ${
                            i === index ? 'font-semibold text-ink dark:text-white' : 'text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {t.name}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                          {t.artist}
                        </span>
                      </span>
                    </button>
                  ))}

                  <a
                    href={PLAYLIST_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border-t border-black/[0.06] px-5 py-3 text-center text-[11.5px] text-zinc-500 transition hover:text-ink dark:border-white/10 dark:hover:text-white"
                  >
                    在网易云打开原歌单 ↗
                  </a>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* 提示条（放在面板外层，避开 transform 容器对 fixed 的影响） */}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-3.5 py-2 text-[11.5px] font-medium text-white shadow-lg transition dark:bg-white dark:text-ink ${
          note ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {note || '　'}
      </div>
    </>
  )
}
