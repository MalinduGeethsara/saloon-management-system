"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRightOutlined } from '@ant-design/icons';
import ScrollReveal from "@/components/ui/ScrollReveal";
import Image from "next/image";
import { Spin } from 'antd';
import { getPublicProducts } from '@/lib/actions/public';
import { usePagedList } from '@/hooks/usePagedList';
import PublicPagination from '@/components/website/PublicPagination';
import SearchBar from '@/components/website/SearchBar';
import { useSearchFilter } from '@/hooks/useSearchFilter';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const categories = React.useMemo(
    () => ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort()],
    [products],
  );
  const inCategory = React.useMemo(() => (category === 'All' ? products : products.filter((p) => p.category === category)), [products, category]);
  const { query, setQuery, filtered } = useSearchFilter(inCategory, (p) => [p.name, p.brand, p.category, p.description, p.price]);
  const { pageItems, page, setPage, totalPages } = usePagedList(filtered, 9);

  useEffect(() => {
    // Public action: only returns Active products and only public fields
    getPublicProducts()
      .then(data => setProducts(data ?? []))
      .catch(err => console.error("Failed to fetch products:", err))
      .finally(() => setLoading(false));
  }, []);
  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-amber-600 selection:text-white font-sans transition-colors duration-500 pt-10 pb-16 md:pt-24 md:pb-32">
      
      <div className="max-w-7xl mx-auto px-6 w-full">
        <ScrollReveal direction="down">
          <div className="text-center mb-10 md:mb-20">
            <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 transition-colors">Apothecary</h3>
            <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white transition-colors">Premium <span className="font-serif italic font-light text-zinc-500">Products</span></h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-6 max-w-xl mx-auto">Elevate your daily routine with our exclusive range of grooming essentials, available for purchase in-store.</p>
          </div>
        </ScrollReveal>

        {!loading && products.length > 0 && (
          <div className="max-w-xl mx-auto mb-8 md:mb-12">
            <SearchBar
              value={query}
              onChange={(v) => { setQuery(v); setPage(1); }}
              placeholder="Search products or brands"
              resultText={`${filtered.length} of ${products.length} products`}
            />
            {categories.length > 2 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Product categories">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="tab"
                    aria-selected={category === c}
                    onClick={() => { setCategory(c); setPage(1); }}
                    className={`shrink-0 h-9 px-4 text-xs font-bold uppercase tracking-widest border transition-colors ${category === c ? 'bg-amber-600 border-amber-600 text-white' : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-amber-500'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64 w-full">
            <Spin size="large" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center text-zinc-500 py-20 w-full">
            <p>No products available at the moment.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-zinc-500 py-16 w-full">
            <p className="mb-4">No products match your search.</p>
            <button type="button" onClick={() => { setQuery(''); setCategory('All'); }} className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 hover:underline">Clear search</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pageItems.map((product, index) => (
              <ScrollReveal key={product.id || index} direction="down" delay={(index % 3) * 0.15} className="flex flex-col h-full">
                <div className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 transition-colors duration-500 shadow-sm hover:shadow-md dark:shadow-none flex flex-col h-full w-full">
                  <div className="h-48 sm:h-64 overflow-hidden relative bg-zinc-100 dark:bg-zinc-950 w-full flex items-center justify-center">
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

        <PublicPagination current={page} totalPages={totalPages} onChange={setPage} />
      </div>
      
    </div>
  );
}
