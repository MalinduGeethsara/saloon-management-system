"use client";

import React from 'react';
import Link from 'next/link';
import { 
  CalendarOutlined, 
  ScissorOutlined, 
  FireOutlined, 
  SafetyCertificateOutlined,
  ArrowRightOutlined,
  StarFilled
} from '@ant-design/icons';

export default function WebsiteHomePage() {
  return (
    <div className="flex flex-col bg-slate-50 dark:bg-black text-slate-900 dark:text-white min-h-screen selection:bg-red-500 selection:text-white transition-colors duration-300">
      
      {/* =========================================
          1. HERO SECTION
      ========================================= */}
      <section className="relative flex flex-col items-center justify-center min-h-[85vh] px-6 text-center overflow-hidden">
        {/* Background Image with Adaptive Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop" 
            alt="Barber cutting hair" 
            className="w-full h-full object-cover opacity-30 dark:opacity-40 scale-105 animate-[pulse_20s_ease-in-out_infinite_alternate]"
          />
          {/* Light mode: milky white overlay / Dark mode: deep black overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-slate-50/95 to-slate-50 dark:from-black/60 dark:via-black/80 dark:to-black z-10 transition-colors duration-300"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-20 max-w-4xl mx-auto animate-[fadeIn_1s_ease-out]">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 backdrop-blur-md mb-8 text-xs font-bold tracking-[0.2em] uppercase text-slate-600 dark:text-gray-300">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            Now Accepting Walk-ins & Bookings
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white mb-6 leading-[1.1] tracking-tight">
            Premium Grooming <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-800">Experience</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            More than just a haircut. Step into Mr Polaa for precision styling, hot towel shaves, and an atmosphere built for the modern gentleman.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
            <Link 
              href="/book"
              className="group relative flex items-center justify-center gap-3 bg-blue-600 text-white font-bold py-4 px-10 rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]"
            >
              <div className="absolute inset-0 w-0 bg-white/20 transition-all duration-[250ms] ease-out group-hover:w-full"></div>
              <CalendarOutlined className="text-xl relative z-10" />
              <span className="relative z-10">Book Appointment</span>
            </Link>
            
            <Link 
              href="/services"
              className="flex items-center justify-center gap-2 bg-transparent border-2 border-slate-300 dark:border-zinc-800 hover:border-slate-900 dark:hover:border-white text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white font-bold py-4 px-10 rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-white/5"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================
          2. THE EXPERIENCE
      ========================================= */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="grid grid-cols-2 gap-4 relative">
            <img 
              src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop" 
              alt="Vintage Tools" 
              className="rounded-2xl w-full h-64 object-cover mt-12 hover:-translate-y-2 transition-transform duration-500 shadow-2xl"
            />
            <img 
              src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=2070&auto=format&fit=crop" 
              alt="Beard Trim" 
              className="rounded-2xl w-full h-80 object-cover hover:-translate-y-2 transition-transform duration-500 shadow-2xl"
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-red-500/20 blur-[50px] rounded-full z-[-1]"></div>
          </div>

          <div className="flex flex-col">
            <h3 className="text-red-500 font-bold tracking-[0.2em] uppercase text-sm mb-4 flex items-center gap-4">
              <span className="w-12 h-[1px] bg-red-500"></span> The Mr Polaa Standard
            </h3>
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight text-slate-900 dark:text-white">Elevating The Art <br/> Of Men's Grooming.</h2>
            <p className="text-slate-600 dark:text-gray-400 text-lg leading-relaxed mb-8">
              We blend classic barbering traditions with modern techniques. From the moment you walk through our doors, you are treated to a sanctuary of relaxation, sharp aesthetics, and unparalleled attention to detail.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center shrink-0 border border-slate-200 dark:border-zinc-800 text-red-500">
                  <ScissorOutlined className="text-xl" />
                </div>
                <div>
                  <h4 className="text-slate-900 dark:text-white font-bold mb-1">Master Tailoring</h4>
                  <p className="text-sm text-slate-500 dark:text-gray-500">Precision cuts tailored to your head shape and lifestyle.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center shrink-0 border border-slate-200 dark:border-zinc-800 text-blue-500">
                  <SafetyCertificateOutlined className="text-xl" />
                </div>
                <div>
                  <h4 className="text-slate-900 dark:text-white font-bold mb-1">Premium Products</h4>
                  <p className="text-sm text-slate-500 dark:text-gray-500">We exclusively use top-tier styling and beard care products.</p>
                </div>
              </div>
            </div>

            <Link href="/about" className="text-slate-900 dark:text-white font-bold hover:text-red-500 dark:hover:text-red-500 transition-colors flex items-center gap-2 w-fit group">
              Read Our Story 
              <ArrowRightOutlined className="transition-transform group-hover:translate-x-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================
          3. SIGNATURE SERVICES
      ========================================= */}
      <section className="py-24 bg-slate-100 dark:bg-zinc-950 border-y border-slate-200 dark:border-zinc-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h3 className="text-red-500 font-bold tracking-[0.2em] uppercase text-sm mb-4">Our Services</h3>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">Signature Treatments</h2>
            </div>
            <Link href="/services" className="border border-slate-300 dark:border-zinc-800 text-slate-700 dark:text-white hover:border-slate-900 dark:hover:border-white px-6 py-3 rounded-full text-sm font-bold transition-all hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black">
              View Full Menu
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Service Card 1 */}
            <div className="group bg-white dark:bg-black border border-slate-200 dark:border-zinc-900 rounded-3xl overflow-hidden hover:border-slate-300 dark:hover:border-zinc-700 transition-colors shadow-sm hover:shadow-md dark:shadow-none">
              <div className="h-64 overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1988&auto=format&fit=crop" alt="Haircut" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 dark:opacity-80 group-hover:opacity-100" />
                <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-black/80 text-slate-900 dark:text-white backdrop-blur px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 font-bold">LKR 2,500</div>
              </div>
              <div className="p-8">
                <h4 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">The Executive Cut</h4>
                <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed mb-6">A meticulous haircut tailored to your preferences, finished with a straight razor neck shave and styling.</p>
                <Link href="/book" className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 hover:text-red-500 dark:hover:text-red-500 transition-colors">Book This <ArrowRightOutlined/></Link>
              </div>
            </div>

            {/* Service Card 2 */}
            <div className="group bg-white dark:bg-black border border-slate-200 dark:border-zinc-900 rounded-3xl overflow-hidden hover:border-slate-300 dark:hover:border-zinc-700 transition-colors shadow-sm hover:shadow-md dark:shadow-none">
              <div className="h-64 overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1512864084360-7c0c4d0a0845?q=80&w=2070&auto=format&fit=crop" alt="Hot Towel Shave" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 dark:opacity-80 group-hover:opacity-100" />
                <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-black/80 text-slate-900 dark:text-white backdrop-blur px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 font-bold">LKR 1,800</div>
              </div>
              <div className="p-8">
                <h4 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Hot Towel Shave</h4>
                <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed mb-6">Experience the ultimate relaxation with our traditional hot towel wet shave, using premium soothing creams.</p>
                <Link href="/book" className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 hover:text-red-500 dark:hover:text-red-500 transition-colors">Book This <ArrowRightOutlined/></Link>
              </div>
            </div>

            {/* Service Card 3 */}
            <div className="group bg-white dark:bg-black border border-slate-200 dark:border-zinc-900 rounded-3xl overflow-hidden hover:border-slate-300 dark:hover:border-zinc-700 transition-colors shadow-sm hover:shadow-md dark:shadow-none">
              <div className="h-64 overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1582239459526-9d18e8d87556?q=80&w=2070&auto=format&fit=crop" alt="Beard Grooming" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 dark:opacity-80 group-hover:opacity-100" />
                <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-black/80 text-slate-900 dark:text-white backdrop-blur px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 font-bold">LKR 3,800</div>
              </div>
              <div className="p-8">
                <h4 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">The Full Package</h4>
                <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed mb-6">The ultimate grooming session. Includes The Executive Cut, a Hot Towel Shave, and a revitalizing facial.</p>
                <Link href="/book" className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 hover:text-red-500 dark:hover:text-red-500 transition-colors">Book This <ArrowRightOutlined/></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          4. TEAM / TESTIMONIALS
      ========================================= */}
      <section className="py-24 px-6 max-w-7xl mx-auto text-center">
        <h3 className="text-red-500 font-bold tracking-[0.2em] uppercase text-sm mb-4">Our Experts</h3>
        <h2 className="text-4xl md:text-5xl font-black mb-16 text-slate-900 dark:text-white">Meet The Masters</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
          <div className="flex flex-col items-center group">
            <div className="w-48 h-48 rounded-full overflow-hidden mb-6 border-4 border-slate-200 dark:border-zinc-900 group-hover:border-blue-500 dark:group-hover:border-blue-600 transition-colors duration-500 relative">
              <img src="https://images.unsplash.com/photo-1618077360395-f3068be8e001?q=80&w=1780&auto=format&fit=crop" alt="Barber" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
            </div>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white">Kasun Perera</h4>
            <p className="text-red-500 font-medium text-sm mb-3">Senior Barber</p>
            <div className="flex gap-1 text-yellow-500 text-xs"><StarFilled/><StarFilled/><StarFilled/><StarFilled/><StarFilled/></div>
          </div>

          <div className="flex flex-col items-center group">
            <div className="w-48 h-48 rounded-full overflow-hidden mb-6 border-4 border-slate-200 dark:border-zinc-900 group-hover:border-blue-500 dark:group-hover:border-blue-600 transition-colors duration-500 relative">
              <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1887&auto=format&fit=crop" alt="Barber" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
            </div>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white">Danushka</h4>
            <p className="text-red-500 font-medium text-sm mb-3">Master Stylist</p>
            <div className="flex gap-1 text-yellow-500 text-xs"><StarFilled/><StarFilled/><StarFilled/><StarFilled/><StarFilled/></div>
          </div>

          <div className="flex flex-col items-center group">
            <div className="w-48 h-48 rounded-full overflow-hidden mb-6 border-4 border-slate-200 dark:border-zinc-900 group-hover:border-blue-500 dark:group-hover:border-blue-600 transition-colors duration-500 relative">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop" alt="Barber" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
            </div>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white">Nimal</h4>
            <p className="text-red-500 font-medium text-sm mb-3">Color Specialist</p>
            <div className="flex gap-1 text-yellow-500 text-xs"><StarFilled/><StarFilled/><StarFilled/><StarFilled/><StarFilled/></div>
          </div>
        </div>
      </section>

      {/* =========================================
          5. FINAL CTA BANNER
      ========================================= */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900 transition-colors duration-300">
          <img src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=2070&auto=format&fit=crop" alt="Shop Interior" className="w-full h-full object-cover opacity-10 dark:opacity-20 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/80 dark:from-black dark:via-black/80 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <FireOutlined className="text-5xl text-red-500 mb-6" />
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6">Ready to upgrade your look?</h2>
          <p className="text-xl text-slate-600 dark:text-gray-300 mb-10 font-light">Skip the waiting line. Secure your slot with your preferred barber today.</p>
          <Link 
            href="/book"
            className="inline-flex items-center justify-center gap-3 bg-slate-900 text-white dark:bg-white dark:text-black hover:bg-slate-800 dark:hover:bg-gray-200 font-bold text-lg py-5 px-12 rounded-xl transition-all hover:scale-105 shadow-xl"
          >
            Book Your Seat Now
          </Link>
        </div>
      </section>

      {/* ✅ CORRECTED STYLE TAG */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />

    </div>
  );
}