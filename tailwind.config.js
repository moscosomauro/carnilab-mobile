import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './screens/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        display: ['Montserrat', 'sans-serif'],
        body: ['Poppins', 'sans-serif'],
        accent: ['Playfair Display', 'serif'],
      },
      colors: {
        'brand-bg': 'var(--color-brand-bg)',
        'brand-surface': 'var(--color-brand-surface)',
        'brand-dark': 'var(--color-brand-dark)',
        'brand-light': 'var(--color-brand-light)',
        'brand-primary': 'var(--color-brand-primary)',
        'brand-secondary': 'var(--color-brand-secondary)',
        'brand-accent': 'var(--color-brand-accent)',
        'brand-deep': '#ecf0f1',
        // Rediseño 2026
        'sidebar': 'var(--color-sidebar)',
        'sidebar-active': 'var(--color-sidebar-active)',
        'sidebar-text': 'var(--color-sidebar-text)',
        'sidebar-hover': 'var(--color-sidebar-hover)',
        'app-bg': 'var(--color-app-bg)',
        'app-card': 'var(--color-app-card)',
        'app-border': 'var(--color-app-border)',
        'topbar': 'var(--color-topbar)',
      },
      backgroundImage: {
        'main-gradient': 'linear-gradient(to bottom right, var(--color-brand-bg), #ecf0f1)',
        'glass-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%)',
      },
      keyframes: {
        'breathing-glow': {
          '0%, 100%': { boxShadow: '0 0 20px 5px rgba(76, 175, 80, 0.4)', opacity: '0.9' },
          '50%': { boxShadow: '0 0 45px 15px rgba(76, 175, 80, 0.8)', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pan-camera': {
          '0%': { transform: 'scale(1) translate(0, 0)' },
          '100%': { transform: 'scale(1.15) translate(-2%, -2%)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'scan': {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'progress-indeterminate': {
          '0%': { width: '0%', marginLeft: '0%' },
          '50%': { width: '50%', marginLeft: '25%' },
          '100%': { width: '100%', marginLeft: '0%' },
        },
      },
      animation: {
        'breathing': 'breathing-glow 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pan': 'pan-camera 20s alternate infinite linear',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'scale-in': 'scale-in 0.3s ease-out forwards',
        'scan': 'scan 3s linear infinite',
        'slide-up': 'slide-up 0.25s ease-out forwards',
        'progress-indeterminate': 'progress-indeterminate 2s ease-in-out infinite',
        'spin-slow': 'spin 10s linear infinite',
      },
      boxShadow: {
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.7)',
        'premium': '0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(212, 175, 55, 0.1)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'soft': '0 18px 50px rgba(0, 0, 0, 0.08)',
        'float': '0 20px 40px rgba(74, 93, 79, 0.1)',
      },
      borderRadius: {
        'card': '32px',
        'modal': '40px',
        'pill': '60px',
        'blob': '60px 28px 110px 44px',
      },
    },
  },
  plugins: [forms, containerQueries],
};
