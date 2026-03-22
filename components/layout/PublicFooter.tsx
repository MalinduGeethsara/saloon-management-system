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
    <footer className="bg-slate-50 dark:bg-black text-slate-900 dark:text-white pt-20 pb-8 border-t border-slate-200 dark:border-gray-900 mt-auto transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* Column 1: Brand & Socials */}
          <div className="flex flex-col">
            <div className="mb-6 flex items-center gap-4">
              <div className="relative w-14 h-14 overflow-hidden rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-gray-800 shrink-0">
                <Image 
                  src="/images/dashboard/logo.png" 
                  alt="Mr Polaa Logo" 
                  fill 
                  className="object-contain p-1" 
                />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-black tracking-widest leading-none">MR POLAA</span>
                <span className="text-[9px] tracking-[0.25em] text-red-500 font-bold uppercase mt-2">Premium Grooming</span>
              </div>
            </div>
            
            <div className="flex gap-4 mt-2">
              <a href="#" className="w-8 h-8 flex items-center justify-center bg-slate-200 dark:bg-white text-slate-700 dark:text-black rounded hover:bg-slate-300 dark:hover:bg-gray-300 transition-colors">
                <FacebookFilled className="text-lg" />
              </a>
              <a href="#" className="w-8 h-8 flex items-center justify-center bg-slate-200 dark:bg-white text-slate-700 dark:text-black rounded hover:bg-slate-300 dark:hover:bg-gray-300 transition-colors">
                <InstagramOutlined className="text-lg" />
              </a>
              <a href="#" className="w-8 h-8 flex items-center justify-center bg-slate-200 dark:bg-white text-slate-700 dark:text-black rounded hover:bg-slate-300 dark:hover:bg-gray-300 transition-colors">
                <TikTokOutlined className="text-lg" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="flex flex-col">
            <h4 className="text-red-500 font-bold text-sm tracking-wider uppercase mb-6">Quick Links</h4>
            <div className="flex flex-col gap-4">
              <Link href="/" className="text-sm font-bold text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors uppercase">Home</Link>
              <Link href="/about" className="text-sm font-bold text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors uppercase">About</Link>
              <Link href="/terms" className="text-sm font-bold text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors uppercase">Terms & Conditions</Link>
              <Link href="/contact" className="text-sm font-bold text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors uppercase">Contact</Link>
            </div>
          </div>

          {/* Column 3: Contact Info */}
          <div className="flex flex-col">
            <h4 className="text-red-500 font-bold text-sm tracking-wider uppercase mb-6">Contact Us</h4>
            
            <div className="flex gap-3 mb-6">
              <ClockCircleOutlined className="text-lg mt-1 text-slate-400 dark:text-gray-300" />
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">Opening Times</p>
                <p className="text-sm font-bold text-slate-700 dark:text-gray-200">Tuesday - Sunday: 9:00am - 7:00pm</p>
              </div>
            </div>

            <div className="flex gap-3">
              <HomeOutlined className="text-lg mt-1 text-slate-400 dark:text-gray-300" />
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">Our Location</p>
                <p className="text-sm font-bold text-slate-700 dark:text-gray-200">No.6, Pagoda Road, Nugegoda, 10250, Sri Lanka.</p>
              </div>
            </div>
          </div>

          {/* Column 4: Phone */}
          <div className="flex flex-col md:items-end">
            <div className="flex items-start gap-3">
              <PhoneFilled className="text-xl rotate-90 text-slate-400 dark:text-gray-300" />
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">Our Phone</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">+94 77 388 5122</p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright */}
        <div className="border-t border-slate-200 dark:border-gray-800 pt-6 flex justify-center text-center">
          <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">
            © 2026 All Rights Reserved @ Mr Polaa | Designed & Developed by Ants
          </p>
        </div>

      </div>
    </footer>
  );
}