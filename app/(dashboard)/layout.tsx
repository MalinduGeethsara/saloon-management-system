"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/navigation/AdminSidebar";
import { OwnerSidebar } from "@/components/navigation/OwnerSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Logic to determine which sidebar to show based on the URL path
  const isOwnerRoute = pathname.startsWith("/owner");
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <div className="flex h-screen bg-[#F9F9F9]">
      {/* Dynamic Sidebar Selection */}
      {isOwnerRoute ? (
        <OwnerSidebar />
      ) : isAdminRoute ? (
        <AdminSidebar />
      ) : (
        <div className="w-64 bg-[#1A1A1B] flex items-center justify-center text-gray-500">
           {/* Fallback for shared dashboard routes like /profile */}
           <p className="text-xs uppercase tracking-widest rotate-90">Saloon Pro</p>
        </div>
      )}

      {/* Main Content Scroll Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}