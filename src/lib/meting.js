// 音乐接口封装：祈杰の Meting-API（https://api.qijieya.cn/meting/）
// 说明：所有接口都是 GET，返回 JSON（playlist）或纯文本（lrc），并带 Access-Control-Allow-Origin: *

const API = 'https://api.qijieya.cn/meting/'
export const SERVER = 'netease'

// 播放器的曲目来源：可以放多个歌单，运行时并发拉取、合并后按「歌名+歌手」去重
// 第一个是主歌单（PLAYLIST_URL 指向它）
export const PLAYLISTS = [
  { id: '7254616088', label: '歌单' },
  { id: '8268569514', label: '我喜欢的音乐' },
].map((p) => ({ ...p, url: `https://music.163.com/#/playlist?id=${p.id}` }))

export const PLAYLIST_ID = PLAYLISTS[0].id
export const PLAYLIST_URL = PLAYLISTS[0].url

const meting = (type, id, extra = '') =>
  `${API}?server=${SERVER}&type=${type}&id=${encodeURIComponent(id)}${extra}`

let playlistCache = null

async function fetchOne(id) {
  const res = await fetch(meting('playlist', id))
  if (!res.ok) throw new Error(`歌单请求失败：HTTP ${res.status}`)
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error('歌单返回格式异常')
  return data
}

// 拉取全部歌单并合并去重，返回 [{ name, artist, url, pic, lrc }]
export async function fetchPlaylist() {
  if (playlistCache) return playlistCache

  // 用 allSettled：某个歌单挂了不影响其他歌单出歌
  const results = await Promise.allSettled(PLAYLISTS.map((p) => fetchOne(p.id)))
  const rows = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
  if (!rows.length) throw new Error('歌单是空的')

  const seen = new Set()
  const list = []

  rows.forEach((t) => {
    if (!t || !t.url || !t.name) return
    const name = String(t.name).trim()
    const artist = String(t.artist || '').trim() || '未知歌手'
    const dedupeKey = `${name.toLowerCase()}|${artist.toLowerCase()}`
    if (seen.has(dedupeKey)) return
    seen.add(dedupeKey)
    list.push({
      key: `${list.length}-${name}`,
      name,
      artist,
      url: t.url,
      pic: t.pic || '',
      lrc: t.lrc || '',
    })
  })

  if (!list.length) throw new Error('歌单是空的')
  playlistCache = list
  return list
}

// 解析 LRC 歌词文本 → [{ time, text }]，按时间升序
// 原样保留每一行（网易云歌词头部的「作词 / 未经授权」等也算歌词，不做过滤）
export function parseLrc(text) {
  if (!text) return []
  const lines = []
  const stamp = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g

  text.split(/\r?\n/).forEach((raw) => {
    const content = raw.replace(/\[[^\]]*\]/g, '').trim()
    if (!content) return

    stamp.lastIndex = 0
    let m
    while ((m = stamp.exec(raw)) !== null) {
      const frac = m[3] ? Number(`0.${m[3]}`) : 0
      lines.push({ time: Number(m[1]) * 60 + Number(m[2]) + frac, text: content })
    }
  })

  return lines.sort((a, b) => a.time - b.time)
}

// 歌词按歌曲缓存，避免来回切歌重复请求
const lrcCache = new Map()

export async function fetchLyrics(url) {
  if (!url) return []
  if (lrcCache.has(url)) return lrcCache.get(url)

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const lines = parseLrc(await res.text())
    lrcCache.set(url, lines)
    return lines
  } catch (e) {
    lrcCache.set(url, [])
    return []
  }
}

// 秒 → mm:ss
export function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
