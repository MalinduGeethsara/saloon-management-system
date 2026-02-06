import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Download, FileText } from "lucide-react";

export default function PayrollSystem() {
  const payroll = [
    { name: "Alex Rivers", base: 1200, commission: 850, deductions: 50, total: 2000 },
    { name: "Jordan Smith", base: 2500, commission: 0, deductions: 100, total: 2400 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">HR: Payroll Management</h1>
        <button className="bg-[#1A1A1B] text-[#C5A059] px-4 py-2 rounded-lg font-bold flex items-center gap-2">
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="space-y-4">
        {payroll.map((pay, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition">
            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 rounded-full text-[#C5A059]"><DollarSign /></div>
                <div>
                  <h3 className="font-bold text-lg">{pay.name}</h3>
                  <p className="text-sm text-gray-400">Monthly Payout Statement</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8 mt-4 md:mt-0 text-center">
                <div><p className="text-xs text-gray-400 uppercase">Base</p><p className="font-bold">${pay.base}</p></div>
                <div><p className="text-xs text-gray-400 uppercase">Comm.</p><p className="font-bold">${pay.commission}</p></div>
                <div><p className="text-xs text-gray-400 uppercase">Total</p><p className="font-bold text-[#C5A059]">${pay.total}</p></div>
              </div>

              <button className="mt-4 md:mt-0 p-2 text-gray-400 hover:text-[#1A1A1B]"><FileText /></button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}