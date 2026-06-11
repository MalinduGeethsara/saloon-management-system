"use client";

import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-amber-600 selection:text-white font-sans transition-colors duration-500 pt-24">
      
      {/* Hero Section */}
      <section className="relative py-20 px-6 max-w-7xl mx-auto w-full text-center">
        <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-6 transition-colors">Our Heritage</h3>
        <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight text-zinc-900 dark:text-white transition-colors">
          The Story of <span className="font-serif italic font-light text-zinc-500">Mr Polaa.</span>
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-3xl mx-auto leading-relaxed font-light transition-colors">
          Born from a passion for the timeless art of barbering, Mr Polaa was established to bring back the premium grooming experience. We blend traditional techniques with modern style precision.
        </p>
      </section>

      {/* Image Grid */}
      <section className="px-6 pb-32 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <img src="https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?q=80&w=2000&auto=format&fit=crop" alt="Barber Tools" className="w-full h-96 object-cover xl:grayscale hover:grayscale-0 transition-all duration-700 shadow-xl dark:shadow-none" />
          <img src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop" alt="Vintage Chair" className="w-full h-96 object-cover xl:grayscale hover:grayscale-0 transition-all duration-700 shadow-xl dark:shadow-none" />
        </div>
      </section>

      {/* Content Section */}
      <section className="py-32 bg-white dark:bg-zinc-900/50 border-y border-zinc-200 dark:border-zinc-800/50 transition-colors duration-500">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-10 text-zinc-900 dark:text-white transition-colors">More Than Just a Haircut</h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed mb-8 font-light transition-colors">
            At Mr Polaa, we believe that grooming is an essential ritual for the modern gentleman. Our artisans are meticulously trained in the structural science of hair and the traditional art of the straight razor. 
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed mb-12 font-light transition-colors">
            From the moment you step through our doors, you are transported to an exclusive sanctuary. The ambient lighting, the rich scent of our premium products, and the tailored service are all designed to provide an unparalleled experience.
          </p>
          <Link href="/booking" className="inline-flex items-center justify-center gap-3 bg-amber-600 text-white dark:text-zinc-950 hover:bg-amber-700 dark:hover:bg-amber-500 font-bold uppercase tracking-widest text-sm py-5 px-12 transition-all hover:scale-105 shadow-xl dark:shadow-none">
            Experience the Standard
          </Link>
        </div>
      </section>

    </div>
  );
}
