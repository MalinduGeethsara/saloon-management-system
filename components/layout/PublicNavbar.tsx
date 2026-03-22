"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';

export function PublicNavbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check the initial theme when the component loads
  useEffect(() => {
    setMounted(true);
    // Check if they have a saved preference, otherwise check their system preference
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

  // Function to switch between Light and Dark mode
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
    <header className="bg-white/90 dark:bg-black/90 backdrop-blur-md text-slate-900 dark:text-white border-b border-slate-200 dark:border-gray-900 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        
        {/* Left: Logo & Brand */}
        <Link href="/" className="flex items-center gap-3">
          {/* Logo Image Container */}
          <div className="relative w-10 h-10 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-gray-800 transition-colors">
            <Image 
              src="/images/dashboard/logo.png" 
              alt="Mr Polaa Logo" 
              fill 
              className="object-contain p-1" 
            />
          </div>
          
          {/* Brand Text */}
          <div className="flex flex-col justify-center">
            <span className="text-2xl font-black tracking-widest leading-none">MR POLAA</span>
            <span className="text-[8px] tracking-[0.25em] text-red-500 font-bold uppercase mt-1">Premium Grooming</span>
          </div>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-10">
          <Link href="/" className="text-[13px] font-semibold tracking-wider text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors uppercase">Home</Link>
          <Link href="/about" className="text-[13px] font-semibold tracking-wider text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors uppercase">About</Link>
          <Link href="/services" className="text-[13px] font-semibold tracking-wider text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors uppercase">Services</Link>
          <Link href="/products" className="text-[13px] font-semibold tracking-wider text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors uppercase">Product</Link>
          <Link href="/contact" className="text-[13px] font-semibold tracking-wider text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors uppercase">Contact</Link>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-6">
          
          {/* ✅ Theme Toggle Button */}
          {mounted && (
            <button 
              onClick={toggleTheme}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <SunOutlined className="text-lg" /> : <MoonOutlined className="text-lg" />}
            </button>
          )}

          <Link 
            href="/book" 
            className="border border-slate-900 dark:border-white px-6 py-2 text-sm font-semibold tracking-wider uppercase hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
          >
            Book Now
          </Link>
          
          <div className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors">
            <UserOutlined className="text-lg" />
            <span className="text-sm font-medium hidden sm:block">Login</span>
          </div>
        </div>

      </div>
    </header>
  );
}