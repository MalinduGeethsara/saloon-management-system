import React from 'react';
import { db } from '@/lib/db';
import BarbersGrid from "@/components/website/BarbersGrid";

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
    // Stable order so pagination never shuffles people between pages
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      role: true,
      imageUrl: true,
      shop: {
        select: {
          name: true
        }
      }
    }
  });

  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen pt-10 pb-16 md:pt-32 md:pb-24 px-6 transition-colors duration-500">
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-10 md:mb-24">
          <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 transition-colors">The Artisans</h3>
          <h2 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white transition-colors">
            Meet Our <span className="font-serif italic font-light text-zinc-500">Masters</span>
          </h2>
          <p className="mt-6 text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
            The skilled professionals behind the chair. Each of our barbers is dedicated to perfecting their craft and delivering an exceptional grooming experience.
          </p>
        </div>

        <BarbersGrid barbers={barbers} />
      </div>
    </div>
  );
}
