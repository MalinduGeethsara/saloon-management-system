"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle } from "lucide-react";

export default function AttendancePage() {
  const staff = [
    { id: 1, name: "Malith Sandaruwan", role: "Senior Barber", status: "Present", time: "08:45 AM" },
    { id: 2, name: "Mahesh Madushanka", role: "Senior Barber", status: "Present", time: "08:50 AM" },
    { id: 3, name: "Vindana Lakmal", role: "Senior Barber", status: "Absent", time: "-" },
    { id: 4, name: "Nimesh Haththasingha", role: "Master Stylist", status: "Present", time: "08:30 AM" },
  ];

  return ( 
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#1A1A1B]">Staff Attendance</h1>
        <div className="text-sm text-gray-500 font-mono">Date: Feb 6, 2026</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AttendanceStat label="Total Staff" value="12" icon={<Clock className="text-blue-500" />} />
        <AttendanceStat label="Present Now" value="9" icon={<CheckCircle className="text-emerald-500" />} />
        <AttendanceStat label="On Leave" value="3" icon={<XCircle className="text-red-500" />} />
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Clock-In Time</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-bold">{s.name}</TableCell>
                  <TableCell className="text-gray-500 text-sm">{s.role}</TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      s.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {s.status}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{s.time}</TableCell>
                  <TableCell className="text-right">
                    <button className="text-sm text-[#C5A059] hover:underline">Edit Entry</button>
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

function AttendanceStat({ label, value, icon }: any) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="p-3 bg-gray-50 rounded-xl">{icon}</div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-black text-[#1A1A1B]">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}