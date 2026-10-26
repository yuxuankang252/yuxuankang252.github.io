import { useCallback, useEffect, useRef, useState } from 'react'
import { PLAYLIST_URL, fetchLyrics, fetchPlaylist, formatTime } from '../lib/meting.js'
import {
  IconChevronDown,
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
    const v = Number(localStorage.getItem(VOLUME_KEY))
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
  const lyricText = lyricIdx >= 0 ? lyricRef.current[lyricIdx]?.text : ''

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

      {!open && (
        <button
          type="button"
          onClick={openPanel}
          aria-label="打开音乐播放器"
          className="group fixed bottom-5 right-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-xl shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-fuchsia-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-ink sm:right-5"
        >
          {playing && (
            <span className="absolute inset-0 animate-ping rounded-full bg-fuchsia-400/30" aria-hidden="true" />
          )}
          <IconMusic className="relative h-6 w-6" />
        </button>
      )}

      {open && (
        <div
          role="region"
          aria-label="音乐播放器"
          className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[354px]"
        >
          <div className="overflow-hidden rounded-3xl border border-black/[0.07] bg-white/90 shadow-2xl shadow-black/15 backdrop-blur-xl dark:border-white/10 dark:bg-[#101014]/95 dark:shadow-black/60">
            {/* 顶部：封面 + 曲名 */}
            <div className="flex items-center gap-3 p-3.5">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500">
                {track?.pic && <img src={track.pic} alt="" loading="lazy" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold tracking-tight">
                  {track?.name || (status === 'error' ? '加载失败' : '正在读取歌单…')}
                </p>
                <p className="mt-0.5 truncate text-[11.5px] text-zinc-500 dark:text-zinc-400">
                  {track?.artist || 'Coco 的歌单'}
                </p>
              </div>
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
                <IconList />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="收起播放器"
                className="grid h-8 w-8 place-items-center rounded-full text-zinc-500 transition hover:bg-black/5 hover:text-ink dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <IconChevronDown />
              </button>
            </div>

            {view === 'play' ? (
              <>
                {/* 进度条 */}
                <div className="px-4">
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
                  <div className="mt-1 flex items-center justify-between text-[10.5px] tabular-nums text-zinc-400 dark:text-zinc-500">
                    <span>{formatTime(cur)}</span>
                    <span>{formatTime(dur)}</span>
                  </div>
                </div>

                {/* 歌词（单行） */}
                <p className="mt-1.5 h-[18px] truncate px-5 text-center text-[11.5px] text-zinc-500 dark:text-zinc-400">
                  {lyricText || (playing ? '· · ·' : '')}
                </p>

                {/* 控制条 */}
                <div className="flex items-center justify-between px-3.5 pb-3.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setMuted((m) => !m)}
                    aria-label={muted ? '取消静音' : '静音'}
                    className="grid h-8 w-8 place-items-center rounded-full text-zinc-500 transition hover:bg-black/5 hover:text-ink dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    {muted || volume === 0 ? <IconVolumeMute /> : <IconVolume />}
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={prev}
                      aria-label="上一首"
                      className="grid h-9 w-9 place-items-center rounded-full text-zinc-600 transition hover:bg-black/5 hover:text-ink dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <IconPrev className="h-[17px] w-[17px]" />
                    </button>
                    <button
                      type="button"
                      onClick={toggle}
                      aria-label={playing ? '暂停' : '播放'}
                      className="grid h-11 w-11 place-items-center rounded-full bg-ink text-white shadow-lg shadow-ink/25 transition hover:scale-105 active:scale-95 dark:bg-white dark:text-ink dark:shadow-white/10"
                    >
                      {playing ? (
                        <IconPause className="h-[19px] w-[19px]" />
                      ) : (
                        <IconPlay className="h-[19px] w-[19px] translate-x-[1px]" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => step(1)}
                      aria-label="下一首"
                      className="grid h-9 w-9 place-items-center rounded-full text-zinc-600 transition hover:bg-black/5 hover:text-ink dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <IconNext className="h-[17px] w-[17px]" />
                    </button>
                  </div>

                  <input
                    type="range"
                    className="range w-14"
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
                </div>
              </>
            ) : (
              /* 播放列表 */
              <div className="thin-scroll max-h-[min(56vh,330px)] overflow-y-auto border-t border-black/[0.06] dark:border-white/10">
                {status === 'loading' && (
                  <p className="px-4 py-6 text-center text-[12px] text-zinc-500">正在读取歌单…</p>
                )}
                {status === 'error' && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-[12px] text-zinc-500">歌单没加载出来</p>
                    <button
                      type="button"
                      onClick={() => load()}
                      className="mt-2 rounded-full border border-black/10 px-3 py-1 text-[12px] font-medium transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
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
                    className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition hover:bg-black/[0.04] dark:hover:bg-white/[0.06] ${
                      i === index ? 'bg-black/[0.05] dark:bg-white/[0.08]' : ''
                    }`}
                  >
                    <span
                      className={`w-4 shrink-0 text-center text-[11px] tabular-nums ${
                        i === index
                          ? 'font-semibold text-indigo-500 dark:text-indigo-400'
                          : 'text-zinc-400 dark:text-zinc-500'
                      }`}
                    >
                      {i === index && playing ? '♪' : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-[12.5px] ${
                          i === index
                            ? 'font-semibold text-ink dark:text-white'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {t.name}
                      </span>
                      <span className="block truncate text-[11px] text-zinc-400 dark:text-zinc-500">{t.artist}</span>
                    </span>
                  </button>
                ))}
                <a
                  href={PLAYLIST_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border-t border-black/[0.06] px-3.5 py-2.5 text-center text-[11.5px] text-zinc-500 transition hover:text-ink dark:border-white/10 dark:hover:text-white"
                >
                  在网易云打开原歌单 ↗
                </a>
              </div>
            )}
          </div>

          {/* 提示条 */}
          <div
            role="status"
            aria-live="polite"
            className={`pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-[11.5px] font-medium text-white shadow-lg transition dark:bg-white dark:text-ink ${
              note ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {note || '　'}
          </div>
        </div>
      )}
    </>
  )
}

