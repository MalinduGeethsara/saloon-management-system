import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import ScrollReveal from "@/components/ui/ScrollReveal";

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy | Mr Polaa Barber Shop',
  description: 'How cancellations, refunds and product returns work at Mr Polaa Barber Shop.',
};

const sectionTitle = "text-xl md:text-2xl font-black mb-4 text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800/80 pb-2 group-hover:border-amber-500/50 transition-colors";
const bodyText = "text-zinc-600 dark:text-zinc-400 leading-relaxed font-light text-sm md:text-base";
const listText = `${bodyText} list-disc pl-5 flex flex-col gap-3`;

export default function RefundPolicyPage() {
  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-amber-600 selection:text-white font-sans transition-colors duration-500 pt-10 pb-16 md:pt-24 md:pb-32 overflow-hidden relative">

      <div className="absolute top-[15%] left-[5%] w-[400px] h-[400px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[5%] w-[350px] h-[350px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-6 w-full relative z-10 flex flex-col items-center">

        <ScrollReveal direction="down">
          <div className="text-center mb-10 md:mb-16">
            <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 transition-colors">Bookings &amp; Payments</h3>
            <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white transition-colors">
              Refund <span className="font-serif italic font-light text-zinc-500">Policy</span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-4 font-light">Last updated: September 19, 2026</p>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="down" delay={0.2} className="w-full">
          <div className="w-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/60 p-5 sm:p-8 md:p-12 shadow-2xl dark:shadow-none rounded-lg flex flex-col gap-10">

            <section className="group">
              <h2 className={sectionTitle}>1. Overview</h2>
              <p className={bodyText}>
                This policy explains how cancellations, refunds and product returns work for bookings and purchases made through <strong>mr-polaa.com</strong> or at
                <strong> Mr Polaa Barber Shop</strong> (operated by <strong>Mr Polaa (PVT) LTD</strong>). All prices are in Sri Lankan Rupees (LKR). It should be read together with our{' '}
                <Link href="/terms-conditions" className="text-amber-600 dark:text-amber-500 hover:underline">Terms &amp; Conditions</Link>.
              </p>
            </section>

            <section className="group">
              <h2 className={sectionTitle}>2. Cancelling an appointment</h2>
              <ul className={listText}>
                <li><strong>12 hours or more before your appointment:</strong> you can cancel and you will receive a full refund of any amount you paid online.</li>
                <li><strong>Less than 12 hours before, or a no-show:</strong> the deposit/payment may be kept in full or in part as a cancellation fee. Repeated no-shows may lead to online booking being suspended.</li>
                <li><strong>Late arrival:</strong> if you arrive more than 15 minutes late your appointment may be shortened, rescheduled or cancelled, and the cancellation rule above may apply.</li>
                <li><strong>If we cancel or need to reschedule:</strong> for example because a stylist is unavailable, you can choose a new time or receive a full refund.</li>
              </ul>
              <p className={`${bodyText} mt-3`}>You can cancel from your profile page on the website, or by calling or emailing us (details below).</p>
            </section>

            <section className="group">
              <h2 className={sectionTitle}>3. Services</h2>
              <p className={bodyText}>
                Because a haircut, treatment or other salon service cannot be returned once it has been carried out, completed services are not refundable.
                If you are unhappy with the result, please tell us before you leave or within 48 hours and we will do our best to put it right at no extra charge.
              </p>
            </section>

            <section className="group">
              <h2 className={sectionTitle}>4. Products</h2>
              <ul className={listText}>
                <li>Unopened and unused products in their original packaging can be returned within <strong>7 days</strong> of purchase with your receipt, for a refund or exchange.</li>
                <li>For hygiene reasons, opened or used products cannot be returned unless they are faulty or damaged.</li>
                <li>If a product is out of stock after you have paid, we will refund it in full or offer a replacement.</li>
              </ul>
            </section>

            <section className="group">
              <h2 className={sectionTitle}>5. How refunds are paid</h2>
              <p className={bodyText}>
                Approved refunds for online payments are returned to the original card or payment method through our payment provider, PayHere. Refunds are usually
                processed within 7&ndash;14 business days, depending on your bank. Payments made in cash at the salon are refunded in cash.
              </p>
            </section>

            <section className="group">
              <h2 className={sectionTitle}>6. How to request a refund</h2>
              <p className={bodyText}>
                Contact us with your booking reference (shown in your confirmation email and on your profile page) and we will confirm the outcome and the timing:
              </p>
              <div className="mt-4 p-4 rounded bg-zinc-100/50 dark:bg-zinc-950/50 border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col gap-2 text-xs md:text-sm font-light">
                <p><strong>Address:</strong> Mr Polaa Barber Shop, New Road, Walasmulla, Sri Lanka</p>
                <p><strong>Email:</strong> <a href="mailto:mrpolaa.biz@gmail.com" className="text-amber-600 dark:text-amber-500 hover:underline">mrpolaa.biz@gmail.com</a></p>
                <p><strong>Phone:</strong> <a href="tel:+94712568071" className="text-amber-600 dark:text-amber-500 hover:underline">+94 71 256 8071</a></p>
              </div>
            </section>

            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-amber-600 text-white dark:text-zinc-950 hover:bg-amber-700 dark:hover:bg-amber-500 font-bold uppercase tracking-widest text-xs py-4 px-10 transition-all hover:scale-[1.03] shadow-lg hover:shadow-xl dark:shadow-none"
              >
                Back To Home
              </Link>
              <Link href="/privacy-policy" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-amber-600 dark:hover:text-amber-500 transition-colors">
                Privacy Policy
              </Link>
            </div>

          </div>
        </ScrollReveal>

      </div>
    </div>
  );
}
