"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, Search, Filter, CreditCard, Banknote } from "lucide-react";

export default function PaymentHistory() {
  const transactions = [
    { id: "TX-9901", client: "John Doe", service: "Haircut & Beard", amount: "$45.00", method: "Card", date: "Feb 6, 2026" },
    { id: "TX-9902", client: "Sarah J.", service: "Hair Coloring", amount: "$120.00", method: "Cash", date: "Feb 6, 2026" },
    { id: "TX-9903", client: "Mike Ross", service: "Classic Shave", amount: "$30.00", method: "Card", date: "Feb 5, 2026" },
  ];

  const handlePrint = () => {
    window.print(); // Triggers the browser print dialog
  };

  return (
    <div className="space-y-6 print:p-0">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-3xl font-bold">Payment Transactions</h1>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 border px-4 py-2 rounded-lg hover:bg-gray-50">
            <Filter size={18} /> Filter
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-[#1A1A1B] text-[#C5A059] px-4 py-2 rounded-lg font-bold">
            <Printer size={18} /> Print Daily Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
        <Card className="border-none shadow-sm bg-emerald-50">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-emerald-600 uppercase">Daily Cash</p>
              <p className="text-3xl font-black text-emerald-900">$420.00</p>
            </div>
            <Banknote size={40} className="text-emerald-200" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-blue-50">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-blue-600 uppercase">Daily Card</p>
              <p className="text-3xl font-black text-blue-900">$1,250.00</p>
            </div>
            <CreditCard size={40} className="text-blue-200" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden print:shadow-none print:border-none">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right print:hidden">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                <TableCell className="font-bold">{tx.client}</TableCell>
                <TableCell>{tx.service}</TableCell>
                <TableCell>{tx.method}</TableCell>
                <TableCell className="font-bold text-[#1A1A1B]">{tx.amount}</TableCell>
                <TableCell className="text-right print:hidden">
                  <button className="p-2 hover:bg-zinc-100 rounded-full transition text-[#C5A059]">
                    <Printer size={16} />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}