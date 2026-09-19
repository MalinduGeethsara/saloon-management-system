"use client";

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { CalendarOutlined } from '@ant-design/icons';
import gsap from 'gsap';
import Magnetic from '@/components/ui/Magnetic';
import HeroServicesRail, { type RailService } from '@/components/website/HeroServicesRail';

const DESKTOP_VIDEO = '/videos/home/carosel_video.mp4';
// ~2 MB / 640px re-encode of the hero video for phones (the desktop file is ~12 MB)
const MOBILE_VIDEO = '/videos/home/carosel_video_mobile.mp4';
const VIDEO_POSTER = '/videos/home/carosel_poster.jpg';

export default function HeroSection({ services = [] }: { services?: RailService[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // The source is chosen on the client so a phone never downloads the large desktop file. Until
  // then (and when the visitor prefers reduced motion) only the poster frame is shown.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const isSmallScreen = window.matchMedia('(max-width: 767px)').matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    video.src = isSmallScreen || saveData ? MOBILE_VIDEO : DESKTOP_VIDEO;
    video.play().catch(() => { /* autoplay blocked (e.g. iOS Low Power Mode): the poster stays visible */ });
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.timeline()
        .fromTo('.overlay-bg',
          { opacity: 1 },
          { opacity: 0.6, duration: 1.5, ease: 'power2.inOut' }
        )
        .fromTo('.reveal-text',
          { y: 60, opacity: 0, skewY: 5 },
          { y: 0, opacity: 1, skewY: 0, duration: 1.2, stagger: 0.15, ease: 'power4.out' },
          '-=1.0'
        )
        .fromTo('.reveal-btn',
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'back.out(1.7)' },
          '-=0.6'
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative flex flex-col items-center justify-center min-h-[100svh] md:min-h-[100dvh] w-full px-6 text-center overflow-hidden -mt-16 pt-16 md:-mt-24 md:pt-24"
    >
      <div className="absolute inset-0 z-0 bg-zinc-900 transition-colors duration-500">
        <video
          ref={videoRef}
          poster={VIDEO_POSTER}
          preload="metadata"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-100"
        />
        <div className="overlay-bg absolute inset-0 bg-black/40 dark:bg-black/60 z-10 transition-colors duration-500"></div>
      </div>

      <div className="relative z-20 max-w-5xl mx-auto flex-1 flex flex-col justify-center py-6 md:py-0 md:pt-20">
        <div className="reveal-text inline-flex items-center gap-3 px-4 md:px-5 py-2 md:py-2.5 rounded-full bg-white/60 dark:bg-white/5 border border-zinc-200 dark:border-white/10 backdrop-blur-md mb-4 md:mb-8 self-center text-[10px] md:text-[11px] font-bold tracking-[0.3em] uppercase text-amber-600 dark:text-amber-500 transition-colors shadow-sm dark:shadow-none">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          The Premium Standard
        </div>

        <h1 className="reveal-text text-4xl sm:text-5xl md:text-7xl lg:text-[6rem] font-black text-white mb-3 md:mb-6 leading-[1.05] tracking-tighter transition-colors drop-shadow-md">
          Mastering The <br />
          <span className="font-serif italic font-light text-amber-500 mr-4 transition-colors">Art</span>
          Of Grooming.
        </h1>

        <p className="reveal-text text-sm sm:text-lg md:text-xl text-zinc-200 dark:text-zinc-300 mb-5 md:mb-12 line-clamp-2 sm:line-clamp-none max-w-2xl mx-auto leading-relaxed font-medium transition-colors drop-shadow-md">
          An exclusive sanctuary for the modern gentleman. Precision tailoring, traditional hot towel shaves, and uncompromising quality.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 justify-center w-full sm:w-auto items-center">
          <Magnetic range={50} strength={0.3} className="reveal-btn w-full sm:w-auto">
            <Link
              href="/booking"
              className="group relative flex items-center justify-center gap-3 bg-amber-600 text-white dark:text-zinc-950 font-bold py-3 md:py-4 px-10 rounded-none overflow-hidden transition-all hover:bg-amber-700 dark:hover:bg-amber-500 shadow-xl dark:shadow-none w-full sm:w-auto"
            >
              <CalendarOutlined className="text-xl relative z-10" />
              <span className="relative z-10 tracking-wide uppercase text-sm">Reserve Your Chair</span>
            </Link>
          </Magnetic>

          <Magnetic range={50} strength={0.3} className="reveal-btn hidden sm:block w-full sm:w-auto">
            <Link
              href="/services"
              className="flex items-center justify-center gap-2 bg-white/20 backdrop-blur-md border border-white/50 text-white font-bold py-4 px-10 rounded-none transition-all hover:bg-white hover:border-amber-600 hover:text-amber-600 tracking-wide uppercase text-sm shadow-md dark:shadow-none w-full sm:w-auto"
            >
              Discover Services
            </Link>
          </Magnetic>
        </div>
      </div>

      {/* Phones only: a few services on the first screen, right under the headline */}
      <HeroServicesRail services={services} />
    </section>
  );
}
