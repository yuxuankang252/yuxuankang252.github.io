import PostList from '../components/blog/PostList.jsx'
import PostView from '../components/blog/PostView.jsx'

/* 博客视图。路由、标题、滚动都由 App.jsx 统一管，这里只管渲染。 */
export default function Blog({ route, post }) {
  return (
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
  )
}
