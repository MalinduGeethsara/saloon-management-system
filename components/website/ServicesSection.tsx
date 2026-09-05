"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import Magnetic from '@/components/ui/Magnetic';
import ScrollReveal from '@/components/ui/ScrollReveal';

interface Service {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  duration: number;
  imageUrl?: string | null;
}

export default function ServicesSection({ services }: { services: Service[] }) {
  return (
    <section className="py-32 bg-white dark:bg-zinc-900/50 border-y border-zinc-200 dark:border-zinc-800/50 transition-colors duration-500 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative">

        <ScrollReveal direction="down">
          <div className="text-center mb-12 md:mb-20">
            <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 transition-colors">Curated Menu</h3>
            <h2 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white transition-colors">
              Signature <span className="font-serif italic font-light text-zinc-500">Services</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="relative group/menu -mx-6 md:mx-0">
          <button
            onClick={() => document.getElementById('mobile-services-carousel')?.scrollBy({ left: -350, behavior: 'smooth' })}
            className="absolute left-2 top-[144px] -translate-y-1/2 z-30 md:hidden w-12 h-12 flex items-center justify-center rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-amber-500/50 text-amber-600 dark:text-amber-500 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:text-zinc-900 active:bg-amber-600 active:text-white dark:active:bg-amber-500 dark:active:text-zinc-900 transition-all opacity-100 active:scale-95 shadow-xl"
            aria-label="Scroll Left"
          >
            <ArrowLeftOutlined className="text-xl" />
          </button>
          <button
            onClick={() => document.getElementById('mobile-services-carousel')?.scrollBy({ left: 350, behavior: 'smooth' })}
            className="absolute right-2 top-[144px] -translate-y-1/2 z-30 md:hidden w-12 h-12 flex items-center justify-center rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-amber-500/50 text-amber-600 dark:text-amber-500 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:text-zinc-900 active:bg-amber-600 active:text-white dark:active:bg-amber-500 dark:active:text-zinc-900 transition-all opacity-100 active:scale-95 shadow-xl"
            aria-label="Scroll Right"
          >
            <ArrowRightOutlined className="text-xl" />
          </button>

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
                No services available at the moment.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center mt-12 md:mt-16">
          <Link href="/services" className="border-b border-amber-600 dark:border-amber-500 text-amber-600 dark:text-amber-500 pb-1 text-xs font-bold tracking-[0.2em] uppercase transition-all hover:text-zinc-900 dark:hover:text-white hover:border-zinc-900 dark:hover:border-white">
            View Full Menu
          </Link>
        </div>

      </div>
    </section>
  );
}
