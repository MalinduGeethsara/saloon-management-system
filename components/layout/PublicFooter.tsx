"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  FacebookFilled,
  InstagramOutlined,
  TikTokOutlined,
  ClockCircleOutlined,
  HomeOutlined,
  PhoneFilled
} from '@ant-design/icons';

export function PublicFooter() {
  return (
    <div className="relative w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors duration-500 mt-auto">

      {/* --- Ambient Background Glows --- */}
      <div className="absolute top-0 left-[-10%] w-[40%] h-full bg-amber-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-full bg-blue-500/5 dark:bg-zinc-800/40 blur-[120px] rounded-full pointer-events-none"></div>

      <footer className="relative z-10 bg-white/40 dark:bg-zinc-950/60 backdrop-blur-3xl text-zinc-900 dark:text-zinc-100 pt-16 md:pt-24 pb-8 border-t border-white/60 dark:border-zinc-800/50 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-6">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-12 md:mb-20">

            {/* Column 1: Brand & Socials */}
            <div className="flex flex-col items-center md:items-start">

              <div className="flex flex-col items-center w-fit mx-auto md:mx-0">
                {/* ✅ Added smooth scroll to top logic here */}
                <Link
                  href="/"
                  onClick={(e) => {
                    if (window.location.pathname === '/') {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="mb-6 flex items-center gap-1 group cursor-pointer block"
                >
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 transition-transform group-active:scale-95">
                    <Image src="/images/dashboard/logo_black.png" alt="Mr Polaa Logo" fill className="object-contain dark:hidden" />
                    <Image src="/images/dashboard/logo_white.png" alt="Mr Polaa Logo" fill className="object-contain hidden dark:block" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl sm:text-2xl font-black tracking-[0.2em] leading-none drop-shadow-sm dark:drop-shadow-none group-hover:text-amber-500 transition-colors">MR POLAA</span>
                    <span className="text-[8px] sm:text-[9px] tracking-[0.3em] text-amber-600 dark:text-amber-500 font-bold uppercase mt-2">Premium Grooming</span>
                  </div>
                </Link>

                {/* Social buttons */}
                <div className="flex gap-5 justify-center w-full">
                  <a href="https://www.facebook.com/profile.php?id=100070140811780" target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:text-zinc-950 active:bg-amber-600 active:text-white dark:active:bg-amber-500 dark:active:text-zinc-950 transition-all duration-300 active:scale-90">
                    <FacebookFilled className="text-xl" />
                  </a>
                  <a href="https://instagram.com/your_handle" target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:text-zinc-950 active:bg-amber-600 active:text-white dark:active:bg-amber-500 dark:active:text-zinc-950 transition-all duration-300 active:scale-90">
                    <InstagramOutlined className="text-xl" />
                  </a>
                  <a href="https://tiktok.com/@your_handle" target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:text-zinc-950 active:bg-amber-600 active:text-white dark:active:bg-amber-500 dark:active:text-zinc-950 transition-all duration-300 active:scale-90">
                    <TikTokOutlined className="text-xl" />
                  </a>
                </div>
              </div>

            </div>

            {/* Column 2: Quick Links */}
            <div className="flex flex-col">
              <h4 className="text-amber-600 dark:text-amber-500 text-md tracking-[0.2em] uppercase mb-6 md:mb-8 text-center md:text-left">Quick Links</h4>
              <div className="flex flex-col gap-4 md:gap-5 items-center md:items-start">
                {['Home', 'About', 'Terms & Conditions', 'Contact'].map((item) => (
                  <Link
                    key={item}
                    href={item === 'Home' ? '/' : `/${item.toLowerCase().replace(' & ', '-')}`}
                    className="text-xs font-black tracking-widest text-black dark:text-zinc-100 hover:text-amber-600 dark:hover:text-amber-500 transition-all uppercase active:scale-[0.98] origin-center md:origin-left hover:md:translate-x-1"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>

            {/* Column 3: Contact Info */}
            <div className="flex flex-col items-center md:items-start">
              <h4 className="text-amber-600 dark:text-amber-500 text-md tracking-[0.2em] uppercase mb-6 md:mb-8">Contact Us</h4>

              <div className="flex gap-4 mb-6 md:mb-8 group cursor-default">
                <ClockCircleOutlined className="text-2xl mt-0.5 text-amber-600 dark:text-amber-500 transition-colors" />
                <div className="text-center md:text-left">
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-[0.2em] mb-1.5">Opening Times</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 drop-shadow-sm dark:drop-shadow-none">Mon - Sun: 8:00am - 7:00pm</p>
                </div>
              </div>

              <div className="flex gap-4 group cursor-default">
                <HomeOutlined className="text-2xl mt-0.5 text-amber-600 dark:text-amber-500 transition-colors" />
                <div className="text-center md:text-left">
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-[0.2em] mb-1.5">Our Location</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed drop-shadow-sm dark:drop-shadow-none">Mr Polaa Barber Shop,<br /> New Road, Walasmulla,<br /> Sri Lanka.</p>
                </div>
              </div>
            </div>

            {/* Column 4: Phone */}
            <div className="flex flex-col items-center md:items-start mt-8 lg:mt-0 border-t border-zinc-200/50 dark:border-zinc-800/50 lg:border-none pt-8 lg:pt-0">
              <a href="tel:+94712568071" className="flex items-center gap-4 group active:scale-95 transition-transform cursor-pointer">
                <PhoneFilled className="text-2xl rotate-90 text-amber-600 dark:text-amber-500 transition-colors" />
                <div className="text-left">
                  <p className="text-[14px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-[0.2em] mb-1">Our Phone</p>
                  <p className="text-lg font-bold tracking-wider text-zinc-900 dark:text-white drop-shadow-sm dark:drop-shadow-none  group-hover:text-amber-500 transition-colors">+94 71 256 8071</p>
                </div>
              </a>
            </div>

          </div>

          <div className="border-t border-zinc-200/50 dark:border-zinc-800/50 pt-6 md:pt-8 flex justify-center text-center">
            <p className="text-[10px] md:text-[11px] tracking-widest text-zinc-600 dark:text-zinc-500 font-medium uppercase leading-relaxed">
              © 2026 All Rights Reserved @ Mr Polaa <span className="hidden sm:inline mx-2"></span>
            </p>
          </div>

        </div>
      </footer>
    </div>
  );
}