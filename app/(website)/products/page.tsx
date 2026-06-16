"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRightOutlined } from '@ant-design/icons';

const products = [
  {
    title: "Matte Styling Clay",
    price: "LKR 3,000",
    description: "Provides a strong, pliable hold with a completely matte finish. Perfect for textured styles.",
    img: "https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "Nourishing Beard Oil",
    price: "LKR 2,500",
    description: "Infused with argan and jojoba oils to soften the beard and moisturize the skin underneath.",
    img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1974&auto=format&fit=crop"
  },
  {
    title: "Premium Pomade",
    price: "LKR 2,800",
    description: "Water-based pomade offering a medium hold and high shine for classic, slicked-back looks.",
    img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=2000&auto=format&fit=crop"
  },
  {
    title: "Invigorating Shampoo",
    price: "LKR 2,200",
    description: "A daily cleanser infused with peppermint and tea tree oil for a refreshing deep clean.",
    img: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=1974&auto=format&fit=crop"
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
                <div className="absolute bottom-0 left-0 w-full p-6 z-20 bg-gradient-to-t from-white dark:from-zinc-900/90 to-transparent">
                  <div className="text-amber-600 dark:text-amber-500 font-mono tracking-widest text-sm mb-2 drop-shadow-md">{product.price}</div>
                  <h4 className="text-2xl font-bold text-zinc-900 dark:text-white drop-shadow-md">{product.title}</h4>
                </div>
              </div>
              <div className="p-6 flex-grow flex flex-col">
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6 font-light transition-colors flex-grow">{product.description}</p>
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
