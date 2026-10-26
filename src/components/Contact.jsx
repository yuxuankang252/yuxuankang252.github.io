import { profile } from '../data/site.js'
import Reveal from './Reveal.jsx'
import { IconArrowRight, IconBook, IconGithub } from './Icons.jsx'

export default function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-6xl px-5 pb-24 pt-8 sm:px-8 sm:pb-32">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-ink px-7 py-14 text-center sm:px-16 sm:py-20 dark:bg-white/[0.06] dark:ring-1 dark:ring-white/10">
          <div className="pointer-events-none absolute inset-0">
            <div className="blob -left-16 -top-20 h-64 w-64 bg-indigo-500/40" />
            <div className="blob -bottom-24 -right-10 h-64 w-64 bg-fuchsia-500/30" />
          </div>

          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-300">Contact</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-[2.6rem]">
              有想法？一起聊聊。
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] leading-[1.85] text-zinc-400">
              无论是算法细节、前端实现，还是想吐槽我的某一篇文章 —— 都可以在 GitHub 上找到我。
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-[15px] font-medium text-ink transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 sm:w-auto"
              >
                <IconGithub className="h-[18px] w-[18px]" />
                GitHub
              </a>
              <a
                href="blog.html"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-[15px] font-medium text-white transition hover:bg-white/10 sm:w-auto"
              >
                <IconBook />
                读我的博客
                <IconArrowRight />
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
