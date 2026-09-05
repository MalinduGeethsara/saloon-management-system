"use client";

import React from 'react';
import Link from 'next/link';
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function TermsConditionsPage() {
  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-amber-600 selection:text-white font-sans transition-colors duration-500 pt-24 pb-32 overflow-hidden relative">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-[15%] left-[5%] w-[400px] h-[400px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[5%] w-[350px] h-[350px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-6 w-full relative z-10 flex flex-col items-center">
        
        {/* Header Section */}
        <ScrollReveal direction="down">
          <div className="text-center mb-16">
            <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 transition-colors">Legal Agreement</h3>
            <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white transition-colors">
              Terms & <span className="font-serif italic font-light text-zinc-500">Conditions</span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-4 font-light">Last updated: June 14, 2026</p>
          </div>
        </ScrollReveal>

        {/* Content Container with Glassmorphism */}
        <ScrollReveal direction="down" delay={0.2} className="w-full">
          <div className="w-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/60 p-8 md:p-12 shadow-2xl dark:shadow-none rounded-lg flex flex-col gap-12">
            
            {/* Refund Policy Section */}
            <div className="flex flex-col gap-6">
              <div className="text-center md:text-left mb-2 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
                <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-wider">Refund Policy</h2>
              </div>
              
              <div className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-light text-sm md:text-base space-y-6">
                <p>
                  Thank you for shopping and booking at <strong>Mr Polaa Barber Shop</strong>. We value your satisfaction and strive to provide you with the best experience possible. If, for any reason, you are not completely satisfied with your physical product purchase, we are here to help.
                </p>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Returns (Retail Products)</h3>
                  <p>We accept returns for physical products (e.g., skincare, haircare) within 7 days from the date of purchase. To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging. For hygiene reasons, piercing jewelry is non-returnable once the packaging is opened.</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Refunds</h3>
                  <p>Once we receive your returned product and inspect the item, we will notify you of the status of your refund. If your return is approved, we will initiate a refund to your original method of payment. <strong>Please note that completed salon services (e.g., haircuts, facial treatments, massages, piercings) are strictly non-refundable.</strong></p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Exchanges</h3>
                  <p>If you would like to exchange your retail product for a different size, color, or style, please contact our customer support team within 7 days of receiving your order. We will provide you with further instructions on how to proceed with the exchange.</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Non-Returnable Items</h3>
                  <p>Certain items and services are strictly non-returnable and non-refundable. These include:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Completed salon services (haircuts, facial treatments, oil treatments, etc.)</li>
                    <li>Piercing services and related body jewelry</li>
                    <li>Opened or used skincare, haircare, and personal grooming products</li>
                    <li>Gift cards and promotional vouchers</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Damaged or Defective Products</h3>
                  <p>In the unfortunate event that your retail product arrives damaged or defective, please contact us immediately. We will arrange for a replacement or issue a refund, depending on your preference and product availability.</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Processing Time</h3>
                  <p>Refunds and exchanges for products will be processed within 7 business days after we receive your returned item. Please note that it may take additional time for the refund to appear in your account, depending on your payment provider.</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Contact Us</h3>
                  <p>If you have any questions or concerns regarding our refund policy or a specific salon service, please contact our customer support team. We are here to assist you and ensure your experience with us is enjoyable and hassle-free.</p>
                </div>
              </div>
            </div>

            {/* Privacy Policy Section */}
            <div className="flex flex-col gap-6 mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800/80">
              <div className="text-center md:text-left mb-2 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
                <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-wider">Privacy Policy</h2>
              </div>
              
              <div className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-light text-sm md:text-base space-y-6">
                <p>
                  At <strong>Mr Polaa Barber Shop</strong>, we are committed to protecting the privacy and security of our customers&apos; personal information. This Privacy Policy outlines how we collect, use, and safeguard your information when you visit, make a purchase, or book a service on our website.
                </p>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Information We Collect</h3>
                  <p>When you visit our website or book an appointment, we may collect certain information about you, including:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Personal identification information (such as your name, email address, and phone number) provided voluntarily by you during the registration, booking, or checkout process.</li>
                    <li>Service history, appointment bookings, and personal grooming preferences (such as hair type, skin sensitivities, or allergies) provided to ensure safe and tailored treatments.</li>
                    <li>Payment and billing information necessary to process your orders, securely handled by trusted third-party payment processors.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Use of Information</h3>
                  <p>We may use the collected information for the following purposes:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>To manage your salon appointments and send booking reminders.</li>
                    <li>To ensure safety during specialized treatments like facials, hair coloring, and piercings.</li>
                    <li>To process and fulfill your retail orders, including shipping and delivery.</li>
                    <li>To personalize your shopping and salon experience, and present relevant product or service recommendations.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Information Sharing</h3>
                  <p>We respect your privacy and do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except to trusted service providers who assist us in operating our website, processing payments, or delivering products.</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Data Security</h3>
                  <p>We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Contact Us</h3>
                  <p>If you have any questions, concerns, or requests regarding our Privacy Policy or the handling of your personal information, please contact us using the information provided on our website.</p>
                </div>
              </div>
            </div>

            {/* Terms and Conditions Section */}
            <div className="flex flex-col gap-6 mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800/80">
              <div className="text-center md:text-left mb-2 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
                <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-wider">Terms and Conditions</h2>
              </div>
              
              <div className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-light text-sm md:text-base space-y-6">
                <p>
                  Welcome to <strong>Mr Polaa Barber Shop</strong>. These Terms and Conditions govern your use of our website, the purchase of retail products (e.g., skincare, haircare), and the booking of salon services (e.g., haircuts, facials, piercings) from our platform. By accessing and using our website, you agree to comply with these terms.
                </p>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Use of the Website</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>You must be at least 18 years old to use our website, book piercing services, or make purchases.</li>
                    <li>You are responsible for maintaining the confidentiality of your account information, including your username and password.</li>
                    <li>You agree to provide accurate and current information during the registration and checkout process.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Product and Service Information and Pricing</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>We strive to provide accurate descriptions, images, and pricing for our retail products (skincare, haircare) and salon services (haircuts, facials, piercings).</li>
                    <li>Prices are subject to change without notice. Any promotions or discounts are valid for a limited time and may be subject to additional terms and conditions.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Bookings, Orders and Payments</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>By booking a salon appointment, you agree to arrive on time. We provide a 15-minute grace period, after which your appointment may be canceled or rescheduled, and cancellation fees may apply.</li>
                    <li>Cancellations must be made at least 12 hours prior to the scheduled appointment. Repeated no-shows may lead to suspension of online booking privileges.</li>
                    <li>By placing an order for retail products, you are making an offer to purchase the selected items.</li>
                    <li>We use trusted third-party payment processors to handle your payment information securely. We do not store or have access to your full payment details.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Shipping, Delivery, and Services</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>We will make reasonable efforts to ensure timely shipping and delivery of your retail product orders.</li>
                    <li>For salon services, we guarantee the professional quality of our barbers and stylists. Please communicate any skin sensitivities or allergies before the start of your service (e.g., facial treatments, oil treatments). Mr Polaa Barber Shop is not liable for allergic reactions if sensitivities were not disclosed in advance.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Health, Safety, and Piercings</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Mr Polaa Barber Shop strictly follows hygiene protocols for all piercing services (ear, nose, tongue). Clients must be 18 years or older, or accompanied by a legal guardian, to receive piercing services.</li>
                    <li>We reserve the right to refuse services if a client exhibits signs of communicable skin conditions, to protect the health of our staff and other clients.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Returns and Refunds</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Our Returns and Refund Policy governs the process and conditions for returning physical products and seeking refunds. Please refer to the policy provided on our website for more information. Salon services are non-refundable.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Limitation of Liability</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>In no event shall Mr Polaa Barber Shop, its directors, employees, or affiliates be liable for any direct, indirect, incidental, special, or consequential damages arising out of or in connection with your use of our website, the purchase and use of our products, or the receipt of our salon services.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Amendments and Termination</h3>
                  <p>We reserve the right to modify, update, or terminate these Terms and Conditions at any time without prior notice. It is your responsibility to review these terms periodically for any changes.</p>
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="pt-10 border-t border-zinc-200 dark:border-zinc-800 flex justify-center">
              <Link 
                href="/"
                className="inline-flex items-center justify-center gap-3 bg-amber-600 text-white dark:text-zinc-950 hover:bg-amber-700 dark:hover:bg-amber-500 font-bold uppercase tracking-widest text-xs py-4 px-10 transition-all hover:scale-[1.03] shadow-lg hover:shadow-xl dark:shadow-none"
              >
                Back To Home
              </Link>
            </div>

          </div>
        </ScrollReveal>

      </div>
    </div>
  );
}
