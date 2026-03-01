import Link from "next/link";
import Image from "next/image";

export default function SaloonHome() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center bg-[#1A1A1B] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-40">
           {/* Placeholder for high-quality saloon interior image */}
           <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80')] bg-cover bg-center" />
        </div>
        
        <div className="relative z-10 text-center space-y-6 px-4">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter">
            LUXE<span className="text-[#C5A059]">BARBER</span>
          </h1>
          <p className="text-xl md:text-2xl font-light tracking-wide max-w-2xl mx-auto">
            Experience the art of grooming in the heart of the city. Precision, Style, and Luxury.
          </p>
          <div className="pt-4">
            <Link href="/booking" className="bg-[#C5A059] text-[#1A1A1B] px-10 py-4 rounded-full font-bold text-lg hover:bg-white transition-all transform hover:scale-105">
              Book Your Session
            </Link>
          </div>
        </div>
      </section>

      {/* Portfolio Gallery Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Signature Styles</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-500">
                <div className="w-full h-full bg-zinc-200" /> {/* Replace with actual style images */}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}