"use client";

import React from 'react';
import { FacebookFilled, PhoneFilled, HomeOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';

export default function ContactPage() {
  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-amber-600 selection:text-white font-sans transition-colors duration-500 pt-24 pb-32 overflow-hidden relative">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[10%] left-[10%] w-[300px] h-[300px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-6 w-full relative z-10 flex flex-col items-center">
        <div className="text-center mb-16">
          <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 transition-colors">Get in Touch</h3>
          <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white transition-colors">Contact <span className="font-serif italic font-light text-zinc-500">Us</span></h1>
        </div>

        {/* Glassmorphic Container for Alignment and Blur */}
        <div className="w-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/60 p-8 md:p-12 shadow-2xl dark:shadow-none flex flex-col lg:flex-row gap-12 lg:gap-16 items-stretch">
          
          {/* Left Column: Contact Info & Socials */}
          <div className="flex-1 flex flex-col justify-center gap-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-black mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4">Visit The Shop</h2>
              
              <div className="flex flex-col gap-6">
                <div className="flex gap-5 items-start group">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-500 text-xl group-hover:scale-110 transition-transform">
                    <HomeOutlined />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-lg text-zinc-900 dark:text-white">Address</h4>
                    <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-light">Mr Polaa Barber Shop,<br/>New Road, Walasmulla,<br/>Sri Lanka.</p>
                  </div>
                </div>

                <div className="flex gap-5 items-start group">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-500 text-xl group-hover:scale-110 transition-transform">
                    <PhoneFilled className="rotate-90" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-lg text-zinc-900 dark:text-white">Phone</h4>
                    <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-light">+94 71 256 8071</p>
                  </div>
                </div>

                <div className="flex gap-5 items-start group">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-500 text-xl group-hover:scale-110 transition-transform">
                    <ClockCircleOutlined />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-lg text-zinc-900 dark:text-white">Opening Hours</h4>
                    <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-light">Mon - Sun: 8:00am - 7:00pm</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-black mb-6">Connect With Us</h2>
              <a 
                href="https://web.facebook.com/profile.php?id=100070140811780" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-4 px-6 py-4 bg-[#1877F2] text-white hover:bg-[#145CB5] transition-colors w-fit font-bold shadow-lg hover:shadow-xl hover:scale-105 duration-300"
              >
                <FacebookFilled className="text-2xl" />
                Follow Mr Polaa
              </a>
            </div>
          </div>

          {/* Right Column: Map & Direction */}
          <div className="flex-1 flex flex-col relative min-h-[400px] lg:min-h-full">
            <div className="w-full h-full flex-grow bg-zinc-200 dark:bg-zinc-800 relative border border-zinc-200 dark:border-zinc-800 shadow-inner group overflow-hidden">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15871.979146030768!2d80.64332924614264!3d6.136934351334645!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae1430064a3e795%3A0x6b1ecbf50a41f6f1!2sWalasmulla!5e0!3m2!1sen!2slk!4v1700000000000!5m2!1sen!2slk" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={false} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 w-full h-full object-cover transition-all duration-700 grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100"
              ></iframe>
              
              {/* Floating Button overlaying the map slightly */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20 px-6">
                <a 
                  href="https://maps.app.goo.gl/AH8aASqV71PkZk8R6" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 bg-zinc-900/90 backdrop-blur-md text-white dark:bg-white/90 dark:text-zinc-900 py-4 px-8 font-bold uppercase tracking-widest text-xs hover:bg-amber-600 dark:hover:bg-amber-500 hover:text-white transition-all shadow-xl hover:scale-105 border border-zinc-700 dark:border-zinc-200 hover:border-transparent w-full max-w-sm whitespace-nowrap"
                >
                  <EnvironmentOutlined className="text-lg" /> Get Directions
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
