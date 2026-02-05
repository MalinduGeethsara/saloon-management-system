"use client";

import { 
  LayoutDashboard, 
  Database, 
  ShieldAlert, 
  LogOut, 
  Settings 
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const adminLinks = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'System Backups', href: '/admin/backups', icon: Database },
  { name: 'Shop Data', href: '/admin/shops', icon: Settings },
  { name: 'Security Logs', href: '/admin/logs', icon: ShieldAlert },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-screen bg-[#1A1A1B] text-white flex flex-col p-4">
      <div className="text-[#C5A059] font-bold text-2xl mb-10 px-2 tracking-tight">
        SALON <span className="text-white">PRO</span>
      </div>
      
      <nav className="flex-1 space-y-2">
        {adminLinks.map((link) => {
          // Double check: If icon is undefined, don't render it to prevent crash
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group ${
                isActive ? 'bg-white/10 text-[#C5A059]' : 'hover:bg-white/5 text-gray-400'
              }`}
            >
              {Icon && <Icon size={20} className="group-hover:text-[#C5A059]" />}
              <span className="text-sm font-medium">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <button className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg mt-auto transition-colors">
        <LogOut size={20} />
        <span className="text-sm font-medium">Logout</span>
      </button>
    </div>
  );
}