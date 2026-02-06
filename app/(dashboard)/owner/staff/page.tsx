"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Wallet, Scissors } from "lucide-react";

export default function OwnerStaff() {
  const staff = [
    { name: "Alex Rivers", role: "Senior Barber", branch: "Downtown", comm: "40%", earnings: "$1,840", status: "Active" },
    { name: "Sam Wilson", role: "Barber", branch: "Downtown", comm: "35%", earnings: "$1,200", status: "Active" },
    { name: "Jordan Smith", role: "Manager", branch: "Westside", comm: "N/A", earnings: "$2,500", status: "Active" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Staff Directory & Payroll</h1>
        <button className="bg-[#1A1A1B] text-white px-4 py-2 rounded-lg font-bold hover:bg-black transition">Add New Staff</button>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Member Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Commission Rate</TableHead>
                <TableHead>Net Earnings (MDT)</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((s) => (
                <TableRow key={s.name}>
                  <TableCell className="font-bold flex items-center gap-2">
                     <UserCheck size={16} className="text-[#C5A059]" /> {s.name}
                  </TableCell>
                  <TableCell>{s.role}</TableCell>
                  <TableCell>{s.branch}</TableCell>
                  <TableCell>{s.comm}</TableCell>
                  <TableCell className="font-mono text-emerald-600 font-bold">{s.earnings}</TableCell>
                  <TableCell className="text-right">
                    <button className="text-sm text-blue-600 hover:underline">Edit Details</button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}