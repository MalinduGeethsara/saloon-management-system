"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import ScrollReveal from '@/components/ui/ScrollReveal';

interface Barber {
  id: string;
  name: string;
  role: string;
  imageUrl?: string | null;
  shopId?: string | null;
  shop?: { name: string } | null;
}

export default function BarbersSection({ barbers }: { barbers: Barber[] }) {
  return (
    <section className="py-16 md:py-32 overflow-hidden border-b border-zinc-200 dark:border-zinc-800/50 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 relative text-center">

        <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 transition-colors">The Artisans</h3>
        <h2 className="text-4xl md:text-5xl font-black mb-12 md:mb-20 text-zinc-900 dark:text-white transition-colors">
          Meet The <span className="font-serif italic font-light text-zinc-500">Masters</span>
        </h2>

        <div className="relative group/artisans -mx-6 md:mx-0">
          <button
            onClick={() => document.getElementById('mobile-artisans-carousel')?.scrollBy({ left: -320, behavior: 'smooth' })}
            className="absolute left-2 top-32 -translate-y-1/2 z-30 md:hidden w-12 h-12 flex items-center justify-center rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-amber-500/50 text-amber-600 dark:text-amber-500 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:text-zinc-900 active:bg-amber-600 active:text-white dark:active:bg-amber-500 dark:active:text-zinc-900 transition-all opacity-100 active:scale-95 shadow-xl"
            aria-label="Scroll Left"
          >
            <ArrowLeftOutlined className="text-xl" />
          </button>
          <button
            onClick={() => document.getElementById('mobile-artisans-carousel')?.scrollBy({ left: 320, behavior: 'smooth' })}
            className="absolute right-2 top-32 -translate-y-1/2 z-30 md:hidden w-12 h-12 flex items-center justify-center rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-amber-500/50 text-amber-600 dark:text-amber-500 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:text-zinc-900 active:bg-amber-600 active:text-white dark:active:bg-amber-500 dark:active:text-zinc-900 transition-all opacity-100 active:scale-95 shadow-xl"
            aria-label="Scroll Right"
          >
            <ArrowRightOutlined className="text-xl" />
          </button>

          <div
            id="mobile-artisans-carousel"
            className="flex md:grid overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none md:grid-cols-4 gap-6 md:gap-8 hide-scrollbar pb-8 md:pb-0 px-6 md:px-0 scroll-smooth"
          >
            {barbers.length > 0 ? (
              barbers.map((barber, index) => (
                <ScrollReveal key={barber.id} direction="down" delay={index * 0.15} className="w-[85vw] sm:w-[350px] shrink-0 snap-center md:w-auto md:shrink flex flex-col">
                  <div className="flex flex-col items-center group cursor-pointer relative w-full h-full">
                    <div className="w-full sm:w-80 md:w-56 h-64 md:h-72 overflow-hidden mb-4 md:mb-6 border border-zinc-200 dark:border-zinc-800 group-hover:border-amber-500/50 transition-colors duration-500 shadow-md dark:shadow-none bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center relative">
                      {barber.imageUrl ? (
                        <Image
                          fill
                          src={barber.imageUrl}
                          alt={barber.name}
                          className="w-full h-full object-cover xl:grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-700">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white tracking-wide transition-colors text-center px-2 max-w-full truncate">{barber.name}</h4>
                    <p className="text-amber-600 dark:text-amber-500 font-light text-sm mb-3 tracking-widest uppercase mt-1">
                      {barber.role === 'OWNER' ? 'Master Stylist' : barber.role === 'MANAGER' ? 'Senior Barber' : 'Barber'}
                    </p>
                  </div>
                </ScrollReveal>
              ))
            ) : (
              <div className="col-span-4 text-center text-zinc-500 py-12 w-full flex justify-center items-center">
                No artisans found at the moment.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center mt-12 md:mt-16">
          <Link href="/barbers" className="border-b border-amber-600 dark:border-amber-500 text-amber-600 dark:text-amber-500 pb-1 text-xs font-bold tracking-[0.2em] uppercase transition-all hover:text-zinc-900 dark:hover:text-white hover:border-zinc-900 dark:hover:border-white">
            View All Artisans
          </Link>
        </div>

      </div>
    </section>
  );
}
