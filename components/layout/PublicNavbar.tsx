"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';

export function PublicNavbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDark = 
      localStorage.theme === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDarkMode(isDark);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  return (
    // ✅ FIX: Changed to `fixed w-full` and bumped blur to `backdrop-blur-2xl`
    <header className="fixed w-full top-0 left-0 z-[100] bg-white/40 dark:bg-zinc-950/40 backdrop-blur-2xl text-zinc-900 dark:text-zinc-100 border-b border-white/40 dark:border-zinc-800/50 transition-colors duration-500 shadow-sm dark:shadow-none">
      <div className="max-w-7xl mx-auto px-6 h-24 flex justify-between items-center">
        
        {/* Left: Logo & Brand */}
        <Link href="/" className="flex items-center gap-4 group">
          <div className="relative w-12 h-12 overflow-hidden rounded-none bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-white/50 dark:border-zinc-700/50 transition-colors duration-500 group-hover:border-amber-500">
            <Image 
              src="/images/dashboard/logo.png" 
              alt="Mr Polaa Logo" 
              fill 
              className="object-contain p-1.5" 
            />
          </div>
          
          <div className="flex flex-col justify-center">
            <span className="text-2xl font-black tracking-[0.2em] leading-none text-zinc-900 dark:text-white drop-shadow-sm dark:drop-shadow-none">MR POLAA</span>
            <span className="text-[9px] tracking-[0.3em] text-amber-600 dark:text-amber-500 font-bold uppercase mt-1.5 drop-shadow-sm dark:drop-shadow-none">Premium Grooming</span>
          </div>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-10">
          <Link href="/" className="text-xs font-bold tracking-[0.15em] text-zinc-800 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors uppercase drop-shadow-sm dark:drop-shadow-none">Home</Link>
          <Link href="/about" className="text-xs font-bold tracking-[0.15em] text-zinc-800 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors uppercase drop-shadow-sm dark:drop-shadow-none">About</Link>
          <Link href="/services" className="text-xs font-bold tracking-[0.15em] text-zinc-800 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors uppercase drop-shadow-sm dark:drop-shadow-none">Services</Link>
          <Link href="/products" className="text-xs font-bold tracking-[0.15em] text-zinc-800 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors uppercase drop-shadow-sm dark:drop-shadow-none">Product</Link>
          <Link href="/contact" className="text-xs font-bold tracking-[0.15em] text-zinc-800 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors uppercase drop-shadow-sm dark:drop-shadow-none">Contact</Link>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-6">
          {mounted && (
            <button 
              onClick={toggleTheme}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-white/50 dark:border-zinc-700/50 text-zinc-800 dark:text-zinc-300 hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-500/20 dark:hover:text-amber-500 transition-all duration-300 shadow-sm dark:shadow-none"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <SunOutlined className="text-lg" /> : <MoonOutlined className="text-lg" />}
            </button>
          )}

          <Link 
            href="/book" 
            className="border border-zinc-900/60 dark:border-zinc-100/50 bg-white/30 dark:bg-zinc-900/30 backdrop-blur-md px-7 py-3 text-xs font-bold tracking-[0.2em] uppercase hover:bg-amber-600 hover:border-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:border-amber-500 dark:hover:text-zinc-950 transition-all duration-300 shadow-sm dark:shadow-none"
          >
            Book Now
          </Link>
          
          <Link href="/login" className="flex items-center gap-2 cursor-pointer text-zinc-800 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors drop-shadow-sm dark:drop-shadow-none">
            <UserOutlined className="text-xl" />
            <span className="text-xs font-bold tracking-widest hidden sm:block uppercase">Login</span>
          </Link>
        </div>

      </div>
    </header>
  );
}