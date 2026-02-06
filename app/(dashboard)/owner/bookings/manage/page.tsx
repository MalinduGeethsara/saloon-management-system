"use client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Printer, Edit } from "lucide-react";

export default function ManageBookings() {
  const bookings = [
    { id: "B-101", client: "John Doe", barber: "Alex Rivers", status: "Pending", total: "$45.00" },
    { id: "B-102", client: "Mike Ross", barber: "Sam Wilson", status: "Confirmed", total: "$35.00" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Booking Requests</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Booking ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Barber</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-mono text-xs">{b.id}</TableCell>
                <TableCell className="font-bold">{b.client}</TableCell>
                <TableCell>{b.barber}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    b.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>{b.status}</span>
                </TableCell>
                <TableCell className="flex justify-end gap-2 p-4">
                  <button className="p-2 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100" title="Accept"><Check size={16}/></button>
                  <button className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100" title="Decline"><X size={16}/></button>
                  <button className="p-2 bg-zinc-50 text-zinc-600 rounded hover:bg-zinc-100" title="Print Bill"><Printer size={16}/></button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}