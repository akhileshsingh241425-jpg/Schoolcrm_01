import { create } from 'zustand';

export const COLOR_PRESETS = [
  { name: 'Indigo',  primary: '#6366f1', secondary: '#8b5cf6', light: '#818cf8', dark: '#4f46e5' },
  { name: 'Blue',    primary: '#3b82f6', secondary: '#60a5fa', light: '#93c5fd', dark: '#2563eb' },
  { name: 'Teal',    primary: '#14b8a6', secondary: '#2dd4bf', light: '#5eead4', dark: '#0d9488' },
  { name: 'Green',   primary: '#10b981', secondary: '#34d399', light: '#6ee7b7', dark: '#059669' },
  { name: 'Purple',  primary: '#8b5cf6', secondary: '#a78bfa', light: '#c4b5fd', dark: '#7c3aed' },
  { name: 'Pink',    primary: '#ec4899', secondary: '#f472b6', light: '#f9a8d4', dark: '#db2777' },
  { name: 'Orange',  primary: '#f97316', secondary: '#fb923c', light: '#fdba74', dark: '#ea580c' },
  { name: 'Rose',    primary: '#f43f5e', secondary: '#fb7185', light: '#fda4af', dark: '#e11d48' },
  { name: 'Cyan',    primary: '#06b6d4', secondary: '#22d3ee', light: '#67e8f9', dark: '#0891b2' },
  { name: 'Amber',   primary: '#f59e0b', secondary: '#fbbf24', light: '#fcd34d', dark: '#d97706' },
];

const getSavedColor = () => {
  try {
    const saved = localStorage.getItem('themeColor');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.primary) return parsed;
    }
  } catch {}
  return COLOR_PRESETS[0];
};

const useThemeStore = create((set) => ({
  colorPresets: COLOR_PRESETS,
  selectedColor: getSavedColor(),
  setColor: (color) => {
    localStorage.setItem('themeColor', JSON.stringify(color));
    set({ selectedColor: color });
  },
}));

export default useThemeStore;
