export type PluginType = "theme" | "buddy" | "sound";

export interface Plugin {
  id: string;
  type: PluginType;
  name: { zh: string; en: string };
  author: string;
  authorGithub: string;
  price: number; // 0 = free
  description: { zh: string; en: string };
  tags: string[];
  downloads: number;
  rating: number;
  version: string;
  createdAt: string;
  preview: {
    colors?: string[]; // for themes
    emoji?: string; // for buddies
    icon?: string; // for sounds
  };
  featured: boolean;
}

export const plugins: Plugin[] = [
  {
    id: "ocean-night",
    type: "theme",
    name: { zh: "深海之夜", en: "Ocean Night" },
    author: "MioTeam",
    authorGithub: "MioMioOS",
    price: 0,
    description: {
      zh: "深邃的海洋蓝色调，搭配柔和的青色高光，为你的 Notch 栏带来宁静的深海氛围。适合夜间编码使用。",
      en: "Deep ocean blue tones with soft cyan highlights, bringing a serene deep-sea atmosphere to your Notch bar. Perfect for late-night coding sessions.",
    },
    tags: ["dark", "blue", "calm"],
    downloads: 12580,
    rating: 4.8,
    version: "1.2.0",
    createdAt: "2025-12-01",
    preview: { colors: ["#0A1628", "#1A3A5C", "#2D8CFF", "#00D4FF", "#E0F7FF"] },
    featured: true,
  },
  {
    id: "sunset-glow",
    type: "theme",
    name: { zh: "日落余晖", en: "Sunset Glow" },
    author: "DesignLab",
    authorGithub: "designlab-studio",
    price: 2.99,
    description: {
      zh: "温暖的橙红渐变色彩，灵感来源于金色黄昏。让你的工作空间充满温馨的夕阳色调。",
      en: "Warm orange-red gradient colors inspired by golden dusk. Fill your workspace with cozy sunset tones.",
    },
    tags: ["warm", "gradient", "sunset"],
    downloads: 8420,
    rating: 4.6,
    version: "1.0.3",
    createdAt: "2026-01-15",
    preview: { colors: ["#1A0A0A", "#8B2500", "#FF6B35", "#FFB347", "#FFF4E0"] },
    featured: true,
  },
  {
    id: "forest",
    type: "theme",
    name: { zh: "翡翠森林", en: "Forest" },
    author: "NatureUI",
    authorGithub: "nature-ui",
    price: 1.99,
    description: {
      zh: "自然绿色主题，仿佛置身于翠绿的森林之中。清新的色彩搭配让你感到放松与专注。",
      en: "Natural green theme that makes you feel like you're in a lush forest. Fresh color combinations help you feel relaxed and focused.",
    },
    tags: ["green", "nature", "calm"],
    downloads: 6750,
    rating: 4.5,
    version: "1.1.0",
    createdAt: "2026-02-10",
    preview: { colors: ["#0A1A0A", "#1B4332", "#2D6A4F", "#52B788", "#D8F3DC"] },
    featured: false,
  },
  {
    id: "minimal-white",
    type: "theme",
    name: { zh: "极简白", en: "Minimal White" },
    author: "CleanDesign",
    authorGithub: "clean-design",
    price: 0,
    description: {
      zh: "极简主义白色主题，干净利落的设计风格。适合喜欢简洁美学的用户。",
      en: "Minimalist white theme with clean design style. Perfect for users who love clean aesthetics.",
    },
    tags: ["light", "minimal", "clean"],
    downloads: 15200,
    rating: 4.7,
    version: "2.0.0",
    createdAt: "2025-11-20",
    preview: { colors: ["#FAFAFA", "#E8E8E8", "#CCCCCC", "#666666", "#1A1A1A"] },
    featured: true,
  },
  {
    id: "pixel-cat",
    type: "buddy",
    name: { zh: "像素猫咪", en: "Pixel Cat" },
    author: "MioTeam",
    authorGithub: "MioMioOS",
    price: 0,
    description: {
      zh: "可爱的像素风格小猫咪，会在你的 Notch 栏里活蹦乱跳。内置角色，开箱即用。当 AI 工作时它会认真盯着屏幕，空闲时则打盹休息。",
      en: "Adorable pixel-style kitten that bounces around in your Notch bar. Built-in character, ready to use. It watches the screen intently when AI is working, and naps when idle.",
    },
    tags: ["pixel", "cat", "cute", "built-in"],
    downloads: 28900,
    rating: 4.9,
    version: "1.0.0",
    createdAt: "2025-10-01",
    preview: { emoji: "🐱" },
    featured: true,
  },
  {
    id: "robot",
    type: "buddy",
    name: { zh: "小机器人", en: "Robot" },
    author: "RoboCreator",
    authorGithub: "robo-creator",
    price: 3.99,
    description: {
      zh: "一个友好的小机器人伙伴，会随着 AI Agent 的工作状态做出不同反应。它有多种表情动画，还会在完成任务时庆祝。",
      en: "A friendly little robot buddy that reacts to AI Agent work status. It has various expression animations and celebrates when tasks are completed.",
    },
    tags: ["robot", "animated", "reactive"],
    downloads: 5630,
    rating: 4.4,
    version: "1.3.0",
    createdAt: "2026-01-28",
    preview: { emoji: "🤖" },
    featured: true,
  },
  {
    id: "shiba-inu",
    type: "buddy",
    name: { zh: "柴犬", en: "Shiba Inu" },
    author: "PetPixels",
    authorGithub: "pet-pixels",
    price: 2.99,
    description: {
      zh: "超萌柴犬陪你写代码！它会摇尾巴、歪头、打哈欠，各种可爱动作让编码时光更有趣。",
      en: "Super cute Shiba Inu codes with you! It wags its tail, tilts its head, yawns — adorable animations make coding time more fun.",
    },
    tags: ["dog", "shiba", "cute", "animated"],
    downloads: 7840,
    rating: 4.7,
    version: "1.1.2",
    createdAt: "2026-02-20",
    preview: { emoji: "🐕" },
    featured: false,
  },
  {
    id: "lofi-coding",
    type: "sound",
    name: { zh: "Lo-Fi 编码", en: "Lo-Fi Coding" },
    author: "SoundWave",
    authorGithub: "sound-wave",
    price: 1.99,
    description: {
      zh: "轻柔的 Lo-Fi 音乐循环，专为编程时创造沉浸式氛围而设计。包含多段不重复的旋律，帮助你进入心流状态。",
      en: "Gentle Lo-Fi music loops designed to create an immersive atmosphere while coding. Multiple non-repeating melodies to help you enter the flow state.",
    },
    tags: ["lofi", "music", "ambient", "focus"],
    downloads: 9200,
    rating: 4.6,
    version: "1.0.0",
    createdAt: "2026-03-01",
    preview: { icon: "🎵" },
    featured: true,
  },
  {
    id: "chime-alerts",
    type: "sound",
    name: { zh: "清脆提示音", en: "Chime Alerts" },
    author: "AudioCraft",
    authorGithub: "audio-craft",
    price: 0,
    description: {
      zh: "一组精心设计的提示音效，为 AI Agent 的不同状态提供清脆悦耳的音频反馈。包含开始、进行中、完成、错误等多种提示音。",
      en: "A set of carefully designed alert sounds providing crisp audio feedback for different AI Agent states. Includes start, in-progress, complete, error, and more.",
    },
    tags: ["alerts", "notification", "chime"],
    downloads: 11300,
    rating: 4.5,
    version: "2.1.0",
    createdAt: "2025-12-15",
    preview: { icon: "🔔" },
    featured: false,
  },
  {
    id: "nature-ambient",
    type: "sound",
    name: { zh: "自然白噪音", en: "Nature Ambient" },
    author: "NatureSounds",
    authorGithub: "nature-sounds",
    price: 2.49,
    description: {
      zh: "来自大自然的白噪音集合：雨声、森林鸟鸣、海浪声、溪流声。帮助你屏蔽外界干扰，专注于代码世界。",
      en: "Natural white noise collection: rain, forest birds, ocean waves, streams. Helps you block out distractions and focus on your code.",
    },
    tags: ["nature", "white-noise", "rain", "ambient"],
    downloads: 6890,
    rating: 4.3,
    version: "1.2.1",
    createdAt: "2026-03-10",
    preview: { icon: "🌿" },
    featured: false,
  },
];

export function getPlugin(id: string): Plugin | undefined {
  return plugins.find((p) => p.id === id);
}

export function getFeaturedPlugins(): Plugin[] {
  return plugins.filter((p) => p.featured);
}

export function getPluginsByType(type: PluginType): Plugin[] {
  return plugins.filter((p) => p.type === type);
}

export const totalDownloads = plugins.reduce((sum, p) => sum + p.downloads, 0);
export const totalDevelopers = new Set(plugins.map((p) => p.author)).size;
