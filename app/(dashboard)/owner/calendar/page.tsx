"use client";

import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, User, ChevronRight } from "lucide-react";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"];

export default function BookingCalendar() {
  const [date, setDate] = useState<Value>(new Date());

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-[#1A1A1B]">Master Schedule</h1>
        <p className="text-gray-500">Manage shop availability and barber slots.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Interactive Calendar */}
        <Card className="lg:col-span-5 border-none shadow-sm p-4">
          <Calendar 
            onChange={setDate} 
            value={date} 
            className="w-full border-none font-sans"
          />
        </Card>

        {/* Slot Management */}
        <Card className="lg:col-span-7 border-none shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-lg flex justify-between">
              <span>Availability for {format(date as Date, "PPP")}</span>
              <span className="text-[#C5A059] text-sm">4 Barbers Active</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-bold flex items-center gap-2"><User size={18}/> Alex Rivers</h3>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot) => (
                  <button key={slot} className="py-2 border rounded-lg text-xs font-medium hover:bg-[#1A1A1B] hover:text-white transition">
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}