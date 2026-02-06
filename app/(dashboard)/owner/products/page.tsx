"use client";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Plus, Package } from "lucide-react";

export default function ProductSales() {
  const products = [
    { id: 1, name: "Matte Clay", stock: 15, price: "$25.00", sales: 42 },
    { id: 2, name: "Beard Oil (Gold Edition)", stock: 8, price: "$32.00", sales: 12 },
    { id: 3, name: "Classic Pomade", stock: 24, price: "$20.00", sales: 88 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#1A1A1B]">Inventory & Sales</h1>
        <button className="bg-[#1A1A1B] text-[#C5A059] px-4 py-2 rounded-lg flex items-center gap-2 font-bold">
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((p) => (
          <Card key={p.id} className="border-none shadow-md overflow-hidden hover:scale-105 transition-transform">
            <div className="h-3 bg-[#C5A059]" />
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-gray-50 rounded-lg"><Package className="text-gray-400" /></div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400">PRICE</p>
                  <p className="text-xl font-black text-[#1A1A1B]">{p.price}</p>
                </div>
              </div>
              <h3 className="text-lg font-bold mb-1">{p.name}</h3>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Stock: {p.stock} units</span>
                <span className="text-emerald-600 font-bold">{p.sales} Sold</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}