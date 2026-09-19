"use client";

import React from 'react';
import Image from 'next/image';
import ScrollReveal from '@/components/ui/ScrollReveal';
import PublicPagination from '@/components/website/PublicPagination';
import { usePagedList } from '@/hooks/usePagedList';
import SearchBar from '@/components/website/SearchBar';
import { useSearchFilter } from '@/hooks/useSearchFilter';

export interface PublicBarber {
  id: string;
  name: string;
  role: string;
  imageUrl: string | null;
  shop: { name: string } | null;
}

export default function BarbersGrid({ barbers }: { barbers: PublicBarber[] }) {
  const { query, setQuery, filtered } = useSearchFilter(barbers, (b) => [b.name, b.shop?.name, b.role === 'OWNER' ? 'master stylist' : b.role === 'MANAGER' ? 'senior barber' : 'barber']);
  const { pageItems, page, setPage, totalPages } = usePagedList(filtered, 12);

  return (
    <>
      {barbers.length > 4 && (
        <div className="max-w-xl mx-auto mb-8 md:mb-12">
          <SearchBar
            value={query}
            onChange={(v) => { setQuery(v); setPage(1); }}
            placeholder="Search barbers"
            resultText={`${filtered.length} of ${barbers.length} barbers`}
          />
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8 md:gap-12">
        {barbers.length === 0 ? (
          <div className="col-span-full text-center text-zinc-500 py-12">
            No barbers found at the moment.
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center text-zinc-500 py-12">
            No barbers match your search.
          </div>
        ) : (
          pageItems.map((barber, index) => (
            <ScrollReveal key={barber.id} direction="up" delay={(index % 4) * 0.1}>
              <div className="group flex flex-col items-center cursor-pointer">
                <div className="w-full aspect-[4/5] overflow-hidden mb-6 border border-zinc-200 dark:border-zinc-800 group-hover:border-amber-500/50 transition-colors duration-500 shadow-sm dark:shadow-none bg-zinc-100 dark:bg-zinc-900 relative">
                  {barber.imageUrl ? (
                    <Image
                      src={barber.imageUrl}
                      alt={barber.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw"
                      className="object-cover xl:grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                  )}
                </div>
                <h4 className="text-xl font-bold text-zinc-900 dark:text-white tracking-wide transition-colors text-center">
                  {barber.name}
                </h4>
                <p className="text-amber-600 dark:text-amber-500 font-bold text-xs mb-3 tracking-widest uppercase mt-2">
                  {barber.role === 'OWNER' ? 'Master Stylist' : barber.role === 'MANAGER' ? 'Senior Barber' : 'Barber'}
                </p>

                <div className="flex flex-col items-center text-sm text-zinc-500 dark:text-zinc-400 font-light mt-2 space-y-1">
                  {barber.shop && (
                    <p className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-amber-500">
                        <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                      </svg>
                      {barber.shop.name}
                    </p>
                  )}
                </div>
              </div>
            </ScrollReveal>
          ))
        )}
      </div>

      <PublicPagination current={page} totalPages={totalPages} onChange={setPage} />
    </>
  );
}
