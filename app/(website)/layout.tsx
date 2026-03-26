import React from "react";
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-sans">
      
      <PublicNavbar />
      
      <main className="flex-grow">
        {children}
      </main>

      <PublicFooter />
      
    </div>
  );
}