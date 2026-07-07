"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getPublicBarbers, getPublicServices } from '@/lib/actions/public';
import {
  CalendarOutlined,
  ScissorOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  CrownOutlined,
  StarFilled,
  GoogleOutlined
} from '@ant-design/icons';
import gsap from 'gsap';
import Magnetic from "@/components/ui/Magnetic";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function WebsiteHomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [barbersData, servicesData] = await Promise.all([
        getPublicBarbers(),
        getPublicServices()
      ]);
      setBarbers(barbersData);
      setServices(servicesData);
    };
    fetchData();
  }, []);

  // --- Premium GSAP Studio Reveal Animations ---
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Hero Overlay Fade
      tl.fromTo('.overlay-bg',
        { opacity: 1 },
        { opacity: 0.6, duration: 1.5, ease: 'power2.inOut' }
      )
        // Hero Text Stagger
        .fromTo('.reveal-text',
          { y: 60, opacity: 0, skewY: 5 },
          { y: 0, opacity: 1, skewY: 0, duration: 1.2, stagger: 0.15, ease: 'power4.out' },
          "-=1.0"
        )
        // Hero Buttons
        .fromTo('.reveal-btn',
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'back.out(1.7)' },
          "-=0.6"
        );
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-amber-600 selection:text-white font-sans transition-colors duration-500">

      {/* =========================================
          1. IMMERSIVE HERO SECTION
      ========================================= */}
      {/* ✅ FIX: min-h-[100dvh] ensures it perfectly fits 100% of the screen height on both mobile and desktop. */}
      <section className="relative flex flex-col items-center justify-center min-h-[100dvh] w-full px-6 text-center overflow-hidden -mt-24 pt-24">

        <div className="absolute inset-0 z-0 bg-zinc-900 transition-colors duration-500">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full  object-cover opacity-100"
          >
            <source src="/videos/home/carosel_video.mp4" type="video/mp4" />
          </video>
          {/* ✅ FIX: Solid gradient overlay prevents any color bands from showing up at the bottom */}
          <div className="overlay-bg absolute inset-0 bg-black/40 dark:bg-black/60 z-10 transition-colors duration-500"></div>
        </div>

        <div className="relative z-20 max-w-5xl mx-auto pt-10 md:pt-20">
          <div className="reveal-text inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/60 dark:bg-white/5 border border-zinc-200 dark:border-white/10 backdrop-blur-md mb-8 text-[11px] font-bold tracking-[0.3em] uppercase text-amber-600 dark:text-amber-500 transition-colors shadow-sm dark:shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            The Premium Standard
          </div>

          <h1 className="reveal-text text-5xl md:text-7xl lg:text-[6rem] font-black text-white mb-6 leading-[1.05] tracking-tighter transition-colors drop-shadow-md">
            Mastering The <br />
            <span className="font-serif italic font-light text-amber-500 mr-4 transition-colors">Art</span>
            Of Grooming.
          </h1>

          <p className="reveal-text text-lg md:text-xl text-zinc-200 dark:text-zinc-300 mb-12 max-w-2xl mx-auto leading-relaxed font-medium transition-colors drop-shadow-md">
            An exclusive sanctuary for the modern gentleman. Precision tailoring, traditional hot towel shaves, and uncompromising quality.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center w-full sm:w-auto items-center">
            <Magnetic range={50} strength={0.3} className="reveal-btn w-full sm:w-auto">
              <Link
                href="/booking"
                className="group relative flex items-center justify-center gap-3 bg-amber-600 text-white dark:text-zinc-950 font-bold py-4 px-10 rounded-none overflow-hidden transition-all hover:bg-amber-700 dark:hover:bg-amber-500 shadow-xl dark:shadow-none w-full sm:w-auto"
              >
                <CalendarOutlined className="text-xl relative z-10" />
                <span className="relative z-10 tracking-wide uppercase text-sm">Reserve Your Chair</span>
              </Link>
            </Magnetic>

            <Magnetic range={50} strength={0.3} className="reveal-btn w-full sm:w-auto">
              <Link
                href="/services"
                className="flex items-center justify-center gap-2 bg-white/20 backdrop-blur-md border border-white/50 text-white font-bold py-4 px-10 rounded-none transition-all hover:bg-white hover:border-amber-600 hover:text-amber-600 tracking-wide uppercase text-sm shadow-md dark:shadow-none w-full sm:w-auto"
              >
                Discover Services
              </Link>
            </Magnetic>
          </div>
        </div>
      </section>

      {/* =========================================
          BRAND PARTNERS MARQUEE (BEAUTY PRODUCTS)
      ========================================= */}
      <ScrollReveal direction="down" delay={0.1}>
        <div className="relative py-12 bg-white dark:bg-zinc-950/20 border-b border-zinc-200 dark:border-zinc-900 transition-colors duration-500 overflow-hidden select-none">
          <div className="max-w-7xl mx-auto px-6 mb-4 flex items-center justify-center gap-3">
            <span className="h-[1px] w-12 bg-zinc-200 dark:bg-zinc-800 transition-colors"></span>
            <span className="text-[10px] uppercase font-bold tracking-[0.35em] text-zinc-400 dark:text-zinc-500 transition-colors">Premium Products We Trust</span>
            <span className="h-[1px] w-12 bg-zinc-200 dark:bg-zinc-800 transition-colors"></span>
          </div>

          <div className="relative w-full overflow-hidden flex mask-gradient-marquee py-2">
            {/* We repeat the brand set 4 times for smooth density and seamless looping */}
            <div className="animate-marquee flex items-center gap-20 md:gap-32 whitespace-nowrap pr-20 md:pr-32">
              {[...Array(4)].map((_, i) => (
                <React.Fragment key={i}>
                  <span className="text-zinc-800 dark:text-zinc-500 font-serif tracking-[0.2em] font-extrabold text-xl uppercase transition-colors hover:text-amber-600 dark:hover:text-amber-500">Bellose</span>
                  <span className="text-zinc-800 dark:text-zinc-500 font-sans tracking-[0.3em] font-black text-base uppercase transition-colors hover:text-amber-600 dark:hover:text-amber-500">Derma Pro</span>
                  <span className="text-zinc-800 dark:text-zinc-500 font-sans tracking-[0.25em] font-bold text-lg uppercase italic transition-colors hover:text-amber-600 dark:hover:text-amber-500 font-mono">Keune</span>
                  <span className="text-zinc-800 dark:text-zinc-500 font-serif tracking-[0.15em] font-medium text-lg uppercase transition-colors hover:text-amber-600 dark:hover:text-amber-500">L&apos;Oréal</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* =========================================
          2. THE CRAFT (ABOUT)
      ========================================= */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <ScrollReveal direction="down" className="lg:col-span-7 grid grid-cols-2 gap-6 relative">
            <div className="flex flex-col gap-6 mt-12">
              <Image
                src="https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?q=80&w=2000&auto=format&fit=crop"
                alt="Barber Tools"
                width={800}
                height={500}
                className="w-full h-80 object-cover rounded-none xl:grayscale hover:grayscale-0 transition-all duration-700 shadow-xl dark:shadow-none"
              />
            </div>
            <div className="flex flex-col gap-6">
              <Image
                src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop"
                alt="Vintage Chair"
                width={800}
                height={800}
                className="w-full h-[28rem] object-cover rounded-none xl:grayscale hover:grayscale-0 transition-all duration-700 shadow-xl dark:shadow-none"
              />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-600/10 blur-[100px] rounded-full z-[-1]"></div>
          </ScrollReveal>

          <ScrollReveal direction="down" delay={0.25} className="lg:col-span-5 flex flex-col">
            <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-6 flex items-center gap-4 transition-colors">
              <span className="w-12 h-[1px] bg-amber-600 dark:bg-amber-500 transition-colors"></span> Est. 2024
            </h3>
            <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight text-zinc-900 dark:text-white transition-colors">
              Tradition Meets <br /><span className="font-serif italic font-light text-zinc-500">Modern Precision.</span>
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed mb-10 font-light transition-colors">
              We don&apos;t just cut hair; we architect your personal style. Every detail, from the ambient lighting to the rich lather of our shaving creams, is curated to provide a momentary escape from the ordinary.
            </p>

            <div className="grid grid-cols-1 gap-8 mb-12">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 bg-white dark:bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-800 text-amber-600 dark:text-amber-500 transition-colors shadow-sm dark:shadow-none">
                  <ScissorOutlined className="text-2xl" />
                </div>
                <div>
                  <h4 className="text-zinc-900 dark:text-white font-bold mb-2 tracking-wide transition-colors">Bespoke Tailoring</h4>
                  <p className="text-sm text-zinc-500 leading-relaxed transition-colors">Structural cuts designed exclusively for your head shape, hair texture, and daily lifestyle.</p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 bg-white dark:bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-800 text-amber-600 dark:text-amber-500 transition-colors shadow-sm dark:shadow-none">
                  <CrownOutlined className="text-2xl" />
                </div>
                <div>
                  <h4 className="text-zinc-900 dark:text-white font-bold mb-2 tracking-wide transition-colors">Royal Treatment</h4>
                  <p className="text-sm text-zinc-500 leading-relaxed transition-colors">Experience hot towel wraps, straight razor finishes, and premium restorative elixirs.</p>
                </div>
              </div>
            </div>

            <Link href="/about" className="text-zinc-900 dark:text-white font-bold hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-3 w-fit group uppercase tracking-widest text-xs">
              Explore Our Heritage
              <ArrowRightOutlined className="transition-transform group-hover:translate-x-2 text-amber-600 dark:text-amber-500" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* =========================================
          3. THE MENU (SERVICES)
      ========================================= */}
      <section className="py-32 bg-white dark:bg-zinc-900/50 border-y border-zinc-200 dark:border-zinc-800/50 transition-colors duration-500 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative">

          <ScrollReveal direction="down">
            <div className="text-center mb-12 md:mb-20">
              <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 transition-colors">Curated Menu</h3>
              <h2 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white transition-colors">Signature <span className="font-serif italic font-light text-zinc-500">Services</span></h2>
            </div>
          </ScrollReveal>

          {/* ✅ Relative Wrapper for Carousel & Mobile Overlay Buttons */}
          <div className="relative group/menu -mx-6 md:mx-0">

            {/* ✅ Stylish Mobile Absolute Overlay Buttons in Amber Theme */}
            {/* Previous Button (Perfectly centered over the image part) */}
            <button
              onClick={() => document.getElementById('mobile-services-carousel')?.scrollBy({ left: -350, behavior: 'smooth' })}
              className="absolute left-2 top-[144px] -translate-y-1/2 z-30 md:hidden w-12 h-12 flex items-center justify-center rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-amber-500/50 text-amber-600 dark:text-amber-500 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:text-zinc-900 active:bg-amber-600 active:text-white dark:active:bg-amber-500 dark:active:text-zinc-900 transition-all opacity-100 active:scale-95 shadow-xl"
              aria-label="Scroll Left"
            >
              <ArrowLeftOutlined className="text-xl" />
            </button>

            {/* Next Button (Perfectly centered over the image part) */}
            <button
              onClick={() => document.getElementById('mobile-services-carousel')?.scrollBy({ left: 350, behavior: 'smooth' })}
              className="absolute right-2 top-[144px] -translate-y-1/2 z-30 md:hidden w-12 h-12 flex items-center justify-center rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-amber-500/50 text-amber-600 dark:text-amber-500 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:text-zinc-900 active:bg-amber-600 active:text-white dark:active:bg-amber-500 dark:active:text-zinc-900 transition-all opacity-100 active:scale-95 shadow-xl"
              aria-label="Scroll Right"
            >
              <ArrowRightOutlined className="text-xl" />
            </button>

            {/* ✅ Main Carousel Track */}
            <div
              id="mobile-services-carousel"
              className="flex md:grid overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none md:grid-cols-3 gap-6 md:gap-8 hide-scrollbar pb-8 md:pb-0 px-6 md:px-0 scroll-smooth"
            >
              {services.length > 0 ? (
                services.map((service, index) => (
                  <ScrollReveal key={service.id} direction="down" delay={index * 0.15 + 0.1} className="w-[85vw] sm:w-[350px] shrink-0 snap-center md:w-auto md:shrink">
                    <div className="group relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 transition-colors duration-500 cursor-pointer overflow-hidden shadow-sm hover:shadow-md dark:shadow-none h-full relative">
                      <div className="h-72 overflow-hidden relative bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/20 dark:bg-black/40 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                        {service.imageUrl ? (
                          <Image
                            src={service.imageUrl}
                            alt={service.name}
                            width={500}
                            height={350}
                            className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 xl:grayscale group-hover:grayscale-0"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-zinc-400 z-0">No Image</span>
                        )}
                        <div className="absolute bottom-0 left-0 w-full p-6 z-20 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 to-transparent">
                          <div className="text-amber-600 dark:text-amber-500 font-mono tracking-widest text-sm mb-2 drop-shadow-md">LKR {service.price}</div>
                          <h4 className="text-2xl font-bold text-zinc-900 dark:text-white drop-shadow-md">{service.name}</h4>
                        </div>
                      </div>
                      <div className="p-6 pt-2 flex flex-col justify-between h-[calc(100%-18rem)]">
                        <p className="text-zinc-600 dark:text-zinc-500 text-sm leading-relaxed mb-6 font-light transition-colors line-clamp-3">
                          {service.description || "Premium service tailored to your preferences."}
                        </p>
                        <Magnetic range={30} strength={0.25} className="mt-auto w-fit">
                          <Link href="/booking" className="text-xs font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-2 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors pointer-events-auto">
                            Reserve <ArrowRightOutlined />
                          </Link>
                        </Magnetic>
                      </div>
                    </div>
                  </ScrollReveal>
                ))
              ) : (
                <div className="col-span-3 text-center text-zinc-500 py-12 w-full flex justify-center items-center">
                  <div className="animate-pulse">Loading Services...</div>
                </div>
              )}
            </div>
          </div>

          {/* ✅ View Full Menu link (Centered for all screens) */}
          <div className="flex justify-center mt-12 md:mt-16">
            <Link href="/services" className="border-b border-amber-600 dark:border-amber-500 text-amber-600 dark:text-amber-500 pb-1 text-xs font-bold tracking-[0.2em] uppercase transition-all hover:text-zinc-900 dark:hover:text-white hover:border-zinc-900 dark:hover:border-white">
              View Full Menu
            </Link>
          </div>

        </div>
      </section>
      {/* =========================================
          4. THE MASTERS (TEAM)
      ========================================= */}
      <section className="py-32 overflow-hidden border-b border-zinc-200 dark:border-zinc-800/50 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-6 relative text-center">

          <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 transition-colors">The Artisans</h3>
          <h2 className="text-4xl md:text-5xl font-black mb-12 md:mb-20 text-zinc-900 dark:text-white transition-colors">Meet The <span className="font-serif italic font-light text-zinc-500">Masters</span></h2>

          {/* ✅ Relative Wrapper for Carousel & Mobile Overlay Buttons */}
          <div className="relative group/artisans -mx-6 md:mx-0">

            {/* ✅ Stylish Mobile Absolute Overlay Buttons in Amber Theme (Hidden on Desktop) */}
            {/* Previous Button (Over Left Side) */}
            <button
              onClick={() => document.getElementById('mobile-artisans-carousel')?.scrollBy({ left: -320, behavior: 'smooth' })}
              className="absolute left-2 top-[160px] -translate-y-1/2 z-30 md:hidden w-12 h-12 flex items-center justify-center rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-amber-500/50 text-amber-600 dark:text-amber-500 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:text-zinc-900 active:bg-amber-600 active:text-white dark:active:bg-amber-500 dark:active:text-zinc-900 transition-all opacity-100 active:scale-95 shadow-xl"
              aria-label="Scroll Left"
            >
              <ArrowLeftOutlined className="text-xl" />
            </button>

            {/* Next Button (Over Right Side) */}
            <button
              onClick={() => document.getElementById('mobile-artisans-carousel')?.scrollBy({ left: 320, behavior: 'smooth' })}
              className="absolute right-2 top-[160px] -translate-y-1/2 z-30 md:hidden w-12 h-12 flex items-center justify-center rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-amber-500/50 text-amber-600 dark:text-amber-500 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:text-zinc-900 active:bg-amber-600 active:text-white dark:active:bg-amber-500 dark:active:text-zinc-900 transition-all opacity-100 active:scale-95 shadow-xl"
              aria-label="Scroll Right"
            >
              <ArrowRightOutlined className="text-xl" />
            </button>

            {/* ✅ Main Carousel Track (Flex on mobile for swipe, Grid on desktop) */}
            <div
              id="mobile-artisans-carousel"
              className="flex md:grid overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none md:grid-cols-4 gap-6 md:gap-8 hide-scrollbar pb-8 md:pb-0 px-6 md:px-0 scroll-smooth"
            >
              {barbers.length > 0 ? (
                barbers.map((barber, index) => (
                  <ScrollReveal key={barber.id} direction="down" delay={index * 0.15} className="w-[85vw] sm:w-[350px] shrink-0 snap-center md:w-auto md:shrink flex flex-col">
                    <div className="flex flex-col items-center group cursor-pointer relative w-full h-full">
                      <div className="w-full sm:w-80 md:w-56 h-80 md:h-72 overflow-hidden mb-6 border border-zinc-200 dark:border-zinc-800 group-hover:border-amber-500/50 transition-colors duration-500 shadow-md dark:shadow-none bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center relative">
                        {barber.imageUrl ? (
                          <Image fill src={barber.imageUrl} alt={barber.name} className="w-full h-full object-cover xl:grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" />
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-700">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white tracking-wide transition-colors whitespace-nowrap text-center px-2">{barber.name}</h4>
                      <p className="text-amber-600 dark:text-amber-500 font-light text-sm mb-3 tracking-widest uppercase mt-1">
                        {barber.role === 'OWNER' ? 'Master Stylist' : barber.role === 'MANAGER' ? 'Senior Barber' : 'Barber'}
                      </p>
                    </div>
                  </ScrollReveal>
                ))
              ) : (
                <div className="col-span-4 text-center text-zinc-500 py-12 w-full flex justify-center items-center">
                  <div className="animate-pulse">Loading Artisans...</div>
                </div>
              )}
            </div>

          </div>

          {/* ✅ View All Artisans link (Centered for all screens) */}
          <div className="flex justify-center mt-12 md:mt-16">
            <Link href="/barbers" className="border-b border-amber-600 dark:border-amber-500 text-amber-600 dark:text-amber-500 pb-1 text-xs font-bold tracking-[0.2em] uppercase transition-all hover:text-zinc-900 dark:hover:text-white hover:border-zinc-900 dark:hover:border-white">
              View All Artisans
            </Link>
          </div>

        </div>
      </section>
      {/* =========================================
          5. CLIENT REVIEWS (NEW GOOGLE REVIEWS SECTION)
      ========================================= */}
      <section ref={reviewsRef} className="py-32 relative overflow-hidden transition-colors duration-500">

        {/* Decorative Background Glows */}
        <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">

          <div className="text-center mb-12 md:mb-20 relative z-10">
            <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 transition-colors">Client Voices</h3>
            <h2 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white transition-colors mb-6">
              Rated <span className="font-serif italic font-light text-amber-600 dark:text-amber-500">4.5 / 5</span> on <GoogleOutlined className="text-[32px] md:text-[40px] ml-2 -mb-1 text-zinc-900 dark:text-white transition-colors" />
            </h2>
            <div className="flex justify-center gap-1 text-amber-500 text-xl">
              <StarFilled /><StarFilled /><StarFilled /><StarFilled /><StarFilled className="opacity-40" />
            </div>
          </div>

          {/* ✅ Relative Wrapper for Carousel & Mobile Overlay Buttons */}
          <div className="relative group/reviews -mx-6 md:mx-0">

            {/* ✅ Stylish Mobile Absolute Overlay Buttons in Amber Theme (Hidden on Desktop) */}
            {/* Previous Button */}
            <button
              onClick={() => document.getElementById('mobile-reviews-carousel')?.scrollBy({ left: -320, behavior: 'smooth' })}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 md:hidden w-12 h-12 flex items-center justify-center rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-amber-500/50 text-amber-600 dark:text-amber-500 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:text-zinc-900 active:bg-amber-600 active:text-white dark:active:bg-amber-500 dark:active:text-zinc-900 transition-all opacity-100 active:scale-95 shadow-xl"
              aria-label="Scroll Left"
            >
              <ArrowLeftOutlined className="text-xl" />
            </button>

            {/* Next Button */}
            <button
              onClick={() => document.getElementById('mobile-reviews-carousel')?.scrollBy({ left: 320, behavior: 'smooth' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 md:hidden w-12 h-12 flex items-center justify-center rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-amber-500/50 text-amber-600 dark:text-amber-500 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:text-zinc-900 active:bg-amber-600 active:text-white dark:active:bg-amber-500 dark:active:text-zinc-900 transition-all opacity-100 active:scale-95 shadow-xl"
              aria-label="Scroll Right"
            >
              <ArrowRightOutlined className="text-xl" />
            </button>

            {/* ✅ Main Carousel Track (Flex on mobile for swipe, Grid on desktop) */}
            <div
              id="mobile-reviews-carousel"
              className="flex md:grid overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none md:grid-cols-3 gap-6 md:gap-8 hide-scrollbar pb-8 md:pb-0 px-6 md:px-0 scroll-smooth relative z-10"
            >
              {/* Review Card 1 */}
              <ScrollReveal direction="down" className="w-[85vw] sm:w-[350px] shrink-0 snap-center md:w-auto md:shrink flex">
                <div className="review-card flex flex-col h-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/60 dark:border-zinc-800/60 p-8 shadow-lg dark:shadow-none hover:border-amber-500/50 transition-colors duration-300 w-full">
                  <div className="flex gap-1 text-amber-500 text-sm mb-6">
                    <StarFilled /><StarFilled /><StarFilled /><StarFilled /><StarFilled />
                  </div>
                  {/* ✅ Exchanged opacity and flex layout to ensure equal card heights */}
                  <p className="text-zinc-600 dark:text-zinc-300 font-light leading-relaxed mb-8 italic flex-1">
                    &ldquo;Absolutely top-tier service. I walked in expecting a standard haircut and left feeling like a new man. The hot towel shave is a must-try. Mr Polaa&apos;s attention to detail is unmatched.&rdquo;
                  </p>
                  <div className="flex items-center gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-auto">
                    <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-400">AM</div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white tracking-wide">Asitha M.</h4>
                      <p className="text-[10px] text-zinc-500 tracking-widest uppercase">Verified Client</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Review Card 2 */}
              <ScrollReveal direction="down" delay={0.15} className="w-[85vw] sm:w-[350px] shrink-0 snap-center md:w-auto md:shrink flex">
                <div className="review-card flex flex-col h-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/60 dark:border-zinc-800/60 p-8 shadow-lg dark:shadow-none hover:border-amber-500/50 transition-colors duration-300 w-full">
                  <div className="flex gap-1 text-amber-500 text-sm mb-6">
                    <StarFilled /><StarFilled /><StarFilled /><StarFilled /><StarFilled />
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-300 font-light leading-relaxed mb-8 italic flex-1">
                    &ldquo;The best fade I&apos;ve had in Sri Lanka. Mahesh understood exactly what I wanted and executed it perfectly. The ambiance of the shop feels incredibly premium yet welcoming.&rdquo;
                  </p>
                  <div className="flex items-center gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-auto">
                    <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-400">SR</div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white tracking-wide">Shehan R.</h4>
                      <p className="text-[10px] text-zinc-500 tracking-widest uppercase">Verified Client</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Review Card 3 */}
              <ScrollReveal direction="down" delay={0.3} className="w-[85vw] sm:w-[350px] shrink-0 snap-center md:w-auto md:shrink flex">
                <div className="review-card flex flex-col h-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/60 dark:border-zinc-800/60 p-8 shadow-lg dark:shadow-none hover:border-amber-500/50 transition-colors duration-300 w-full">
                  <div className="flex gap-1 text-amber-500 text-sm mb-6">
                    <StarFilled /><StarFilled /><StarFilled /><StarFilled /><StarFilled />
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-300 font-light leading-relaxed mb-8 italic flex-1">
                    &ldquo;Booking online was so smooth, and they started right on time. The styling products they use smell fantastic. Found my permanent grooming spot in town.&rdquo;
                  </p>
                  <div className="flex items-center gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-auto">
                    <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-400">DJ</div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white tracking-wide">Dinuka J.</h4>
                      <p className="text-[10px] text-zinc-500 tracking-widest uppercase">Verified Client</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================
          6. CTA BANNER
      ========================================= */}
      <section className="relative py-32 px-6 overflow-hidden border-t border-zinc-200 dark:border-zinc-900 transition-colors duration-500">
        <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-950 transition-colors duration-500">
          <Image fill src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=2070&auto=format&fit=crop" alt="Shop Interior" className="object-cover opacity-20 dark:opacity-10 grayscale mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-100 via-zinc-100/80 dark:from-zinc-950 dark:via-zinc-950/80 to-transparent transition-colors duration-500"></div>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white mb-6 tracking-tight transition-colors">Demand <span className="font-serif italic font-light text-amber-600 dark:text-amber-500 transition-colors">Excellence.</span></h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-12 font-light max-w-xl mx-auto transition-colors">Your time is valuable. Bypass the waiting room by securing your preferred time and artisan online.</p>
          <Link
            href="/booking"
            className="inline-flex items-center justify-center gap-3 bg-amber-600 text-white dark:text-zinc-950 hover:bg-amber-700 dark:hover:bg-amber-500 font-bold uppercase tracking-widest text-sm py-5 px-12 transition-all hover:scale-105 shadow-xl dark:shadow-none"
          >
            Secure Your Appointment
          </Link>
        </div>
      </section>

    </div>
  );
}