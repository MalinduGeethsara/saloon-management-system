"use client";

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  CalendarOutlined, 
  ScissorOutlined, 
  ArrowRightOutlined,
  CrownOutlined,
  StarFilled,
  GoogleOutlined
} from '@ant-design/icons';
import gsap from 'gsap';

export default function WebsiteHomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);

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

    // --- Scroll-Triggered Animation for Review Cards ---
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          gsap.fromTo('.review-card', 
            { y: 60, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: 'power3.out' }
          );
          observer.unobserve(entry.target); // Only animate once
        }
      });
    }, { threshold: 0.2 }); // Triggers when 20% of the section is visible

    if (reviewsRef.current) {
      observer.observe(reviewsRef.current);
    }

    return () => {
      ctx.revert();
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-amber-600 selection:text-white font-sans transition-colors duration-500">
      
      {/* =========================================
          1. IMMERSIVE HERO SECTION
      ========================================= */}
      <section className="relative flex flex-col items-center justify-center min-h-[115dvh] px-6 text-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-white dark:bg-black transition-colors duration-500">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover opacity-100 scale-125"
          >
            <source src="/videos/home/carosel_video.mp4" type="video/mp4" />
          </video>
          <div className="overlay-bg absolute inset-0 bg-gradient-to-b from-zinc-50/10 via-zinc-50/40 to-zinc-50 dark:from-zinc-950/40 dark:via-zinc-950/70 dark:to-zinc-950 z-10 transition-colors duration-500"></div>
        </div>

        <div className="relative z-20 max-w-5xl mx-auto pt-20">
          <div className="reveal-text inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/60 dark:bg-white/5 border border-zinc-200 dark:border-white/10 backdrop-blur-md mb-8 text-[11px] font-bold tracking-[0.3em] uppercase text-amber-600 dark:text-amber-500 transition-colors shadow-sm dark:shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            The Premium Standard
          </div>
          
          <h1 className="reveal-text text-5xl md:text-7xl lg:text-[6rem] font-black text-zinc-900 dark:text-white mb-6 leading-[1.05] tracking-tighter transition-colors drop-shadow-sm dark:drop-shadow-none">
            Mastering The <br />
            <span className="font-serif italic font-light text-amber-600 dark:text-amber-500 mr-4 transition-colors">Art</span> 
            Of Grooming.
          </h1>
          
          <p className="reveal-text text-lg md:text-xl text-zinc-800 dark:text-zinc-300 mb-12 max-w-2xl mx-auto leading-relaxed font-medium dark:font-light transition-colors drop-shadow-md dark:drop-shadow-sm">
            An exclusive sanctuary for the modern gentleman. Precision tailoring, traditional hot towel shaves, and uncompromising quality.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center w-full sm:w-auto">
            <Link 
              href="/book"
              className="reveal-btn group relative flex items-center justify-center gap-3 bg-amber-600 text-white dark:text-zinc-950 font-bold py-4 px-10 rounded-none overflow-hidden transition-all hover:bg-amber-700 dark:hover:bg-amber-500 shadow-xl dark:shadow-none"
            >
              <CalendarOutlined className="text-xl relative z-10" />
              <span className="relative z-10 tracking-wide uppercase text-sm">Reserve Your Chair</span>
            </Link>
            
            <Link 
              href="/services"
              className="reveal-btn flex items-center justify-center gap-2 bg-white/40 dark:bg-transparent backdrop-blur-sm border border-zinc-500 dark:border-zinc-700 text-zinc-900 dark:text-zinc-300 font-bold py-4 px-10 rounded-none transition-all hover:bg-white hover:border-amber-600 hover:text-amber-600 dark:hover:border-amber-500 dark:hover:text-amber-500 tracking-wide uppercase text-sm shadow-md dark:shadow-none"
            >
              Discover Services
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================
          2. THE CRAFT (ABOUT)
      ========================================= */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7 grid grid-cols-2 gap-6 relative">
            <div className="flex flex-col gap-6 mt-12">
              <img 
                src="https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?q=80&w=2000&auto=format&fit=crop" 
                alt="Barber Tools" 
                className="w-full h-80 object-cover rounded-none grayscale hover:grayscale-0 transition-all duration-700 shadow-xl dark:shadow-none"
              />
            </div>
            <div className="flex flex-col gap-6">
              <img 
                src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop" 
                alt="Vintage Chair" 
                className="w-full h-[28rem] object-cover rounded-none grayscale hover:grayscale-0 transition-all duration-700 shadow-xl dark:shadow-none"
              />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-600/10 blur-[100px] rounded-full z-[-1]"></div>
          </div>

          <div className="lg:col-span-5 flex flex-col">
            <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-6 flex items-center gap-4 transition-colors">
              <span className="w-12 h-[1px] bg-amber-600 dark:bg-amber-500 transition-colors"></span> Est. 2024
            </h3>
            <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight text-zinc-900 dark:text-white transition-colors">
              Tradition Meets <br/><span className="font-serif italic font-light text-zinc-500">Modern Precision.</span>
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed mb-10 font-light transition-colors">
              We don't just cut hair; we architect your personal style. Every detail, from the ambient lighting to the rich lather of our shaving creams, is curated to provide a momentary escape from the ordinary.
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
          </div>
        </div>
      </section>

      {/* =========================================
          3. THE MENU (SERVICES)
      ========================================= */}
      <section className="py-32 bg-white dark:bg-zinc-900/50 border-y border-zinc-200 dark:border-zinc-800/50 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-6">
            <div>
              <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 transition-colors">Curated Menu</h3>
              <h2 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white transition-colors">Signature <span className="font-serif italic font-light text-zinc-500">Services</span></h2>
            </div>
            <Link href="/services" className="border-b border-amber-600 dark:border-amber-500 text-amber-600 dark:text-amber-500 pb-1 text-xs font-bold tracking-[0.2em] uppercase transition-all hover:text-zinc-900 dark:hover:text-white hover:border-zinc-900 dark:hover:border-white">
              View Full Menu
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Service Cards (Same as before) */}
            <div className="group relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 transition-colors duration-500 cursor-pointer overflow-hidden shadow-sm hover:shadow-md dark:shadow-none">
              <div className="h-72 overflow-hidden relative">
                <div className="absolute inset-0 bg-black/20 dark:bg-black/40 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                <img src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1988&auto=format&fit=crop" alt="Haircut" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 grayscale group-hover:grayscale-0" />
                <div className="absolute bottom-0 left-0 w-full p-6 z-20 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 to-transparent">
                  <div className="text-amber-600 dark:text-amber-500 font-mono tracking-widest text-sm mb-2 drop-shadow-md">LKR 2,500</div>
                  <h4 className="text-2xl font-bold text-zinc-900 dark:text-white drop-shadow-md">The Executive</h4>
                </div>
              </div>
              <div className="p-6 pt-2">
                <p className="text-zinc-600 dark:text-zinc-500 text-sm leading-relaxed mb-6 font-light transition-colors">A meticulous structural cut, finished with a crisp razor lineup, hot lather neck shave, and premium styling.</p>
                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-2 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                  Reserve <ArrowRightOutlined/>
                </span>
              </div>
            </div>

            <div className="group relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 transition-colors duration-500 cursor-pointer overflow-hidden shadow-sm hover:shadow-md dark:shadow-none">
              <div className="h-72 overflow-hidden relative">
                <div className="absolute inset-0 bg-black/20 dark:bg-black/40 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                <img src="https://images.unsplash.com/photo-1512864084360-7c0c4d0a0845?q=80&w=2070&auto=format&fit=crop" alt="Shave" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 grayscale group-hover:grayscale-0" />
                <div className="absolute bottom-0 left-0 w-full p-6 z-20 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 to-transparent">
                  <div className="text-amber-600 dark:text-amber-500 font-mono tracking-widest text-sm mb-2 drop-shadow-md">LKR 1,800</div>
                  <h4 className="text-2xl font-bold text-zinc-900 dark:text-white drop-shadow-md">Classic Shave</h4>
                </div>
              </div>
              <div className="p-6 pt-2">
                <p className="text-zinc-600 dark:text-zinc-500 text-sm leading-relaxed mb-6 font-light transition-colors">Traditional hot towel wet shave utilizing essential oils, soothing balms, and a master's straight razor touch.</p>
                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-2 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                  Reserve <ArrowRightOutlined/>
                </span>
              </div>
            </div>

            <div className="group relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 transition-colors duration-500 cursor-pointer overflow-hidden shadow-sm hover:shadow-md dark:shadow-none">
              <div className="h-72 overflow-hidden relative">
                <div className="absolute inset-0 bg-black/20 dark:bg-black/40 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                <img src="https://images.unsplash.com/photo-1582239459526-9d18e8d87556?q=80&w=2070&auto=format&fit=crop" alt="Beard" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 grayscale group-hover:grayscale-0" />
                <div className="absolute bottom-0 left-0 w-full p-6 z-20 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 to-transparent">
                  <div className="text-amber-600 dark:text-amber-500 font-mono tracking-widest text-sm mb-2 drop-shadow-md">LKR 3,800</div>
                  <h4 className="text-2xl font-bold text-zinc-900 dark:text-white drop-shadow-md">The Sovereign</h4>
                </div>
              </div>
              <div className="p-6 pt-2">
                <p className="text-zinc-600 dark:text-zinc-500 text-sm leading-relaxed mb-6 font-light transition-colors">Our ultimate package. The Executive cut paired with a meticulous beard sculpting and revitalizing mini-facial.</p>
                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-2 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                  Reserve <ArrowRightOutlined/>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          4. THE MASTERS (TEAM)
      ========================================= */}
      <section className="py-32 px-6 max-w-7xl mx-auto text-center border-b border-zinc-200 dark:border-zinc-800/50">
        <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 transition-colors">The Artisans</h3>
        <h2 className="text-4xl md:text-5xl font-black mb-20 text-zinc-900 dark:text-white transition-colors">Meet The <span className="font-serif italic font-light text-zinc-500">Masters</span></h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12">
          {/* Artisan 1 */}
          <div className="flex flex-col items-center group cursor-pointer">
            <div className="w-56 h-72 overflow-hidden mb-6 border border-zinc-200 dark:border-zinc-800 group-hover:border-amber-500/50 transition-colors duration-500 shadow-md dark:shadow-none">
              <img src="https://images.unsplash.com/photo-1618077360395-f3068be8e001?q=80&w=1780&auto=format&fit=crop" alt="Barber" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" />
            </div>
            <h4 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-wide transition-colors">Kasun</h4>
            <p className="text-zinc-500 font-light text-sm mb-3 tracking-widest uppercase mt-1">Senior Barber</p>
          </div>

          {/* Artisan 2 */}
          <div className="flex flex-col items-center group cursor-pointer">
            <div className="w-56 h-72 overflow-hidden mb-6 border border-zinc-200 dark:border-zinc-800 group-hover:border-amber-500/50 transition-colors duration-500 shadow-md dark:shadow-none">
              <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1887&auto=format&fit=crop" alt="Barber" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" />
            </div>
            <h4 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-wide transition-colors">Danushka</h4>
            <p className="text-zinc-500 font-light text-sm mb-3 tracking-widest uppercase mt-1">Master Stylist</p>
          </div>

          {/* Artisan 3 */}
          <div className="flex flex-col items-center group cursor-pointer">
            <div className="w-56 h-72 overflow-hidden mb-6 border border-zinc-200 dark:border-zinc-800 group-hover:border-amber-500/50 transition-colors duration-500 shadow-md dark:shadow-none">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop" alt="Barber" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" />
            </div>
            <h4 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-wide transition-colors">Nimal</h4>
            <p className="text-zinc-500 font-light text-sm mb-3 tracking-widest uppercase mt-1">Style Director</p>
          </div>
        </div>
      </section>

      {/* =========================================
          5. CLIENT REVIEWS (NEW GOOGLE REVIEWS SECTION)
      ========================================= */}
      <section ref={reviewsRef} className="py-32 px-6 max-w-7xl mx-auto relative overflow-hidden">
        {/* Decorative Background Glows */}
        <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="text-center mb-20 relative z-10">
          <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 transition-colors">Client Voices</h3>
          <h2 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white transition-colors mb-6">
            Rated <span className="font-serif italic font-light text-amber-600 dark:text-amber-500">4.5 / 5</span> on <GoogleOutlined className="text-[32px] md:text-[40px] ml-2 -mb-1 text-zinc-900 dark:text-white transition-colors" />
          </h2>
          <div className="flex justify-center gap-1 text-amber-500 text-xl">
             <StarFilled /><StarFilled /><StarFilled /><StarFilled /><StarFilled className="opacity-40" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {/* Review Card 1 */}
          <div className="review-card opacity-0 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/60 dark:border-zinc-800/60 p-8 shadow-lg dark:shadow-none hover:border-amber-500/50 transition-colors duration-300">
            <div className="flex gap-1 text-amber-500 text-sm mb-6">
              <StarFilled /><StarFilled /><StarFilled /><StarFilled /><StarFilled />
            </div>
            <p className="text-zinc-600 dark:text-zinc-300 font-light leading-relaxed mb-8 italic">
              "Absolutely top-tier service. I walked in expecting a standard haircut and left feeling like a new man. The hot towel shave is a must-try. Mr Polaa's attention to detail is unmatched."
            </p>
            <div className="flex items-center gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-6">
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-400">AM</div>
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white tracking-wide">Asitha M.</h4>
                <p className="text-[10px] text-zinc-500 tracking-widest uppercase">Verified Client</p>
              </div>
            </div>
          </div>

          {/* Review Card 2 */}
          <div className="review-card opacity-0 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/60 dark:border-zinc-800/60 p-8 shadow-lg dark:shadow-none hover:border-amber-500/50 transition-colors duration-300">
            <div className="flex gap-1 text-amber-500 text-sm mb-6">
              <StarFilled /><StarFilled /><StarFilled /><StarFilled /><StarFilled />
            </div>
            <p className="text-zinc-600 dark:text-zinc-300 font-light leading-relaxed mb-8 italic">
              "The best fade I've had in Sri Lanka. Kasun understood exactly what I wanted and executed it perfectly. The ambiance of the shop feels incredibly premium yet welcoming."
            </p>
            <div className="flex items-center gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-6">
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-400">SR</div>
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white tracking-wide">Shehan R.</h4>
                <p className="text-[10px] text-zinc-500 tracking-widest uppercase">Verified Client</p>
              </div>
            </div>
          </div>

          {/* Review Card 3 */}
          <div className="review-card opacity-0 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/60 dark:border-zinc-800/60 p-8 shadow-lg dark:shadow-none hover:border-amber-500/50 transition-colors duration-300">
            <div className="flex gap-1 text-amber-500 text-sm mb-6">
              <StarFilled /><StarFilled /><StarFilled /><StarFilled /><StarFilled />
            </div>
            <p className="text-zinc-600 dark:text-zinc-300 font-light leading-relaxed mb-8 italic">
              "Booking online was so smooth, and they started right on time. The styling products they use smell fantastic. Found my permanent grooming spot in town."
            </p>
            <div className="flex items-center gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-6">
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-400">DJ</div>
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white tracking-wide">Dinuka J.</h4>
                <p className="text-[10px] text-zinc-500 tracking-widest uppercase">Verified Client</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          6. CTA BANNER
      ========================================= */}
      <section className="relative py-32 px-6 overflow-hidden border-t border-zinc-200 dark:border-zinc-900 transition-colors duration-500">
        <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-950 transition-colors duration-500">
          <img src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=2070&auto=format&fit=crop" alt="Shop Interior" className="w-full h-full object-cover opacity-20 dark:opacity-10 grayscale mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-100 via-zinc-100/80 dark:from-zinc-950 dark:via-zinc-950/80 to-transparent transition-colors duration-500"></div>
        </div>
        
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white mb-6 tracking-tight transition-colors">Demand <span className="font-serif italic font-light text-amber-600 dark:text-amber-500 transition-colors">Excellence.</span></h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-12 font-light max-w-xl mx-auto transition-colors">Your time is valuable. Bypass the waiting room by securing your preferred time and artisan online.</p>
          <Link 
            href="/book"
            className="inline-flex items-center justify-center gap-3 bg-amber-600 text-white dark:text-zinc-950 hover:bg-amber-700 dark:hover:bg-amber-500 font-bold uppercase tracking-widest text-sm py-5 px-12 transition-all hover:scale-105 shadow-xl dark:shadow-none"
          >
            Secure Your Appointment
          </Link>
        </div>
      </section>

    </div>
  );
}