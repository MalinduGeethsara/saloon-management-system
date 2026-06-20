import React from "react";
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import SmoothScroll from "@/components/ui/SmoothScroll";
import CustomCursor from "@/components/ui/CustomCursor";
import ScrollProgress from "@/components/ui/ScrollProgress";

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScroll>
      <div className="min-h-screen flex flex-col bg-black text-white font-sans selection:bg-amber-600 selection:text-white">
        {/* Top scroll progress indicator bar */}
        <ScrollProgress />
        
        {/* Luxury trailing custom cursor */}
        <CustomCursor />
        
        <PublicNavbar />
        
        <main className="grow">
          {children}
        </main>

        <PublicFooter />
      </div>
    </SmoothScroll>
  );
}