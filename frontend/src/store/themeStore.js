import { create } from 'zustand';

export const COLOR_PRESETS = [
  { name: 'Wiki Blue',  primary: '#36c', secondary: '#54595d', light: '#447ff5', dark: '#2a4b8d' },
  { name: 'Dark Blue',  primary: '#2a4b8d', secondary: '#36c', light: '#447ff5', dark: '#14337a' },
  { name: 'Green',      primary: '#14866d', secondary: '#00af89', light: '#36c88e', dark: '#0d6957' },
  { name: 'Red',        primary: '#b32424', secondary: '#d33', light: '#ff4242', dark: '#8b1a1a' },
  { name: 'Purple',     primary: '#6b4ba1', secondary: '#8b5cf6', light: '#9b7fd4', dark: '#4a2d7a' },
  { name: 'Slate',      primary: '#54595d', secondary: '#72777d', light: '#a2a9b1', dark: '#202122' },
  { name: 'Teal',       primary: '#0d6957', secondary: '#14866d', light: '#36c88e', dark: '#004d40' },
  { name: 'Brown',      primary: '#795548', secondary: '#a1887f', light: '#bcaaa4', dark: '#4e342e' },
  { name: 'Navy',       primary: '#1a237e', secondary: '#3949ab', light: '#5c6bc0', dark: '#0d1642' },
  { name: 'Charcoal',   primary: '#37474f', secondary: '#546e7a', light: '#78909c', dark: '#263238' },
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
