"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRightOutlined } from '@ant-design/icons';

const services = [
  {
    title: "Hair Cutting",
    price: "LKR 500",
    description: "A precision haircut tailored to your preferences, complete with styling.",
    img: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1988&auto=format&fit=crop"
  },
  {
    title: "Beard Cutting",
    price: "LKR 400",
    description: "Expert beard shaping, trimming, and lineup to compliment your face structure.",
    img: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "Head Quick Massage",
    price: "LKR 400",
    description: "A relaxing head massage to ease tension, soothe stress, and improve circulation.",
    img: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=1987&auto=format&fit=crop"
  },
  {
    title: "Oil Treatment",
    price: "LKR 1,500",
    description: "Nourishing hot oil hair treatment to condition your scalp and strengthen hair follicles.",
    img: "https://images.unsplash.com/photo-1626806819282-2c1de02d0801?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "Gray Hair Cover",
    price: "LKR 1,200",
    description: "Seamless coverage of gray hairs using premium, natural-looking coloring solutions.",
    img: "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "Full Facial Treatment",
    price: "LKR 6,000",
    description: "Complete premium multi-step skin therapy including cleansing, scrub, mask, and deep hydration.",
    img: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "Gold Facial Treatment",
    price: "LKR 5,000",
    description: "Luxury skin rejuvenation infused with active gold elements for a bright, healthy glow.",
    img: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "Normal Facial Treatment",
    price: "LKR 3,500",
    description: "Standard facial cleansing and masking to refresh and clear your skin.",
    img: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "Gold Cleanup",
    price: "LKR 4,000",
    description: "Quick skin cleansing and tan removal treatment using premium gold scrubs and packs.",
    img: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "Scrub",
    price: "LKR 1,000",
    description: "Deep exfoliating facial scrub to clear dead skin cells and blackheads.",
    img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "Ear Piercing",
    price: "LKR 500",
    description: "Safe, quick, and hygienic ear piercing using sterile, premium studs.",
    img: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "Nose Piercing",
    price: "LKR 1,000",
    description: "Professional nose piercing performed under strict sterile conditions.",
    img: "https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?q=80&w=1974&auto=format&fit=crop"
  },
  {
    title: "Tongue Piercing",
    price: "LKR 2,000",
    description: "Hygiene-first professional tongue piercing using medical-grade titanium bars.",
    img: "https://images.unsplash.com/photo-1590246814883-57c511e76523?q=80&w=1974&auto=format&fit=crop"
  }
];

export default function ServicesPage() {
  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-amber-600 selection:text-white font-sans transition-colors duration-500 pt-24 pb-32">

      <div className="max-w-7xl mx-auto px-6 w-full">
        <div className="text-center mb-20">
          <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 transition-colors">Curated Menu</h3>
          <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white transition-colors">Signature <span className="font-serif italic font-light text-zinc-500">Services</span></h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div key={index} className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 transition-colors duration-500 shadow-sm hover:shadow-md dark:shadow-none flex flex-col h-full">
              <div className="h-64 overflow-hidden relative">
                <div className="absolute inset-0 bg-black/20 dark:bg-black/40 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                <img src={service.img} alt={service.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 xl:grayscale group-hover:grayscale-0" />
                <div className="absolute bottom-0 left-0 w-full p-6 z-20 bg-gradient-to-t from-white dark:from-zinc-900/90 to-transparent">
                  <div className="text-amber-600 dark:text-amber-500 font-mono tracking-widest text-sm mb-2 drop-shadow-md">{service.price}</div>
                  <h4 className="text-2xl font-bold text-zinc-900 dark:text-white drop-shadow-md">{service.title}</h4>
                </div>
              </div>
              <div className="p-6 flex-grow flex flex-col">
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6 font-light transition-colors flex-grow">{service.description}</p>
                <Link href="/booking" className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors mt-auto w-fit">
                  Reserve <ArrowRightOutlined />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
