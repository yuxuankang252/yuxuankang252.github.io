// 统一的线性图标集合（stroke 风格，尺寸由 className 控制）
const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': true,
}

export function IconCode({ className = 'h-5 w-5' }) {
  return (
    <svg {...stroke} className={className}>
      <path d="m8 6-5 6 5 6M16 6l5 6-5 6" />
    </svg>
  )
}

export function IconChart({ className = 'h-5 w-5' }) {
  return (
    <svg {...stroke} className={className}>
      <path d="M3 17l5-6 4 3 5-7 4 3" />
      <path d="M3 21h18" />
    </svg>
  )
}

export function IconMonitor({ className = 'h-5 w-5' }) {
  return (
    <svg {...stroke} className={className}>
      <rect x="2.5" y="4" width="19" height="14" rx="2.5" />
      <path d="M8 21h8M12 18v3" />
    </svg>
  )
}

export function IconWrench({ className = 'h-5 w-5' }) {
  return (
    <svg {...stroke} className={className}>
      <path d="M14.7 6.3a4 4 0 0 0 5 5L21 21l-3 0-3.3-9.7a4 4 0 0 0-5-5l2.4 2.4-2.8 2.8L7 9.1" />
    </svg>
  )
}

export function IconArrowRight({ className = 'h-4 w-4' }) {
  return (
    <svg {...stroke} strokeWidth={2} className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export function IconArrowLeft({ className = 'h-4 w-4' }) {
  return (
    <svg {...stroke} strokeWidth={2} className={className}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  )
}

export function IconArrowUpRight({ className = 'h-4 w-4' }) {
  return (
    <svg {...stroke} strokeWidth={2} className={className}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  )
}

export function IconMoon({ className = 'h-[17px] w-[17px]' }) {
  return (
    <svg {...stroke} strokeWidth={1.7} className={className}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  )
}

export function IconSun({ className = 'h-[17px] w-[17px]' }) {
  return (
    <svg {...stroke} strokeWidth={1.7} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

export function IconMenu({ className = 'h-[18px] w-[18px]' }) {
  return (
    <svg {...stroke} className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function IconClose({ className = 'h-[18px] w-[18px]' }) {
  return (
    <svg {...stroke} className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function IconGithub({ className = 'h-[18px] w-[18px]' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.4 9.4 0 0 1 2.5-.34c.85 0 1.7.12 2.5.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.26C22 6.58 17.52 2 12 2z" />
    </svg>
  )
}

export function IconBook({ className = 'h-4 w-4' }) {
  return (
    <svg {...stroke} className={className}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M8 7h8M8 11h5" />
    </svg>
  )
}

export const skillIcons = {
  code: IconCode,
  chart: IconChart,
  monitor: IconMonitor,
  wrench: IconWrench,
}

/* ---------- 音乐播放器 ---------- */

export function IconMusic({ className = 'h-5 w-5' }) {
  return (
    <svg {...stroke} className={className}>
      <path d="M9 18V6.5l10-2V16" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </svg>
  )
}

export function IconPlay({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 5.2c0-.9 1-1.5 1.8-1l9.1 5.9c.7.5.7 1.5 0 2l-9.1 5.9c-.8.5-1.8-.1-1.8-1z" />
    </svg>
  )
}

export function IconPause({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <rect x="7.5" y="5" width="3.4" height="14" rx="1.4" />
      <rect x="13.1" y="5" width="3.4" height="14" rx="1.4" />
    </svg>
  )
}

export function IconPrev({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <rect x="4" y="5" width="2.6" height="14" rx="1.3" />
      <path d="M19.4 6.4c0-.8-.9-1.3-1.6-.9l-8.3 5.1c-.6.4-.6 1.3 0 1.7l8.3 5.2c.7.4 1.6-.1 1.6-.9z" />
    </svg>
  )
}

export function IconNext({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <rect x="17.4" y="5" width="2.6" height="14" rx="1.3" />
      <path d="M4.6 6.4c0-.8.9-1.3 1.6-.9l8.3 5.1c.6.4.6 1.3 0 1.7l-8.3 5.2c-.7.4-1.6-.1-1.6-.9z" />
    </svg>
  )
}

export function IconList({ className = 'h-4 w-4' }) {
  return (
    <svg {...stroke} className={className}>
      <path d="M8 6h12M8 12h12M8 18h8" />
      <circle cx="4" cy="6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconVolume({ className = 'h-4 w-4' }) {
  return (
    <svg {...stroke} className={className}>
      <path d="M4 9.5h3l4.2-3.4c.6-.5 1.5-.1 1.5.7v10.4c0 .8-.9 1.2-1.5.7L7 14.5H4z" />
      <path d="M16.5 9a4 4 0 0 1 0 6M19 6.6a7.5 7.5 0 0 1 0 10.8" />
    </svg>
  )
}

export function IconVolumeMute({ className = 'h-4 w-4' }) {
  return (
    <svg {...stroke} className={className}>
      <path d="M4 9.5h3l4.2-3.4c.6-.5 1.5-.1 1.5.7v10.4c0 .8-.9 1.2-1.5.7L7 14.5H4z" />
      <path d="m16.5 9.5 5 5M21.5 9.5l-5 5" />
    </svg>
  )
}

export function IconChevronDown({ className = 'h-4 w-4' }) {
  return (
    <svg {...stroke} className={className}>
      <path d="m6 9.5 6 6 6-6" />
    </svg>
  )
}

export function IconChevronLeft({ className = 'h-4 w-4' }) {
  return (
    <svg {...stroke} className={className}>
      <path d="m14.5 6-6 6 6 6" />
    </svg>
  )
}
