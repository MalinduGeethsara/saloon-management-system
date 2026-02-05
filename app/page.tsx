import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9F9F9]">
      <main className="w-full max-w-4xl p-8 bg-white shadow-xl rounded-2xl border border-gray-100">
        <div className="flex flex-col items-center gap-4 text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1A1A1B]">
            SALON<span className="text-[#C5A059]">PRO</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-md">
            Advanced management portal for bookings, staff attendance, and financial reporting.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <PortalCard 
            title="Administration" 
            desc="System health, backups, and root settings." 
            href="/admin" 
            primary 
          />
          <PortalCard 
            title="Owner Portal" 
            desc="View shop reports and staff performance." 
            href="/owner" 
          />
          <PortalCard 
            title="Public Site" 
            desc="Client-facing booking and portfolio." 
            href="/booking" 
          />
          <PortalCard 
            title="Staff Login" 
            desc="Manager and Barber access." 
            href="/login" 
          />
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-gray-400">
           System Status: <span className="text-emerald-500 font-semibold">● Operational</span>
        </div>
      </main>
    </div>
  );
}

function PortalCard({ title, desc, href, primary = false }: any) {
  return (
    <Link href={href} className={`p-6 rounded-xl border transition-all hover:shadow-md ${
      primary ? 'bg-[#1A1A1B] border-[#1A1A1B] text-white' : 'bg-white border-gray-200 text-[#1A1A1B]'
    }`}>
      <h3 className={`text-xl font-bold mb-2 ${primary ? 'text-[#C5A059]' : ''}`}>{title}</h3>
      <p className={`text-sm ${primary ? 'text-gray-400' : 'text-gray-500'}`}>{desc}</p>
    </Link>
  );
}