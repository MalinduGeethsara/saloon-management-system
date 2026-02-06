import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, User, Settings2 } from "lucide-react";

export default function OwnerShops() {
  const shops = [
    { id: "S-01", name: "Downtown Studio", manager: "Alex Rivers", phone: "+1 234 567", status: "Open" },
    { id: "S-02", name: "Westside Barbering", manager: "Jordan Smith", phone: "+1 234 888", status: "Open" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Location Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shops.map((shop) => (
          <Card key={shop.id} className="border-none shadow-md hover:shadow-lg transition">
            <CardHeader className="bg-[#1A1A1B] text-white rounded-t-xl">
              <CardTitle className="flex justify-between items-center text-[#C5A059]">
                {shop.name} <span className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-full uppercase">{shop.status}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <User size={18} /> Manager: <strong>{shop.manager}</strong>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone size={18} /> Contact: <strong>{shop.phone}</strong>
              </div>
              <div className="pt-4 border-t flex gap-2">
                <button className="flex-1 bg-zinc-100 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                  <Settings2 size={16} /> Shop Data
                </button>
                <button className="flex-1 bg-zinc-100 py-2 rounded-lg text-sm font-bold">View Inventory</button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}