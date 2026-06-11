"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRightOutlined } from '@ant-design/icons';

const services = [
  {
    title: "The Executive",
    price: "LKR 2,500",
    description: "A meticulous structural cut, finished with a crisp razor lineup, hot lather neck shave, and premium styling.",
    img: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1988&auto=format&fit=crop"
  },
  {
    title: "Classic Shave",
    price: "LKR 1,800",
    description: "Traditional hot towel wet shave utilizing essential oils, soothing balms, and a master's straight razor touch.",
    img: "https://images.unsplash.com/photo-1512864084360-7c0c4d0a0845?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "The Sovereign",
    price: "LKR 3,800",
    description: "Our ultimate package. The Executive cut paired with a meticulous beard sculpting and revitalizing mini-facial.",
    img: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "Buzz Cut",
    price: "LKR 1,500",
    description: "A precision single or double-grade clipper cut all over, perfectly faded and lined up.",
    img: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop"
  },
  {
    title: "Beard Sculpting",
    price: "LKR 1,200",
    description: "Detailed beard shaping, trimming, and conditioning to suit your facial structure.",
    img: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "Mini-Facial",
    price: "LKR 2,000",
    description: "A rejuvenating facial treatment including cleansing, exfoliation, and a deep-conditioning mask.",
    img: "https://images.unsplash.com/photo-1516975080661-422fc996d1f9?q=80&w=1974&auto=format&fit=crop"
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
