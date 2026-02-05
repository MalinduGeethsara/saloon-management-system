import { AdminSidebar } from "@/components/navigation/AdminSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#F9F9F9]">
      <AdminSidebar /> 
      <main className="flex-1 overflow-y-auto p-10">
        {children}
      </main>
    </div>
  );
}