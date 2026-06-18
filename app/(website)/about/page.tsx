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

      {/* 1. Salon Journey Section (Past & Present) */}
      <section className="py-24 px-6 max-w-7xl mx-auto w-full border-t border-zinc-200 dark:border-zinc-900 transition-colors">
        <div className="text-center mb-16">
          <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4">The Evolution</h3>
          <h2 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white transition-colors">
            Our Salon Journey
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-3 uppercase tracking-widest font-light">Past & Present</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Past Card */}
          <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 p-8 md:p-12 rounded-3xl shadow-sm hover:shadow-lg dark:hover:shadow-none hover:border-zinc-300 dark:hover:border-zinc-800 transition-all duration-500 group flex flex-col justify-between">
            <div>
              <div className="w-full h-48 sm:h-56 overflow-hidden rounded-2xl mb-6 border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
                <img 
                  src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop" 
                  alt="Past Salon Setup" 
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" 
                />
              </div>
              <div className="text-zinc-400 dark:text-zinc-600 text-6xl font-serif italic mb-6">Past</div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 transition-colors">Humble Beginnings</h3>
              <p className="text-amber-600 dark:text-amber-500 font-bold text-xs uppercase tracking-widest mb-6">New Road, Walasmulla • Feb 21, 2021</p>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-light transition-colors">
                On February 21, 2021, Nimesh founded Mr Polaa in a cozy, single-chair corner spot at New Road, Walasmulla. Designed exclusively as a men's-only barber shop, he started with just a few basic styling shears, a traditional straight razor, and a commitment to meticulous craftsmanship. He worked long hours, focusing on detailed blends and classic cuts, which quickly earned him a reputation for excellence and a deeply loyal local following.
              </p>
            </div>
            <div className="mt-8 border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-6">
              <span className="text-xs text-amber-600 dark:text-amber-500 uppercase tracking-wider block font-bold">Initial Setup</span>
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-300 block mt-1">1 Chair • Men's Only Barbering • New Road Startup</span>
            </div>
          </div>

          {/* Present Card */}
          <div className="bg-gradient-to-br from-white to-amber-50/20 dark:from-zinc-900/40 dark:to-amber-950/5 border border-amber-500/20 dark:border-amber-500/10 p-8 md:p-12 rounded-3xl shadow-md hover:shadow-xl dark:hover:shadow-none hover:border-amber-500/40 dark:hover:border-amber-500/20 transition-all duration-500 group flex flex-col justify-between relative overflow-hidden">
            {/* Ambient gold glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/5 dark:bg-amber-500/2 blur-[80px] rounded-full pointer-events-none"></div>
            <div>
              <div className="w-full h-48 sm:h-56 overflow-hidden rounded-2xl mb-6 border border-amber-500/20 dark:border-amber-500/10 shadow-sm">
                <img 
                  src="https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2000&auto=format&fit=crop" 
                  alt="Present Salon Setup" 
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" 
                />
              </div>
              <div className="text-amber-500/30 dark:text-amber-500/20 text-6xl font-serif italic mb-6">Present</div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 transition-colors">Premium Unisex Sanctuary</h3>
              <p className="text-amber-600 dark:text-amber-500 font-bold text-xs uppercase tracking-widest mb-6">Today & Beyond</p>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-light transition-colors">
                Today, Nimesh Haththasingha along with three dedicated team members (Mahesh Madushanka, Malith Sandaruwan, and Vindana Lakmal) have expanded the space at New Road, Walasmulla into a high-end unisex salon. Serving both gents and ladies with premium haircuts, styling, and modern hair treatments, they added three more styling chairs—bringing the studio to a total of four fully equipped chairs—and upgraded the facilities with luxury wash stations, custom comfort lighting, and premium ventilation.
              </p>
            </div>
            <div className="mt-8 border-t border-dashed border-amber-500/20 dark:border-amber-500/10 pt-6">
              <span className="text-xs text-amber-600 dark:text-amber-500 uppercase tracking-wider block font-bold">Current Setup</span>
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-300 block mt-1">4 Chairs • Full Unisex Salon • Upgraded Premium Facilities</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Meet the Visionary Section (About Nimesh & Photo) */}
      <section className="py-24 px-6 bg-white dark:bg-zinc-900/20 border-t border-zinc-200 dark:border-zinc-900 transition-colors">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            {/* Profile Bio Column */}
            <div className="flex flex-col justify-center order-2 lg:order-1">
              <p className="text-zinc-600 dark:text-zinc-400 text-base md:text-lg leading-relaxed mb-8 font-light transition-colors text-justify">
                Welcome to Mr Polaa, your ultimate destination for grooming excellence and style. Since our inception on February 21, 2021, we have been dedicated to providing exceptional grooming services that enhance your natural character and boost your confidence. Our journey from a humble single-chair setup at New Road to our newly expanded premium unisex studio at the same location reflects our commitment to excellence and growth. At Mr Polaa, we believe in the transformative power of a tailored grooming experience. Our team of skilled artisans is passionate about delivering personalized care using advanced techniques and top-quality organic products. We strive to create a relaxing environment where you can rejuvenate and leave looking and feeling your absolute best. I am incredibly proud of what we have achieved and grateful for the trust and support of our clients. We look forward to welcoming you and making your style dreams a reality.
              </p>
              
              <h2 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight mb-2 transition-colors">
                Nimesh Haththasingha
              </h2>
              <span className="text-zinc-500 dark:text-zinc-400 text-sm font-semibold uppercase tracking-wider block">
                Founder, Mr Polaa
              </span>
            </div>

            {/* Photo Column */}
            <div className="flex justify-center order-1 lg:order-2 w-full">
              <div className="w-full h-[380px] sm:h-[500px] lg:h-[580px] relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 group cursor-pointer">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887&auto=format&fit=crop" 
                  alt="Nimesh Haththasingha - Founder of Mr Polaa" 
                  className="w-full h-full object-cover object-top transition-all duration-700 hover:scale-105" 
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Content Section / CTA */}
      <section className="py-24 bg-white dark:bg-zinc-900/50 border-y border-zinc-200 dark:border-zinc-800/50 transition-colors duration-500">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-8 text-zinc-900 dark:text-white transition-colors">More Than Just a Haircut</h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed mb-6 font-light transition-colors">
            At Mr Polaa, we believe that grooming is an essential ritual for the modern individual. Our artisans are meticulously trained in the structural science of hair and the traditional art of the straight razor.
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
