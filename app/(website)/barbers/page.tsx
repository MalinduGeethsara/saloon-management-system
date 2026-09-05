import React from 'react';
import Image from 'next/image';
import { db } from '@/lib/db';
import ScrollReveal from "@/components/ui/ScrollReveal";

// This forces the page to be dynamic so it fetches fresh data on load if needed
export const dynamic = 'force-dynamic';

export default async function BarbersPage() {
  // Fetch all staff members (excluding customers)
  const barbers = await db.user.findMany({
    where: {
      role: {
        in: ['BARBER', 'MANAGER', 'OWNER']
      }
    },
    select: {
      id: true,
      name: true,
      role: true,
      imageUrl: true,
      email: true,
      phone: true,
      shop: {
        select: {
          name: true
        }
      }
    }
  });

  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen pt-32 pb-24 px-6 transition-colors duration-500">
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-16 md:mb-24">
          <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 transition-colors">The Artisans</h3>
          <h2 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white transition-colors">
            Meet Our <span className="font-serif italic font-light text-zinc-500">Masters</span>
          </h2>
          <p className="mt-6 text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
            The skilled professionals behind the chair. Each of our barbers is dedicated to perfecting their craft and delivering an exceptional grooming experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12">
          {barbers.length === 0 ? (
            <div className="col-span-full text-center text-zinc-500 py-12">
              No barbers found at the moment.
            </div>
          ) : (
            barbers.map((barber, index) => (
              <ScrollReveal key={barber.id} direction="up" delay={index * 0.1}>
                <div className="group flex flex-col items-center cursor-pointer">
                  <div className="w-full aspect-[4/5] overflow-hidden mb-6 border border-zinc-200 dark:border-zinc-800 group-hover:border-amber-500/50 transition-colors duration-500 shadow-sm dark:shadow-none bg-zinc-100 dark:bg-zinc-900 relative">
                    {barber.imageUrl ? (
                      <Image
                        src={barber.imageUrl}
                        alt={barber.name}
                        fill
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
                    {barber.phone && (
                      <p className="flex items-center gap-2 mt-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-amber-500">
                          <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
                        </svg>
                        {barber.phone}
                      </p>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
