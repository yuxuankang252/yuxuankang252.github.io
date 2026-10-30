import Hero from '../components/Hero.jsx'
import About from '../components/About.jsx'
import Skills from '../components/Skills.jsx'
import Journey from '../components/Journey.jsx'
import Contact from '../components/Contact.jsx'

/* 只有正文。导航和页脚在 App.jsx 里，切页时不会重建。 */
export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <Skills />
      <Journey />
      <Contact />
    </main>
  )
}
