import { useEffect, useState } from 'react'
import Footer from '../components/Footer.jsx'
import Nav from '../components/Nav.jsx'
import PostList from '../components/blog/PostList.jsx'
import PostView from '../components/blog/PostView.jsx'
import { findPost } from '../lib/posts.js'

/* 极简 hash 路由：
   #/              文章列表
   #/tag/机器学习   按标签筛选
   #/post/<slug>   单篇正文
   不用 react-router —— GitHub Pages 上刷新子路由会 404，hash 不会。 */
function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, '')
  const [kind, value] = raw.split('/')
  if (kind === 'post' && value) return { view: 'post', slug: decodeURIComponent(value), tag: '' }
  if (kind === 'tag' && value) return { view: 'list', slug: '', tag: decodeURIComponent(value) }
  return { view: 'list', slug: '', tag: '' }
}

const description = 'Coco 的博客 —— 数据科学、机器学习实验记录与前端笔记。'

export default function Blog() {
  const [route, setRoute] = useState(parseHash)

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const post = route.view === 'post' ? findPost(route.slug) : null

  /* 切页面：更新标题/描述，并滚回顶部（分享出去的链接打开就在开头） */
  useEffect(() => {
    if (route.view === 'post' && post) {
      document.title = `${post.meta.title} · Coco`
      let meta = document.querySelector('meta[name="description"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'description')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', post.meta.summary || description)
    } else {
      document.title = '博客 · Coco'
      document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [route.view, route.slug, post])

  return (
    <>
      <Nav homePrefix="index.html" current="blog" />

      <main className="relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="grid-bg absolute inset-0" />
          <div className="blob -left-24 -top-16 h-72 w-72 bg-indigo-400/25 dark:bg-indigo-600/20" />
          <div className="blob right-0 top-10 h-72 w-72 bg-fuchsia-400/15 dark:bg-fuchsia-600/15" />
        </div>

        {route.view === 'post' ? (
          post ? (
            <PostView key={post.slug} post={post} />
          ) : (
            <div className="mx-auto max-w-xl py-20 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">这篇文章找不到了</h1>
              <p className="mt-3 text-[14.5px] text-zinc-500">
                可能是链接写错了，或者文章已经改名。
              </p>
              <a
                href="#/"
                className="mt-7 inline-flex rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-white dark:bg-white dark:text-ink"
              >
                回到文章列表
              </a>
            </div>
          )
        ) : (
          <PostList activeTag={route.tag} />
        )}
      </main>

      <Footer homePrefix="index.html" />
    </>
  )
}
