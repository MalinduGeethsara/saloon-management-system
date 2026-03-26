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
    // ✅ FIX: Added a wrapper with relative positioning and hidden overflow to hold the glowing background orbs
    <div className="relative w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors duration-500 mt-auto">
      
      {/* --- Ambient Background Glows to make the Glass visible --- */}
      <div className="absolute top-0 left-[-10%] w-[40%] h-full bg-amber-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-full bg-blue-500/5 dark:bg-zinc-800/40 blur-[120px] rounded-full pointer-events-none"></div>

      {/* ✅ FIX: Applied the glass effect over the glowing orbs */}
      <footer className="relative z-10 bg-white/40 dark:bg-zinc-950/60 backdrop-blur-3xl text-zinc-900 dark:text-zinc-100 pt-24 pb-8 border-t border-white/60 dark:border-zinc-800/50 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            
            {/* Column 1: Brand & Socials */}
            <div className="flex flex-col">
              <div className="mb-8 flex items-center gap-4">
                <div className="relative w-14 h-14 overflow-hidden rounded-none bg-white/60 dark:bg-zinc-900/50 backdrop-blur-md border border-white/60 dark:border-zinc-700/50 shrink-0 shadow-sm dark:shadow-none">
                  <Image 
                    src="/images/dashboard/logo.png" 
                    alt="Mr Polaa Logo" 
                    fill 
                    className="object-contain p-1.5" 
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black tracking-[0.2em] leading-none drop-shadow-sm dark:drop-shadow-none">MR POLAA</span>
                  <span className="text-[9px] tracking-[0.3em] text-amber-600 dark:text-amber-500 font-bold uppercase mt-2">Premium Grooming</span>
                </div>
              </div>
              
              <div className="flex gap-4 mt-2">
                <a href="#" className="w-10 h-10 flex items-center justify-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-white/60 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-400 hover:bg-amber-600 hover:border-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:border-amber-500 dark:hover:text-zinc-950 transition-all duration-300 shadow-sm dark:shadow-none">
                  <FacebookFilled className="text-lg" />
                </a>
                <a href="#" className="w-10 h-10 flex items-center justify-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-white/60 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-400 hover:bg-amber-600 hover:border-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:border-amber-500 dark:hover:text-zinc-950 transition-all duration-300 shadow-sm dark:shadow-none">
                  <InstagramOutlined className="text-lg" />
                </a>
                <a href="#" className="w-10 h-10 flex items-center justify-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-white/60 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-400 hover:bg-amber-600 hover:border-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:border-amber-500 dark:hover:text-zinc-950 transition-all duration-300 shadow-sm dark:shadow-none">
                  <TikTokOutlined className="text-lg" />
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="flex flex-col">
              <h4 className="text-amber-600 dark:text-amber-500 font-bold text-xs tracking-[0.2em] uppercase mb-8">Quick Links</h4>
              <div className="flex flex-col gap-5">
                <Link href="/" className="text-xs font-bold tracking-widest text-zinc-700 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors uppercase">Home</Link>
                <Link href="/about" className="text-xs font-bold tracking-widest text-zinc-700 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors uppercase">About</Link>
                <Link href="/terms" className="text-xs font-bold tracking-widest text-zinc-700 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors uppercase">Terms & Conditions</Link>
                <Link href="/contact" className="text-xs font-bold tracking-widest text-zinc-700 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors uppercase">Contact</Link>
              </div>
            </div>

            {/* Column 3: Contact Info */}
            <div className="flex flex-col">
              <h4 className="text-amber-600 dark:text-amber-500 font-bold text-xs tracking-[0.2em] uppercase mb-8">Contact Us</h4>
              
              <div className="flex gap-4 mb-8">
                <ClockCircleOutlined className="text-xl mt-0.5 text-zinc-500 dark:text-zinc-400" />
                <div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-[0.2em] mb-1.5">Opening Times</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 drop-shadow-sm dark:drop-shadow-none">Tue - Sun: 9:00am - 7:00pm</p>
                </div>
              </div>

              <div className="flex gap-4">
                <HomeOutlined className="text-xl mt-0.5 text-zinc-500 dark:text-zinc-400" />
                <div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-[0.2em] mb-1.5">Our Location</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed drop-shadow-sm dark:drop-shadow-none">No.6, Pagoda Road,<br/> Nugegoda, 10250, Sri Lanka.</p>
                </div>
              </div>
            </div>

            {/* Column 4: Phone */}
            <div className="flex flex-col md:items-end">
              <div className="flex items-start gap-4">
                <PhoneFilled className="text-2xl rotate-90 text-zinc-500 dark:text-zinc-400 mt-1" />
                <div className="md:text-right">
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-[0.2em] mb-2">Direct Line</p>
                  <p className="text-2xl font-light tracking-wider text-zinc-900 dark:text-white drop-shadow-sm dark:drop-shadow-none">+94 77 388 5122</p>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Bar: Copyright */}
          <div className="border-t border-zinc-200/50 dark:border-zinc-800/50 pt-8 flex justify-center text-center">
            <p className="text-[11px] tracking-widest text-zinc-600 dark:text-zinc-500 font-medium uppercase">
              © 2026 All Rights Reserved @ Mr Polaa <span className="mx-2">|</span> Designed by Ants
            </p>
          </div>

        </div>
      </footer>
    </div>
  );
}