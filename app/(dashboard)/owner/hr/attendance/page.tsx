"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, MapPin } from "lucide-react";

export default function AttendanceTracking() {
  const attendanceData = [
    { name: "Alex Rivers", shop: "Downtown", status: "Present", clockIn: "08:50 AM", clockOut: "05:30 PM" },
    { name: "Sam Wilson", shop: "Downtown", status: "On Leave", clockIn: "-", clockOut: "-" },
    { name: "Jordan Smith", shop: "Westside", status: "Present", clockIn: "09:05 AM", clockOut: "06:15 PM" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">HR: Attendance Tracking</h1>
      
      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Clock In</TableHead>
              <TableHead>Clock Out</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendanceData.map((staff, i) => (
              <TableRow key={i}>
                <TableCell className="font-bold">{staff.name}</TableCell>
                <TableCell className="flex items-center gap-1 text-gray-500">
                  <MapPin size={14} /> {staff.shop}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {staff.status === "Present" ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <XCircle size={16} className="text-red-400" />
                    )}
                    <span className="text-sm">{staff.status}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{staff.clockIn}</TableCell>
                <TableCell className="font-mono text-sm">{staff.clockOut}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}