// 音乐接口封装：祈杰の Meting-API（https://api.qijieya.cn/meting/）
// 说明：所有接口都是 GET，返回 JSON（playlist）或纯文本（lrc），并带 Access-Control-Allow-Origin: *

const API = 'https://api.qijieya.cn/meting/'
export const SERVER = 'netease'
export const PLAYLIST_ID = '7254616088'
export const PLAYLIST_URL = `https://music.163.com/#/playlist?id=${PLAYLIST_ID}`

const meting = (type, id, extra = '') =>
  `${API}?server=${SERVER}&type=${type}&id=${encodeURIComponent(id)}${extra}`

let playlistCache = null

// 拉取歌单，返回 [{ name, artist, url, pic, lrc }]
export async function fetchPlaylist() {
  if (playlistCache) return playlistCache

  const res = await fetch(meting('playlist', PLAYLIST_ID))
  if (!res.ok) throw new Error(`歌单请求失败：HTTP ${res.status}`)

  const data = await res.json()
  if (!Array.isArray(data)) throw new Error('歌单返回格式异常')

  const list = data
    .filter((t) => t && t.url && t.name)
    .map((t, i) => ({
      key: `${i}-${t.name}`,
      name: String(t.name).trim(),
      artist: String(t.artist || '').trim() || '未知歌手',
      url: t.url,
      pic: t.pic || '',
      lrc: t.lrc || '',
    }))

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
