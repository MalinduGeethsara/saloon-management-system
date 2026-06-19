"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRightOutlined } from '@ant-design/icons';

const products = [
  {
    title: "Centella Ampoule Calming Hydrating Serum 100ml",
    price: "LKR 9,900",
    description: "Powered by Centella Asiatica extract, this lightweight ampoule calms irritation, reduces redness, and strengthens the skin barrier.",
    img: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/CENT11_1Primary.webp?v=1781677590"
  },
  {
    title: "La Roche Posay Toleriane Purifying Foaming Cream Cleanser 125ml",
    price: "LKR 12,500",
    description: "A gentle purifying foaming cream cleanser formulated to cleanse skin while protecting its natural moisture barrier.",
    img: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/LAR48_1Primary.webp?v=1781677351"
  },
  {
    title: "La Roche Posay Effaclar Deep Cleansing Foaming Facial Cleanser 125ml",
    price: "LKR 12,500",
    description: "A deep cleansing foaming gel specifically formulated to gently eliminate impurities and excess sebum.",
    img: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/LAR47_1Primary.webp?v=1781677117"
  },
  {
    title: "Cetaphil Gentle Skin Cleanser 473ml",
    price: "LKR 10,500",
    description: "A dermatologist-recommended gentle skin cleanser that hydrates and soothes skin as it cleanses.",
    img: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/CET65_1primaryimage.webp?v=1781676221"
  },
  {
    title: "Cetaphil Daily Facial Cleanser 473ml",
    price: "LKR 10,500",
    description: "Effectively removes dirt, excess oil, and impurities without stripping normal to oily skin of its natural moisture.",
    img: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/Cetaphil_Daily_Facial_Cleanser_473ml_-_CET62-1_primary_1.webp?v=1743407864"
  },
  {
    title: "La Roche-Posay Hyalu B5 Suractive Anti-wrinkle Repairing Serum 30ml",
    price: "LKR 10,500",
    description: "Anti-wrinkle repairing serum formulated with hyaluronic acid and vitamin B5 to plump, hydrate, and repair the skin barrier.",
    img: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/LAR46_1primaryimage.webp?v=1781339684"
  },
  {
    title: "Cantu Shea Butter Strengthening Styling Gel 524g",
    price: "LKR 7,950",
    description: "Infused with pure shea butter to nourish strands while providing firm, flake-free control for textured and curly hair.",
    img: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/CANT001_1.jpg?v=1760071792"
  },
  {
    title: "La Roche Posay Mela B3 Gel Cleanser 200ml",
    price: "LKR 13,500",
    description: "Enriched with Niacinamide and gentle PHA exfoliants, it helps refine skin texture, brighten complexion, and support barrier health.",
    img: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/LAR45_1Primary.webp?v=1781268017"
  },
  {
    title: "La Roche Posay Vitamin C Purifying Cleanser 200ml",
    price: "LKR 13,500",
    description: "A purifying facial cleanser enriched with Vitamin C to brighten, smooth, and refresh the skin.",
    img: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/LAR44_1Primary.webp?v=1781267669"
  },
  {
    title: "Jovees Dry Skin Full Pack 1",
    price: "LKR 11,905",
    description: "A carefully selected dry skin collection combining essential products designed to cleanse, nourish, and revive skin.",
    img: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/BU024_1.webp?v=1780660628"
  },
  {
    title: "Neutrogena Ultra Sheer Face Lotion Sunscreen SPF 50 88ml",
    price: "LKR 5,900",
    description: "Lightweight face sunscreen with dry-touch technology and water-resistant protection, perfect for daily outdoor activities.",
    img: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/Neutrogena_Ultra_Sheer_Face_Lotion_Sunscreen_SPF_50_88ml_-_NUSS02-1primary.webp?v=1743407572"
  }
];

export default function ProductsPage() {
  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-amber-600 selection:text-white font-sans transition-colors duration-500 pt-24 pb-32">
      
      <div className="max-w-7xl mx-auto px-6 w-full">
        <div className="text-center mb-20">
          <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 transition-colors">Apothecary</h3>
          <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white transition-colors">Premium <span className="font-serif italic font-light text-zinc-500">Products</span></h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-6 max-w-xl mx-auto">Elevate your daily routine with our exclusive range of grooming essentials, available for purchase in-store.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <div key={index} className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 transition-colors duration-500 shadow-sm hover:shadow-md dark:shadow-none flex flex-col h-full">
              <div className="h-64 overflow-hidden relative bg-zinc-100 dark:bg-zinc-950">
                <div className="absolute inset-0 bg-black/25 dark:bg-black/45 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                <img src={product.img} alt={product.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 xl:grayscale group-hover:grayscale-0 mix-blend-multiply dark:mix-blend-normal" />
                <div className="absolute bottom-0 left-0 w-full p-6 z-20 bg-linear-to-t from-white dark:from-zinc-900/90 to-transparent">
                  <div className="text-amber-600 dark:text-amber-500 font-mono tracking-widest text-sm mb-2 drop-shadow-md">{product.price}</div>
                  <h4 className="text-2xl font-bold text-zinc-900 dark:text-white drop-shadow-md">{product.title}</h4>
                </div>
              </div>
              <div className="p-6 grow flex flex-col">
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6 font-light transition-colors grow line-clamp-2">{product.description}</p>
                <Link href="/contact" className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2 group-hover:text-amber-600 dark:hover:text-amber-500 transition-colors mt-auto w-fit">
                  Inquire Now <ArrowRightOutlined />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
