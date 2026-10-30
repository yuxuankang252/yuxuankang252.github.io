import { useCallback, useEffect, useRef, useState } from 'react'
import { PLAYLISTS, fetchLyrics, fetchPlaylist, formatTime } from '../lib/meting.js'
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

// 首页和博客是两个独立的 HTML 入口（Vite 多页），点「博客」是整页导航：
// 旧页面卸载 → <audio> 一起销毁 → 声音必然断掉。跨文档没法让同一个音频元素活下来，
// 所以退一步：把「在放哪首、放到第几秒、要不要接着放」写进 sessionStorage，新页面接着播。
const RESUME_KEY = 'music:resume'

function readVolume() {
  try {
    const raw = localStorage.getItem(VOLUME_KEY)
    if (raw === null) return 0.75 // 首次访问：localStorage 读不到时 Number(null) 会变成 0（静音）
    const v = Number(raw)
    if (Number.isFinite(v) && v >= 0 && v <= 1) return v
  } catch (e) {}
  return 0.75
}

// 读上一次的播放状态；十分钟以前的不算，免得隔太久突然出声
function readResume() {
  try {
    const raw = sessionStorage.getItem(RESUME_KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (!s || !s.name) return null
    if (Date.now() - (Number(s.at) || 0) > 10 * 60 * 1000) return null
    return s // playing 为 false 时只记「上次听的是哪首」，不自动播
  } catch (e) {
    return null
  }
}

export default function MusicPlayer() {
  const audioRef = useRef(null)
  const wantPlay = useRef(false) // 记录"播不播"的意图，切歌后据此决定是否自动继续
  const lyricRef = useRef([])
  const failCount = useRef(0)
  const noteTimer = useRef(null)
  const resumeRef = useRef(null) // 上一次在播的歌，等歌单到位后接上
  const pendingSeek = useRef(null) // 换页续播时要跳到的秒数
  const snap = useRef({ name: '', artist: '' }) // 当前曲目，写 sessionStorage 用
  const volRef = useRef({ volume: 0.75, muted: false })
  const lastSave = useRef(0)
  const autoLoadStarted = useRef(false)

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
  const [refreshing, setRefreshing] = useState(false)
  const [needTap, setNeedTap] = useState(false) // 换页后浏览器拦了自动播放，等用户点一下

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
  const load = useCallback(
    async (force = false) => {
      if (status === 'loading') return
      const hasList = tracks.length > 0
      if (!hasList) setStatus('loading')
      if (force) setRefreshing(true)
      try {
        const list = await fetchPlaylist({ force })
        setTracks(list)
        // 歌单顺序会变（新歌插在前面），按「歌名 + 歌手」重新定位当前这首，别让正在播的歌跳掉
        setIndex((i) => {
          const cur = tracks[i]
          if (!cur) return 0
          const j = list.findIndex((t) => t.name === cur.name && t.artist === cur.artist)
          return j >= 0 ? j : 0
        })
        setStatus('ready')
      } catch (e) {
        if (hasList) {
          setStatus('ready')
          toast('歌单刷新失败，继续用上次的列表')
        } else {
          setStatus('error')
          toast('音乐加载失败，稍后再试试')
        }
      } finally {
        setRefreshing(false)
      }
    },
    [status, tracks, toast],
  )

  /* ---------- 跨页面续播 ---------- */
  // 写一次「现在放到哪」，供下一个页面接上
  const saveState = useCallback(() => {
    const a = audioRef.current
    const s = snap.current
    if (!a || !s.name) return
    // 「播不播」看的是意图而不是 paused：整页跳转时浏览器会先把音频暂停，
    // 用 paused 判断会把意图丢掉，下一页就接不上了。
    const playing = wantPlay.current
    try {
      sessionStorage.setItem(
        RESUME_KEY,
        JSON.stringify({
          name: s.name,
          artist: s.artist,
          time: a.currentTime || 0,
          playing,
          volume: volRef.current.volume,
          muted: volRef.current.muted,
          at: Date.now(),
        }),
      )
    } catch (e) {}
  }, [])

  useEffect(() => {
    volRef.current = { volume, muted }
  }, [volume, muted])

  // 新页面挂载：有没播完的歌就先把歌单拉下来，等定位到那首再接着放
  useEffect(() => {
    const r = readResume()
    if (!r) return
    resumeRef.current = r
    if (Number.isFinite(r.volume) && r.volume >= 0 && r.volume <= 1) setVolume(r.volume)
    if (typeof r.muted === 'boolean') setMuted(r.muted)
    if (autoLoadStarted.current) return
    autoLoadStarted.current = true
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 歌单到位后，按「歌名 + 歌手」把上次那首找出来
  useEffect(() => {
    const r = resumeRef.current
    if (!r || !tracks.length) return
    const j = tracks.findIndex((t) => t.name === r.name && t.artist === r.artist)
    if (j < 0) {
      resumeRef.current = null // 歌被移出歌单了，就别硬找
      return
    }
    if (j !== index) setIndex(j)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks])

  // 关页 / 切后台时存一次：整页导航时 pagehide 里的 currentTime 最准
  useEffect(() => {
    const onHide = () => saveState()
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') onHide()
    }
    window.addEventListener('pagehide', onHide)
    window.addEventListener('beforeunload', onHide)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', onHide)
      window.removeEventListener('beforeunload', onHide)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [saveState])

  // 换页后浏览器不认「自动播放」：用户在新页面上随便点一下或按个键，就把歌接上
  useEffect(() => {
    if (!needTap) return
    const resume = () => {
      const a = audioRef.current
      if (!a) return
      wantPlay.current = true
      a.play()
        .then(() => {
          setPlaying(true)
          setNeedTap(false)
        })
        .catch(() => {})
    }
    window.addEventListener('pointerdown', resume, true)
    window.addEventListener('keydown', resume, true)
    return () => {
      window.removeEventListener('pointerdown', resume, true)
      window.removeEventListener('keydown', resume, true)
    }
  }, [needTap])

  // 从 bfcache 返回（浏览器把整页缓存了，JS 不会重跑）：手动把歌接回来
  useEffect(() => {
    const onPageShow = (e) => {
      if (!e.persisted) return
      const a = audioRef.current
      if (!a || !snap.current.name || !wantPlay.current || !a.paused) return
      // 缓存里存的是离开那一刻的进度，sessionStorage 可能更新（在另一页又放了一会儿）
      const s = readResume()
      const t = s && s.name === snap.current.name ? Number(s.time) || 0 : 0
      if (Number.isFinite(t) && t > a.currentTime + 1) {
        try {
          a.currentTime = t
          setCur(t)
        } catch (err) {}
      }
      a.play()
        .then(() => {
          setPlaying(true)
          setNeedTap(false)
        })
        .catch(() => setNeedTap(true))
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

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
    snap.current = { name: track.name, artist: track.artist }

    // 这条正好是上一个页面那首：把进度接上；上次在播才继续播
    const r = resumeRef.current
    const isResume = !!(r && r.name === track.name && r.artist === track.artist)
    if (isResume) {
      resumeRef.current = null
      // 在播的才补上页面切换花掉的那一两秒（暂停着过来的不该跳时间）
      const waited = r.playing
        ? Math.max(0, Math.min(20, (Date.now() - (Number(r.at) || Date.now())) / 1000))
        : 0
      const target = Math.max(0, (Number(r.time) || 0) + waited)
      pendingSeek.current = target
      setCur(target)
      wantPlay.current = !!r.playing
      // 不管上次是播是停，都先读一下元数据：进度条要能显示正确的总时长
      a.preload = 'metadata'
      a.load()
    } else {
      a.preload = 'none'
    }

    if (wantPlay.current) {
      a.play()
        .then(() => {
          setPlaying(true)
          setNeedTap(false)
        })
        .catch(() => {
          setPlaying(false)
          if (isResume) {
            // 整页导航后没有用户手势，浏览器会拦下自动播放 → 提示一下，点任意处就续上
            setNeedTap(true)
          } else {
            wantPlay.current = false
          }
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
    load() // 缓存 10 分钟内直接用；过期就静默刷新，歌单里加了歌会自动出现
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

    // 每 3 秒存一次进度，页面被直接关掉时也不至于丢太多
    const now = Date.now()
    if (now - lastSave.current > 3000) {
      lastSave.current = now
      saveState()
    }

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
          saveState()
        }}
        onPause={() => {
          setPlaying(false)
          saveState()
        }}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={(e) => {
          const el = e.currentTarget
          setDur(el.duration || 0)
          // 换页续播：元数据到了才知道能不能跳，跳完再交给 play()
          const t = pendingSeek.current
          if (t == null) return
          pendingSeek.current = null
          const dur = el.duration
          if (Number.isFinite(dur) && dur > 0 && t >= dur - 0.5) return // 上次已经放完了，别跳
          try {
            el.currentTime = t
            setCur(t)
          } catch (err) {}
        }}
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
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => load(true)}
                        disabled={refreshing}
                        aria-label="刷新歌单"
                        title="重新拉取歌单（网易云里新加的歌会同步过来）"
                        className="text-[11.5px] font-medium text-zinc-400 transition hover:text-ink disabled:cursor-default disabled:opacity-60 dark:text-zinc-500 dark:hover:text-white"
                      >
                        {refreshing ? '刷新中…' : '刷新'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setView('play')}
                        className="text-[11.5px] font-medium text-indigo-500 transition hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        返回播放
                      </button>
                    </div>
                  </div>

                  {status === 'loading' && !tracks.length && (
                    <p className="px-5 py-10 text-center text-[12.5px] text-zinc-500">正在读取歌单…</p>
                  )}
                  {status === 'error' && (
                    <div className="px-5 py-10 text-center">
                      <p className="text-[12.5px] text-zinc-500">歌单没加载出来</p>
                      <button
                        type="button"
                        onClick={() => load(true)}
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

                  <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 border-t border-black/[0.06] px-5 py-3 text-[11.5px] text-zinc-500 dark:border-white/10">
                    <span className="text-zinc-400 dark:text-zinc-500">在网易云打开</span>
                    {PLAYLISTS.map((p) => (
                      <a
                        key={p.id}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition hover:text-ink dark:hover:text-white"
                      >
                        {p.label} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* 换页后自动播放被浏览器拦下：给一个明显的入口（点页面任意处也能续上） */}
      {needTap && (
        <button
          type="button"
          onClick={() => {
            const a = audioRef.current
            if (!a) return
            wantPlay.current = true
            a.play()
              .then(() => {
                setPlaying(true)
                setNeedTap(false)
              })
              .catch(() => {})
          }}
          className="fixed bottom-6 left-1/2 z-[61] flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[12px] font-medium text-white shadow-xl shadow-ink/25 transition hover:-translate-y-0.5 dark:bg-white dark:text-ink"
        >
          <IconPlay className="h-3.5 w-3.5 shrink-0 translate-x-[1px]" />
          <span className="truncate">继续播放{track?.name ? ` · ${track.name}` : ''}</span>
        </button>
      )}

      {/* 提示条（放在面板外层，避开 transform 容器对 fixed 的影响） */}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed left-1/2 z-[60] -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-3.5 py-2 text-[11.5px] font-medium text-white shadow-lg transition dark:bg-white dark:text-ink ${
          needTap ? 'bottom-[4.9rem]' : 'bottom-6'
        } ${note ? 'opacity-100' : 'opacity-0'}`}
      >
        {note || '　'}
      </div>
    </>
  )
}
