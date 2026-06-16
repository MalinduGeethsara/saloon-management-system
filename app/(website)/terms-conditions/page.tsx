"use client";

import React from 'react';
import Link from 'next/link';

export default function TermsConditionsPage() {
  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-amber-600 selection:text-white font-sans transition-colors duration-500 pt-24 pb-32 overflow-hidden relative">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-[15%] left-[5%] w-[400px] h-[400px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[5%] w-[350px] h-[350px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-6 w-full relative z-10 flex flex-col items-center">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 transition-colors">Legal Agreement</h3>
          <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white transition-colors">
            Terms & <span className="font-serif italic font-light text-zinc-500">Conditions</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-4 font-light">Last updated: June 14, 2026</p>
        </div>

        {/* Content Container with Glassmorphism */}
        <div className="w-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/60 p-8 md:p-12 shadow-2xl dark:shadow-none rounded-lg flex flex-col gap-10">
          
          {/* Section 1 */}
          <section className="group">
            <h2 className="text-xl md:text-2xl font-black mb-4 text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800/80 pb-2 group-hover:border-amber-500/50 transition-colors">
              1. Introduction & Agreement
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-light text-sm md:text-base">
              Welcome to <strong>Mr Polaa Barber Shop</strong>. By accessing our services, scheduling appointments online, or visiting our shop, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.
            </p>
          </section>

          {/* Section 2 */}
          <section className="group">
            <h2 className="text-xl md:text-2xl font-black mb-4 text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800/80 pb-2 group-hover:border-amber-500/50 transition-colors">
              2. Booking & Cancellation Policies
            </h2>
            <ul className="list-disc pl-5 text-zinc-600 dark:text-zinc-400 leading-relaxed font-light text-sm md:text-base flex flex-col gap-3">
              <li>
                <strong>Appointment Guarantee:</strong> To reserve a time slot, we require booking confirmation via our online system or phone.
              </li>
              <li>
                <strong>Late Arrivals:</strong> We value your time and our barbers' schedules. If you are more than 15 minutes late, your appointment may be canceled or rescheduled, and cancellation fees may apply.
              </li>
              <li>
                <strong>Cancellation & No-Show:</strong> Cancellations must be made at least 12 hours prior to the scheduled appointment. Repeated no-shows may lead to suspension of online booking privileges.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="group">
            <h2 className="text-xl md:text-2xl font-black mb-4 text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800/80 pb-2 group-hover:border-amber-500/50 transition-colors">
              3. Pricing & Payments
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-light text-sm md:text-base">
              All prices listed on our website or within our booking system are subject to change without prior notice. Payment is due at the time of service delivery. We accept cash, credit/debit cards, and approved mobile payment methods.
            </p>
          </section>

          {/* Section 4 */}
          <section className="group">
            <h2 className="text-xl md:text-2xl font-black mb-4 text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800/80 pb-2 group-hover:border-amber-500/50 transition-colors">
              4. Premium Grooming Services
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-light text-sm md:text-base">
              Our professional barbers strive to provide high-quality services. Please communicate any preferences, allergies, or skin sensitivities before the start of your service. Mr Polaa Barber Shop is not liable for allergic reactions to standard grooming products if sensitivities were not disclosed in advance.
            </p>
          </section>

          {/* Section 5 */}
          <section className="group">
            <h2 className="text-xl md:text-2xl font-black mb-4 text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800/80 pb-2 group-hover:border-amber-500/50 transition-colors">
              5. Governing Law
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-light text-sm md:text-base">
              These terms are governed by and construed in accordance with the laws of Sri Lanka. Any disputes relating to these terms shall be subject to the exclusive jurisdiction of the courts of Sri Lanka.
            </p>
          </section>

          {/* Section 6 */}
          <section className="group">
            <h2 className="text-xl md:text-2xl font-black mb-4 text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800/80 pb-2 group-hover:border-amber-500/50 transition-colors">
              6. Contact Information
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-light text-sm md:text-base">
              If you have any questions or feedback regarding these terms, please contact us at:
            </p>
            <div className="mt-4 p-4 rounded bg-zinc-100/50 dark:bg-zinc-950/50 border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col gap-2 text-xs md:text-sm font-light">
              <p><strong>Address:</strong> Mr Polaa Barber Shop, New Road, Walasmulla, Sri Lanka</p>
              <p><strong>Email:</strong> <a href="mailto:info@mrpolaa.com" className="text-amber-600 dark:text-amber-500 hover:underline">info@mrpolaa.com</a></p>
              <p><strong>Phone:</strong> <a href="tel:+94712568071" className="text-amber-600 dark:text-amber-500 hover:underline">+94 71 256 8071</a></p>
            </div>
          </section>

          {/* Action button */}
          <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-center">
            <Link 
              href="/"
              className="inline-flex items-center justify-center gap-3 bg-amber-600 text-white dark:text-zinc-950 hover:bg-amber-700 dark:hover:bg-amber-500 font-bold uppercase tracking-widest text-xs py-4 px-10 transition-all hover:scale-[1.03] shadow-lg hover:shadow-xl dark:shadow-none"
            >
              Back To Home
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
