/**
 * 文章数据层：构建时把 posts/ 下的 Markdown 全部编译好，
 * 这里只做排序、标签统计这类纯数据整理。
 */
const modules = import.meta.glob('../posts/*.md', { eager: true })

const compiled = Object.values(modules)
  .map((mod) => mod.default)
  .filter((post) => post && !post.meta.draft)

export const posts = compiled.sort((a, b) => (a.meta.date < b.meta.date ? 1 : -1))

export const tags = (() => {
  const counter = new Map()
  for (const post of posts) {
    for (const tag of post.meta.tags) counter.set(tag, (counter.get(tag) || 0) + 1)
  }
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
    .map(([name, count]) => ({ name, count }))
})()

export function findPost(slug) {
  return posts.find((post) => post.slug === slug) || null
}

/* 上一篇 / 下一篇（按时间倒序，所以 next 是更早的那篇） */
export function neighborsOf(slug) {
  const index = posts.findIndex((post) => post.slug === slug)
  if (index < 0) return { prev: null, next: null }
  return {
    prev: index > 0 ? posts[index - 1] : null,
    next: index < posts.length - 1 ? posts[index + 1] : null,
  }
}

export function postsByTag(tag) {
  if (!tag) return posts
  return posts.filter((post) => post.meta.tags.includes(tag))
}

/* 2026-10-06 -> 2026 年 10 月 6 日 */
export function formatDate(iso) {
  if (!iso) return ''
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return iso
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`
}
