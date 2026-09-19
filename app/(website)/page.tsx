export const revalidate = 60; // refresh data every 60 seconds

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getPublicBarbers, getPublicServices } from '@/lib/actions/public';
import {
  ScissorOutlined,
  CrownOutlined,
  StarFilled,
  GoogleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import ScrollReveal from '@/components/ui/ScrollReveal';
import HeroSection from '@/components/website/HeroSection';
import ServicesSection from '@/components/website/ServicesSection';
import BarbersSection from '@/components/website/BarbersSection';

export default async function WebsiteHomePage() {
  const [barbers, services] = await Promise.all([
    getPublicBarbers(),
    getPublicServices(),
  ]);

  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-amber-600 selection:text-white font-sans transition-colors duration-500">

      {/* 1. HERO */}
      <HeroSection services={services} />

      {/* 2. BRAND PARTNERS MARQUEE */}
      <ScrollReveal direction="down" delay={0.1}>
        <div className="relative py-12 bg-white dark:bg-zinc-950/20 border-b border-zinc-200 dark:border-zinc-900 transition-colors duration-500 overflow-hidden select-none">
          <div className="max-w-7xl mx-auto px-6 mb-4 flex items-center justify-center gap-3">
            <span className="h-[1px] w-12 bg-zinc-200 dark:bg-zinc-800 transition-colors"></span>
            <span className="text-[10px] uppercase font-bold tracking-[0.35em] text-zinc-400 dark:text-zinc-500 transition-colors">Premium Products We Trust</span>
            <span className="h-[1px] w-12 bg-zinc-200 dark:bg-zinc-800 transition-colors"></span>
          </div>
          <div className="relative w-full overflow-hidden flex mask-gradient-marquee py-2">
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

      {/* 3. THE CRAFT (ABOUT) */}
      <section className="py-16 md:py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <ScrollReveal direction="down" className="lg:col-span-7 grid grid-cols-2 gap-6 relative">
            <div className="flex flex-col gap-6 mt-6 sm:mt-12">
              <Image
                src="/images/site/barber-tools.jpg"
                alt="Barber Tools"
                width={800}
                height={500}
                className="w-full h-48 sm:h-80 object-cover rounded-none xl:grayscale hover:grayscale-0 transition-all duration-700 shadow-xl dark:shadow-none"
              />
            </div>
            <div className="flex flex-col gap-6">
              <Image
                src="/images/site/barber-chair.jpg"
                alt="Vintage Chair"
                width={800}
                height={800}
                className="w-full h-64 sm:h-[28rem] object-cover rounded-none xl:grayscale hover:grayscale-0 transition-all duration-700 shadow-xl dark:shadow-none"
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

      {/* 4. SERVICES */}
      {/* Phones already get a services rail inside the hero, so this larger section is md+ only */}
      <div className="hidden md:block">
        <ServicesSection services={services.slice(0, 3)} />
      </div>

      {/* 5. ARTISANS */}
      <BarbersSection barbers={barbers} />

      {/* 6. CLIENT REVIEWS */}
      <section className="py-16 md:py-32 relative overflow-hidden transition-colors duration-500">
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

          <div className="md:grid md:grid-cols-3 gap-6 md:gap-8 relative z-10 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-8 md:pb-0 -mx-6 md:mx-0 px-6 md:px-0">
            <ScrollReveal direction="down" className="w-[85vw] sm:w-[350px] shrink-0 snap-center md:w-auto md:shrink flex">
              <div className="flex flex-col h-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/60 dark:border-zinc-800/60 p-8 shadow-lg dark:shadow-none hover:border-amber-500/50 transition-colors duration-300 w-full">
                <div className="flex gap-1 text-amber-500 text-sm mb-6"><StarFilled /><StarFilled /><StarFilled /><StarFilled /><StarFilled /></div>
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

            <ScrollReveal direction="down" delay={0.15} className="w-[85vw] sm:w-[350px] shrink-0 snap-center md:w-auto md:shrink flex">
              <div className="flex flex-col h-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/60 dark:border-zinc-800/60 p-8 shadow-lg dark:shadow-none hover:border-amber-500/50 transition-colors duration-300 w-full">
                <div className="flex gap-1 text-amber-500 text-sm mb-6"><StarFilled /><StarFilled /><StarFilled /><StarFilled /><StarFilled /></div>
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

            <ScrollReveal direction="down" delay={0.3} className="w-[85vw] sm:w-[350px] shrink-0 snap-center md:w-auto md:shrink flex">
              <div className="flex flex-col h-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/60 dark:border-zinc-800/60 p-8 shadow-lg dark:shadow-none hover:border-amber-500/50 transition-colors duration-300 w-full">
                <div className="flex gap-1 text-amber-500 text-sm mb-6"><StarFilled /><StarFilled /><StarFilled /><StarFilled /><StarFilled /></div>
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
      </section>

      {/* 7. CTA BANNER */}
      <section className="relative py-16 md:py-32 px-6 overflow-hidden border-t border-zinc-200 dark:border-zinc-900 transition-colors duration-500">
        <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-950 transition-colors duration-500">
          <Image fill src="/images/site/shop-front.jpg" alt="Shop Interior" className="object-cover opacity-20 dark:opacity-10 grayscale mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-100 via-zinc-100/80 dark:from-zinc-950 dark:via-zinc-950/80 to-transparent transition-colors duration-500"></div>
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white mb-6 tracking-tight transition-colors">
            Demand <span className="font-serif italic font-light text-amber-600 dark:text-amber-500 transition-colors">Excellence.</span>
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-12 font-light max-w-xl mx-auto transition-colors">
            Your time is valuable. Bypass the waiting room by securing your preferred time and artisan online.
          </p>
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
