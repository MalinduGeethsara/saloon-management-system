import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import ScrollReveal from "@/components/ui/ScrollReveal";

export const metadata: Metadata = {
  title: 'Privacy Policy | Mr Polaa Barber Shop',
  description: 'How Mr Polaa Barber Shop collects, uses and protects your personal information, including when you sign in with Google.',
};

const sectionTitle = "text-xl md:text-2xl font-black mb-4 text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800/80 pb-2 group-hover:border-amber-500/50 transition-colors";
const bodyText = "text-zinc-600 dark:text-zinc-400 leading-relaxed font-light text-sm md:text-base";
const listText = `${bodyText} list-disc pl-5 flex flex-col gap-3`;

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-amber-600 selection:text-white font-sans transition-colors duration-500 pt-10 pb-16 md:pt-24 md:pb-32 overflow-hidden relative">

      {/* Decorative Background Glows */}
      <div className="absolute top-[15%] left-[5%] w-[400px] h-[400px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[5%] w-[350px] h-[350px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-6 w-full relative z-10 flex flex-col items-center">

        <ScrollReveal direction="down">
          <div className="text-center mb-10 md:mb-16">
            <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 transition-colors">Your Data</h3>
            <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white transition-colors">
              Privacy <span className="font-serif italic font-light text-zinc-500">Policy</span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-4 font-light">Last updated: September 19, 2026</p>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="down" delay={0.2} className="w-full">
          <div className="w-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/60 p-5 sm:p-8 md:p-12 shadow-2xl dark:shadow-none rounded-lg flex flex-col gap-10">

            <section className="group">
              <h2 className={sectionTitle}>1. Who we are</h2>
              <p className={bodyText}>
                This website (<strong>mr-polaa.com</strong>) is operated by <strong>Mr Polaa (PVT) LTD</strong>, trading as <strong>Mr Polaa Barber Shop</strong>, New Road, Walasmulla, Sri Lanka.
                It lets you browse our services, book appointments, buy grooming products and manage your bookings online.
                This policy explains what personal information we collect through the website, why, and the choices you have.
              </p>
            </section>

            <section className="group">
              <h2 className={sectionTitle}>2. Information we collect</h2>
              <ul className={listText}>
                <li><strong>Account details:</strong> your name, email address and phone number, and a password (stored only in scrambled/hashed form, never in plain text).</li>
                <li><strong>Sign in with Google:</strong> if you choose &ldquo;Continue with Google&rdquo; we receive your Google account&apos;s name, email address, profile picture and a Google account identifier. We do not receive your Google password and we do not access your contacts, Gmail, Drive, calendar or any other Google data.</li>
                <li><strong>Bookings and orders:</strong> the services and products you choose, your preferred barber and branch, appointment date and time, and the address and city you enter at checkout.</li>
                <li><strong>Payments:</strong> online card payments are handled by our payment provider, PayHere. Your card number is entered on PayHere&apos;s secure page and is never seen or stored by us. We keep only the amount, the payment status and PayHere&apos;s reference for the transaction.</li>
                <li><strong>Verification codes:</strong> when you register or reset a password we send a one-time code to your email address or phone number.</li>
                <li><strong>Technical data:</strong> cookies needed to keep you signed in (see section 6) and basic server logs used to keep the website secure.</li>
              </ul>
            </section>

            <section className="group">
              <h2 className={sectionTitle}>3. How we use your information</h2>
              <ul className={listText}>
                <li>To create and secure your account and sign you in.</li>
                <li>To schedule, confirm, change or cancel your appointments and orders, and to contact you about them by email or SMS.</li>
                <li>To take payment and issue receipts and refunds.</li>
                <li>To keep our records, prevent fraud and abuse, and meet legal obligations.</li>
              </ul>
              <p className={`${bodyText} mt-3`}>We do not sell your personal information and we do not use it for third-party advertising.</p>
            </section>

            <section className="group">
              <h2 className={sectionTitle}>4. Google user data</h2>
              <p className={bodyText}>
                Information we receive from Google (name, email address, profile picture) is used only to create your account, sign you in and
                show your name in the website. We do not share it with anyone else, do not use it for advertising, and do not transfer it except to the service
                providers listed below that are needed to run the website. Our use of information received from Google APIs adheres to the{' '}
                <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-500 hover:underline">
                  Google API Services User Data Policy
                </a>, including the Limited Use requirements. You can stop using Google sign-in at any time and you can remove this website&apos;s access from your Google Account settings.
              </p>
            </section>

            <section className="group">
              <h2 className={sectionTitle}>5. Who we share it with</h2>
              <p className={bodyText}>We share only what is needed with the companies that help us run the service:</p>
              <ul className={`${listText} mt-3`}>
                <li><strong>PayHere</strong> - online payment processing.</li>
                <li><strong>Resend</strong> and <strong>notify.lk</strong> - delivery of emails and SMS messages (verification codes and booking notices).</li>
                <li><strong>Cloudinary</strong> - hosting of images uploaded to the website.</li>
                <li><strong>Cloudflare</strong> and our hosting provider - delivering and protecting the website.</li>
              </ul>
              <p className={`${bodyText} mt-3`}>We may also disclose information where the law requires it. Our staff can only see the information their role needs (for example, a barber sees their own bookings).</p>
            </section>

            <section className="group">
              <h2 className={sectionTitle}>6. Cookies</h2>
              <p className={bodyText}>
                We use a small number of cookies: a secure sign-in cookie that keeps you logged in for about an hour, a few cookies that remember your display name and role
                so pages can show the right menu, and a short-lived cookie used to protect the Google sign-in flow. Your light/dark theme choice is saved in your browser.
                We do not use advertising or cross-site tracking cookies.
              </p>
            </section>

            <section className="group">
              <h2 className={sectionTitle}>7. Security and retention</h2>
              <p className={bodyText}>
                The website is served over HTTPS, passwords are hashed, and access to customer and business data is restricted by role. No system is perfectly secure,
                so please use a strong, unique password. We keep booking and payment records for as long as we need them for our business and legal obligations,
                and keep account details until you ask us to delete your account.
              </p>
            </section>

            <section className="group">
              <h2 className={sectionTitle}>8. Your choices and rights</h2>
              <p className={bodyText}>
                You can ask us to show you the personal information we hold about you, correct it, or delete your account and associated personal data
                (records we must keep by law, such as payment records, may be retained). To make a request, contact us using the details below and we will respond within a reasonable time.
              </p>
            </section>

            <section className="group">
              <h2 className={sectionTitle}>9. Changes to this policy</h2>
              <p className={bodyText}>
                We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the top shows when it last changed, and significant changes will be highlighted on the website.
              </p>
            </section>

            <section className="group">
              <h2 className={sectionTitle}>10. Contact us</h2>
              <p className={bodyText}>Questions about this policy or your data? Contact us at:</p>
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
              <Link href="/terms-conditions" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-amber-600 dark:hover:text-amber-500 transition-colors">
                Terms &amp; Conditions
              </Link>
            </div>

          </div>
        </ScrollReveal>

      </div>
    </div>
  );
}
