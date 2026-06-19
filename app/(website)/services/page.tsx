"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRightOutlined } from '@ant-design/icons';

const services = [
  {
    title: "Hair Cutting",
    price: "LKR 500",
    description: "A precision haircut tailored to your preferences, complete with styling.",
    img: "images/website/services/1.jpg"
  },
  {
    title: "Beard Cutting",
    price: "LKR 400",
    description: "Expert beard shaping, trimming, and lineup to compliment your face structure.",
    img: "images/website/services/2.jpg"
  },
  {
    title: "Quick Head Massage",
    price: "LKR 400",
    description: "A relaxing head massage to ease tension, soothe stress, and improve circulation.",
    img: "images/website/services/3.jpg"
  },
  {
    title: "Oil Treatment",
    price: "LKR 1,500",
    description: "Nourishing hot oil hair treatment to condition your scalp and strengthen hair follicles.",
    img: "images/website/services/4.jpg"
  },
  {
    title: "Gray Hair Cover",
    price: "LKR 1,200",
    description: "Seamless coverage of gray hairs using premium, natural-looking coloring solutions.",
    img: "images/website/services/5.jpg"
  },
  {
    title: "Full Facial Treatment",
    price: "LKR 6,000",
    description: "Complete premium multi-step skin therapy including cleansing, scrub, mask, and deep hydration.",
    img: "images/website/services/6.jpg"
  },
  {
    title: "Gold Facial Treatment",
    price: "LKR 5,000",
    description: "Luxury skin rejuvenation infused with active gold elements for a bright, healthy glow.",
    img: "images/website/services/7.jpg"
  },
  {
    title: "Normal Facial Treatment",
    price: "LKR 3,500",
    description: "Standard facial cleansing and masking to refresh and clear your skin.",
    img: "images/website/services/8.jpg"
  },
  {
    title: "Gold Cleanup",
    price: "LKR 4,000",
    description: "Quick skin cleansing and tan removal treatment using premium gold scrubs and packs.",
    img: "images/website/services/9.jpg"
  },
  {
    title: "Scrub",
    price: "LKR 1,000",
    description: "Deep exfoliating facial scrub to clear dead skin cells and blackheads.",
    img: "images/website/services/10.jpg"
  },
  {
    title: "Ear Piercing",
    price: "LKR 500",
    description: "Safe, quick, and hygienic ear piercing using sterile, premium studs.",
    img: "images/website/services/11.jpg"
  },
  {
    title: "Nose Piercing",
    price: "LKR 1,000",
    description: "Professional nose piercing performed under strict sterile conditions.",
    img: "images/website/services/12.jpg"
  },
  {
    title: "Tongue Piercing",
    price: "LKR 2,000",
    description: "Hygiene-first professional tongue piercing using medical-grade titanium bars.",
    img: "images/website/services/13.jpg"
  }
];

export default function ServicesPage() {
  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-amber-600 selection:text-white font-sans transition-colors duration-500 pt-24 pb-32">

      <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="text-center mb-20">
            <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 transition-colors">Curated Menu</h3>
            <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white transition-colors">Signature <span className="font-serif italic font-light text-zinc-500">Services</span></h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-6 max-w-xl mx-auto">Experience the pinnacle of men's grooming with our carefully curated selection of bespoke haircuts, traditional shaves, and premium treatments.</p>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div key={index} className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 transition-colors duration-500 shadow-sm hover:shadow-md dark:shadow-none flex flex-col h-full">
              <div className="h-64 overflow-hidden relative">
                <div className="absolute inset-0 bg-black/20 dark:bg-black/40 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                <img src={service.img} alt={service.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 xl:grayscale group-hover:grayscale-0" />
                <div className="absolute bottom-0 left-0 w-full p-6 z-20 bg-linear-to-t from-white dark:from-zinc-900/90 to-transparent">
                  <div className="text-amber-600 dark:text-amber-500 font-mono tracking-widest text-sm mb-2 drop-shadow-md">{service.price}</div>
                  <h4 className="text-2xl font-bold text-zinc-900 dark:text-white drop-shadow-md">{service.title}</h4>
                </div>
              </div>
              <div className="p-6 grow flex flex-col">
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6 font-light transition-colors grow">{service.description}</p>
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
