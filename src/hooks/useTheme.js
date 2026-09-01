import { useState, useEffect } from 'react'

export const THEMES = {
  black: {
    bg: '#000000',
    sidebarBg: '#09090b',
    border: '#27272a',
    cardBg: '#18181b',
    text: '#ffffff',
    subtext: '#a1a1aa',
    bubbleMine: 'linear-gradient(135deg, #7000ff, #bd00ff)',
    bubbleOther: '#1f1f23',
    accent: '#0095f6',
    avatar: 'https://i.postimg.cc/c4XcpBMH/download-(3).jpg',
  },
  white: {
    bg: '#f4f4f5',
    sidebarBg: '#ffffff',
    border: '#e4e4e7',
    cardBg: '#ffffff',
    text: '#09090b',
    subtext: '#71717a',
    bubbleMine: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    bubbleOther: '#e4e4e7',
    accent: '#2563eb',
    avatar: 'https://i.postimg.cc/bY1CBnBD/𝐷𝑎𝑧𝑎𝑖-𝑂𝑠𝑎𝑚𝑢.jpg',
  },
  pink: {
    bg: '#ffe4e6',
    sidebarBg: '#fff1f2',
    border: '#fecdd3',
    cardBg: '#ffffff',
    text: '#881337',
    subtext: '#9f1239',
    bubbleMine: 'linear-gradient(135deg, #e11d48, #fb7185)',
    bubbleOther: '#ffe4e6',
    accent: '#e11d48',
    avatar: 'https://i.postimg.cc/CK5WqKJS/download-(1).jpg',
  },
  emerald: {
    bg: '#022c22',
    sidebarBg: '#064e3b',
    border: '#047857',
    cardBg: '#065f46',
    text: '#ecfdf5',
    subtext: '#a7f3d0',
    bubbleMine: 'linear-gradient(135deg, #059669, #10b981)',
    bubbleOther: '#047857',
    accent: '#10b981',
    avatar: 'https://i.postimg.cc/tCT6xQWV/download-(5).jpg',
  },
}

export function useTheme() {
  // Load saved theme from localStorage or fallback to 'black'
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('app_theme') || 'black'
  })

  const changeTheme = (themeId) => {
    if (THEMES[themeId]) {
      setCurrentTheme(themeId)
      localStorage.setItem('app_theme', themeId)
    }
  }

  const themeColors = THEMES[currentTheme] || THEMES.black

  return {
    currentTheme,
    themeColors,
    changeTheme,
  }
}