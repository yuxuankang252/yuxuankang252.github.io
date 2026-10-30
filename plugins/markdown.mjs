import matter from 'gray-matter'
import hljs from 'highlight.js/lib/common'
import MarkdownIt from 'markdown-it'

/**
 * 把 .md 文件编译成可以直接 import 的模块：
 *
 *   import post from '../posts/xxx.md'
 *   // post = { slug, meta, html, toc, minutes }
 *
 * 关键点是"编译发生在构建时"：浏览器最终只拿到一段 HTML 字符串，
 * 不需要下载 markdown-it / highlight.js，首屏更轻。
 */

const slugify = (input) =>
  input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')

/* 中文按 400 字/分钟、英文按 220 词/分钟估算，四舍五入到分钟，最少 1 分钟 */
function readingMinutes(text) {
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const words = (text.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9_]+/g) || []).length
  return Math.max(1, Math.round(cjk / 400 + words / 220))
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  highlight(code, lang) {
    const name = (lang || '').trim().toLowerCase()
    if (name && hljs.getLanguage(name)) {
      const html = hljs.highlight(code, { language: name, ignoreIllegals: true }).value
      return `<pre class="code-block" data-lang="${name}"><code class="hljs language-${name}">${html}</code></pre>`
    }
    return `<pre class="code-block" data-lang="text"><code class="hljs">${md.utils.escapeHtml(code)}</code></pre>`
  },
})

/* 站外链接新窗口打开 */
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const href = tokens[idx].attrGet('href') || ''
  if (/^https?:/i.test(href)) {
    tokens[idx].attrSet('target', '_blank')
    tokens[idx].attrSet('rel', 'noopener noreferrer')
  }
  return self.renderToken(tokens, idx, options)
}

/* 图片懒加载，正文再长也不会一次性拉满 */
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('loading', 'lazy')
  tokens[idx].attrSet('decoding', 'async')
  return self.renderToken(tokens, idx, options)
}

export default function markdownPlugin() {
  return {
    name: 'coco-markdown',
    enforce: 'pre',

    transform(code, id) {
      const file = id.split('?')[0]
      if (!file.endsWith('.md')) return null

      const { data, content } = matter(code)
      const env = {}
      const tokens = md.parse(content, env)

      /* 给标题加锚点 id，顺手收集目录（只收 h2 / h3） */
      const toc = []
      const used = new Set()
      tokens.forEach((token, i) => {
        if (token.type !== 'heading_open') return
        const level = Number(token.tag.slice(1))
        const inline = tokens[i + 1]
        const text = inline && inline.type === 'inline' ? inline.content : ''
        const base = slugify(text) || `section-${toc.length + 1}`
        let slug = base
        let n = 2
        while (used.has(slug)) slug = `${base}-${n++}`
        used.add(slug)
        token.attrSet('id', slug)
        if (level === 2 || level === 3) toc.push({ level, text, slug })
      })

      const html = md.renderer.render(tokens, md.options, env)
      const slug = (file.split(/[\\/]/).pop() || '').replace(/\.md$/, '')

      const rawDate = data.date
      const isoDate = rawDate
        ? (rawDate instanceof Date ? rawDate.toISOString() : String(rawDate)).slice(0, 10)
        : ''

      const meta = {
        title: String(data.title || slug),
        date: isoDate,
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        summary: String(data.summary || ''),
        draft: Boolean(data.draft),
      }

      const payload = {
        slug,
        meta,
        html,
        toc,
        minutes: readingMinutes(content),
      }

      return { code: `export default ${JSON.stringify(payload)}`, map: null }
    },
  }
}
