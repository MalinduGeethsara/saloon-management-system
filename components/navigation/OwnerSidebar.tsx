"use client";
import { 
  LayoutDashboard, Calendar, Users, ShoppingBag, 
  Clock, CreditCard, Settings, LogOut, Scissors, TrendingUp 
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ownerNav = [
  { name: 'Analytics', href: '/owner', icon: LayoutDashboard },
  { name: 'Booking Calendar', href: '/owner/calendar', icon: Calendar },
  { name: 'Manage Bookings', href: '/owner/bookings/manage', icon: Scissors },
  { name: 'Inventory & Sales', href: '/owner/products', icon: ShoppingBag },
  { name: 'Attendance', href: '/owner/hr/attendance', icon: Clock },
  { name: 'Payroll', href: '/owner/hr/payroll', icon: CreditCard },
  { name: 'Staff Settings', href: '/owner/staff', icon: Users },
  { name: 'Reports', href: '/owner/reports', icon: TrendingUp },
  { name: 'Payments', href: '/owner/payments', icon: CreditCard },
];

export function OwnerSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-screen bg-[#1A1A1B] text-white flex flex-col p-4 border-r border-white/5">
      <div className="text-[#C5A059] font-bold text-2xl mb-10 px-2 tracking-tighter">
        OWNER<span className="text-white">PORTAL</span>
      </div>
      <nav className="flex-1 space-y-1">
        {ownerNav.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-[#C5A059] text-[#1A1A1B] font-bold shadow-lg' : 'text-gray-400 hover:bg-white/5'
              }`}
            >
              <link.icon size={20} />
              <span className="text-sm">{link.name}</span>
            </Link>
          );
        })}
      </nav>
      <Link href="/" className="flex items-center gap-3 px-4 py-4 text-red-400 border-t border-white/5">
        <LogOut size={20} /> <span className="text-sm">Exit to Website</span>
      </Link>
    </div>
  );
}