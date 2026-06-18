"use client";

import React from 'react';
import { FacebookFilled, PhoneFilled, HomeOutlined, ClockCircleOutlined, MailOutlined, WhatsAppOutlined, InstagramOutlined, TikTokOutlined } from '@ant-design/icons';

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
                    <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-light">Mr Polaa Barber Shop,<br />New Road, Walasmulla,<br />Sri Lanka.</p>
                  </div>
                </div>

                <div className="flex gap-5 items-start group">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-500 text-xl group-hover:scale-110 transition-transform">
                    <PhoneFilled className="rotate-90" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-lg text-zinc-900 dark:text-white">Phone</h4>
                    <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-light">
                      <a href="tel:+94712568071" className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors duration-300">+94 71 256 8071</a>
                    </p>
                  </div>
                </div>

                <div className="flex gap-5 items-start group">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-500 text-xl group-hover:scale-110 transition-transform">
                    <MailOutlined />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-lg text-zinc-900 dark:text-white">Email</h4>
                    <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-light">
                      <a href="mailto:mrpolaa.biz@gmail.com" className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors duration-300">mrpolaa.biz@gmail.com</a>
                    </p>
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
              <div className="grid grid-cols-2 gap-4">
                <a
                  href="https://web.facebook.com/profile.php?id=100070140811780"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 py-4 bg-white/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 dark:hover:border-amber-500 text-zinc-900 dark:text-zinc-100 hover:text-amber-600 dark:hover:text-amber-500 transition-all font-bold duration-300"
                >
                  <FacebookFilled className="text-xl" />
                  <span className="text-xs uppercase tracking-wider font-bold">Facebook</span>
                </a>

                <a
                  href="https://wa.me/94712568071"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 py-4 bg-white/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 dark:hover:border-amber-500 text-zinc-900 dark:text-zinc-100 hover:text-amber-600 dark:hover:text-amber-500 transition-all font-bold duration-300"
                >
                  <WhatsAppOutlined className="text-xl" />
                  <span className="text-xs uppercase tracking-wider font-bold">WhatsApp</span>
                </a>

                <a
                  href="https://www.instagram.com/mr.polaa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 py-4 bg-white/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 dark:hover:border-amber-500 text-zinc-900 dark:text-zinc-100 hover:text-amber-600 dark:hover:text-amber-500 transition-all font-bold duration-300"
                >
                  <InstagramOutlined className="text-xl" />
                  <span className="text-xs uppercase tracking-wider font-bold">Instagram</span>
                </a>

                <a
                  href="https://www.tiktok.com/@mr.polaa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 py-4 bg-white/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 dark:hover:border-amber-500 text-zinc-900 dark:text-zinc-100 hover:text-amber-600 dark:hover:text-amber-500 transition-all font-bold duration-300"
                >
                  <TikTokOutlined className="text-xl" />
                  <span className="text-xs uppercase tracking-wider font-bold">TikTok</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Map & Direction */}
          <div className="flex-1 flex flex-col relative min-h-[400px] lg:min-h-full">
            <div className="w-full h-full flex-grow bg-zinc-200 dark:bg-zinc-800 relative border border-zinc-200 dark:border-zinc-800 shadow-inner group overflow-hidden">

              {/* Location Name & Town Header Overlay Card */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-100 dark:border-zinc-800/80 p-3 flex items-center justify-between gap-6 w-full max-w-[290px] rounded-sm transition-all duration-300 group-hover:border-amber-500/50">
                <div className="flex flex-col">
                  <a
                    href="https://maps.app.goo.gl/AH8aASqV71PkZk8R6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-xs text-[#1a73e8] dark:text-amber-500 hover:underline leading-tight"
                  >
                    Mr Polaa Barber Shop
                  </a>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-tight font-light">
                    New Road, Walasmulla
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href="https://maps.app.goo.gl/AH8aASqV71PkZk8R6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
                    title="View larger map"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-amber-500">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </a>

                  <a
                    href="https://maps.app.goo.gl/AH8aASqV71PkZk8R6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
                    title="Get Directions"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="#1a73e8" className="dark:fill-amber-500">
                      <path d="M22.43 11.43L12.57 1.57a1.5 1.5 0 0 0-2.14 0L.57 10.57a1.5 1.5 0 0 0 0 2.14l9.86 9.86a1.5 1.5 0 0 0 2.14 0l9.86-9.86a1.5 1.5 0 0 0 0-2.28zM15 13h-4v3H9v-4a1 1 0 0 1 1-1h5V8.5l4.5 4.5-4.5 4.5V13z" />
                    </svg>
                  </a>
                </div>
              </div>

              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.806906292453!2d80.6967546!3d6.1566105!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae151ca0d16a815%3A0x7c89792748b18b25!2sMr+Polaa!5e1!3m2!1sen!2slk!4v1700000000000!5m2!1sen!2slk"
                style={{ border: 0, top: '-110px', left: '0px', width: '100%', height: 'calc(100% + 110px)' }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute object-cover transition-all duration-700 grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100"
              ></iframe>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
