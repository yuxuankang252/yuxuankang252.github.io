// 站点所有文案集中在这里，改内容只改这一个文件即可。

export const profile = {
  name: 'Coco',
  initials: 'C',
  role: '本科在读 · 数据科学与大数据技术',
  github: 'https://github.com/yuxuankang252',
  status: '持续学习中',
  availability: '开放交流',
  since: 'Data Science · Undergraduate',
}

export const heroTagline = {
  lead: '用代码和数据把想法做出来。目前专注于',
  highlightA: '机器学习的底层原理',
  middle: '与',
  highlightB: '干净的前端界面',
  tail: '—— 既能推导公式，也能把页面写好看。',
  paragraphs: [
    '正在做《AI 实践》课程实验：不调用现成框架，用 NumPy 从零实现反向传播；也喜欢把过程写成博客，让复杂的东西读起来不那么难。',
  ],
}

export const techStrip = ['Python', 'NumPy', 'scikit-learn', 'Tailwind CSS', 'Markdown', 'Git']

export const about = {
  paragraphs: [
    '我是 Coco，一名本科生，专业是数据科学与大数据技术。比起只调用现成的库，我更喜欢把算法拆开、用最基础的数学和代码重新实现一遍 —— 比如用 NumPy 手写多层感知机的前向传播和反向传播，再用梯度校验确认自己推导的链式法则没有写错。',
    '在工程侧，我对「把东西真的做出来」这件事有很强的兴趣：从数据清洗、模型训练，到一个能拿给别人看的网页界面。你现在看到的这个站点就是 React + Tailwind CSS 写的，博客部分用 Markdown 写作、再渲染成静态 HTML。',
    '我相信写下来的东西才真正属于自己。所以每次实验结束，我都会把踩过的坑、失败的尝试和最后的结论整理成一篇记录 —— 那些「不顺利的部分」，往往比漂亮的最终结果更有价值。',
  ],
  stats: [
    { value: '3', suffix: '+', label: '完整实验 / 项目' },
    { value: '100', suffix: '%', label: '代码自己跑通' },
    { value: '∞', suffix: '', label: '待解决的问题' },
  ],
  facts: [
    { label: '专业', value: '数据科学与大数据技术' },
    { label: '阶段', value: '本科在读' },
    { label: '主语言', value: 'Python · JavaScript' },
    { label: '正在学', value: '机器学习 · 数据可视化' },
  ],
}

export const skills = [
  {
    title: '编程语言',
    desc: '用它们写算法、写脚本，也写网页。',
    icon: 'code',
    accent: 'indigo',
    tags: ['Python', 'JavaScript', 'HTML / CSS'],
  },
  {
    title: '数据 & 机器学习',
    desc: '从矩阵运算到模型评估的完整链路。',
    icon: 'chart',
    accent: 'fuchsia',
    tags: ['NumPy', 'scikit-learn', 'scikit-image', 'Matplotlib', '反向传播'],
  },
  {
    title: '前端 & 内容',
    desc: '把结果做成人能直接看懂的样子。',
    icon: 'monitor',
    accent: 'cyan',
    tags: ['React', 'Tailwind CSS', '响应式布局', 'Markdown', 'SVG'],
  },
  {
    title: '工具 & 环境',
    desc: '日常写代码、做实验、写报告的那一套。',
    icon: 'wrench',
    accent: 'amber',
    tags: ['Git', 'Vite', 'VS Code', 'Jupyter', 'Word / Excel'],
  },
]

// 「最近的脚步」= 经历 + 做过的东西合并成一条时间线。
// 从最近的一条往后排，滑动即可回看。art / gradient 决定封面插图，accent 决定圆点和徽章颜色。
export const journey = [
  {
    time: '2026 · 秋',
    title: '反向传播算法实现',
    kind: '机器学习',
    desc: '不依赖任何深度学习框架，手推链式法则、用 NumPy 写完多层感知机的前向与反向传播，再用数值梯度校验解析梯度，记录损失收敛曲线。',
    tags: ['Python', 'NumPy', '梯度校验'],
    art: 'curve',
    gradient: 'from-indigo-500 to-violet-600',
    accent: 'indigo',
  },
  {
    time: '2026 · 秋',
    title: '个人站点 & Markdown 博客',
    kind: '前端',
    desc: '用 React + Tailwind CSS 构建并静态导出，支持深浅色主题与滚动动效；博客内容以 Markdown 写作，再渲染成静态 HTML 页面。',
    tags: ['React', 'Tailwind CSS', 'Markdown'],
    art: 'layout',
    gradient: 'from-fuchsia-500 to-rose-500',
    accent: 'fuchsia',
  },
  {
    time: '2026 · 秋',
    title: '图像特征与颜色空间实验',
    kind: '图像处理',
    desc: '用 scikit-image 提取 SIFT 关键点与描述子，在 YCbCr 颜色空间上做肤色阈值分割，量化对比不同参数下的检出效果。',
    tags: ['scikit-image', 'NumPy', '图像处理'],
    art: 'circles',
    gradient: 'from-cyan-500 to-teal-600',
    accent: 'cyan',
  },
]
