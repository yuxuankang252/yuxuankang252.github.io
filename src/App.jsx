import { useEffect, useRef, useState } from 'react'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Blog from './pages/Blog.jsx'
import { findPost } from './lib/posts.js'

/* 单页 hash 路由。首页和博客在同一个 HTML 里切换，
   这样 MusicPlayer 只挂载一次，切页时 <audio> 不会被销毁，音乐真正不断。

   为什么用 `#/` 前缀而不是占用裸 hash：
   首页的导航用 #about / #skills / #journey / #contact 做锚点跳转，
   裸 hash 必须留给它们，只有 `#/` 开头的才算博客路由。

     #                     首页
     #about                首页 + 滚到「关于」
     #/                    博客列表
     #/tag/机器学习         按标签筛选
     #/post/<slug>         单篇正文
*/
export function parseHash() {
  const hash = window.location.hash || ''
  const m = /^#\/(.*)$/.exec(hash)
  if (!m) return { view: 'home', slug: '', tag: '', hash }
  const [kind, value] = m[1].split('/')
  if (kind === 'post' && value) {
    return { view: 'post', slug: decodeURIComponent(value), tag: '', hash }
  }
  if (kind === 'tag' && value) {
    return { view: 'list', slug: '', tag: decodeURIComponent(value), hash }
  }
  return { view: 'list', slug: '', tag: '', hash }
}

const HOME_TITLE = 'Coco · 个人主页'
const HOME_DESC = 'Coco 的个人主页 —— 数据科学与大数据技术，关注机器学习、数据分析与前端开发。'
const BLOG_TITLE = '博客 · Coco'
const BLOG_DESC = 'Coco 的博客 —— 数据科学、机器学习实验记录与前端笔记。'

function setMeta(name, content) {
  let meta = document.querySelector(`meta[name="${name}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', name)
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', content)
}

export default function App() {
  const [route, setRoute] = useState(parseHash)
  const prevView = useRef(route.view)

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const isBlog = route.view !== 'home'
  const post = route.view === 'post' ? findPost(route.slug) : null

  /* 标题与描述：首页 / 列表 / 正文各自不同，分享出去的预览才对 */
  useEffect(() => {
    if (route.view === 'post') {
      document.title = post ? `${post.meta.title} · Coco` : '文章找不到 · Coco'
      setMeta('description', post?.meta.summary || BLOG_DESC)
    } else if (route.view === 'list') {
      document.title = BLOG_TITLE
      setMeta('description', BLOG_DESC)
    } else {
      document.title = HOME_TITLE
      setMeta('description', HOME_DESC)
    }
  }, [route.view, route.slug, post])

  /* 滚动定位。
     视图变了就立刻跳（从博客点「关于」不该从页面顶部慢慢滚过去），
     同一视图内换锚点才用平滑滚动。 */
  useEffect(() => {
    const changed = prevView.current !== route.view
    prevView.current = route.view

    if (route.view !== 'home') {
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }

    const id = route.hash.replace(/^#/, '')
    if (!id || id === 'top') {
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: changed ? 'instant' : 'smooth', block: 'start' })
    else window.scrollTo({ top: 0, behavior: 'instant' })
  }, [route.view, route.hash])

  return (
    <>
      <Nav current={isBlog ? 'blog' : 'home'} />
      {isBlog ? <Blog route={route} post={post} /> : <Home />}
      <Footer />
    </>
  )
}
