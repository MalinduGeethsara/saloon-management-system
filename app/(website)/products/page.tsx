"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRightOutlined } from '@ant-design/icons';
import ScrollReveal from "@/components/ui/ScrollReveal";
import Image from "next/image";
import { Spin } from 'antd';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/products')
      .then(res => res.json())
      .then(data => {
        if (data.products) {
          setProducts(data.products);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch products:", err);
        setLoading(false);
      });
  }, []);
  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-amber-600 selection:text-white font-sans transition-colors duration-500 pt-24 pb-32">
      
      <div className="max-w-7xl mx-auto px-6 w-full">
        <ScrollReveal direction="down">
          <div className="text-center mb-20">
            <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 transition-colors">Apothecary</h3>
            <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white transition-colors">Premium <span className="font-serif italic font-light text-zinc-500">Products</span></h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-6 max-w-xl mx-auto">Elevate your daily routine with our exclusive range of grooming essentials, available for purchase in-store.</p>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="flex justify-center items-center h-64 w-full">
            <Spin size="large" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center text-zinc-500 py-20 w-full">
            <p>No products available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <ScrollReveal key={product.id || index} direction="down" delay={(index % 3) * 0.15} className="flex flex-col h-full">
                <div className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 transition-colors duration-500 shadow-sm hover:shadow-md dark:shadow-none flex flex-col h-full w-full">
                  <div className="h-64 overflow-hidden relative bg-zinc-100 dark:bg-zinc-950 w-full flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/25 dark:bg-black/45 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                    {product.imageUrl ? (
                      <Image 
                        src={product.imageUrl.startsWith('http') ? product.imageUrl : (product.imageUrl.startsWith('/') ? product.imageUrl : `/${product.imageUrl}`)}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-1000 group-hover:scale-105 xl:grayscale group-hover:grayscale-0 mix-blend-multiply dark:mix-blend-normal" 
                      />
                    ) : (
                      <div className="text-zinc-400">No Image</div>
                    )}
                    <div className="absolute bottom-0 left-0 w-full p-6 z-20 bg-linear-to-t from-white dark:from-zinc-900/90 to-transparent">
                      <div className="text-amber-600 dark:text-amber-500 font-mono tracking-widest text-sm mb-2 drop-shadow-md">LKR {product.price?.toLocaleString()}</div>
                      <h4 className="text-2xl font-bold text-zinc-900 dark:text-white drop-shadow-md">{product.name}</h4>
                    </div>
                  </div>
                  <div className="p-6 grow flex flex-col w-full">
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6 font-light transition-colors grow line-clamp-2">{product.description || "Premium salon product."}</p>
                    <Link href="/contact" className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2 group-hover:text-amber-600 dark:hover:text-amber-500 transition-colors mt-auto w-fit">
                      Inquire Now <ArrowRightOutlined />
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
}
