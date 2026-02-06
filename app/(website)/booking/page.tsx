"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, User, CheckCircle } from "lucide-react";

const barbers = [
  { id: 1, name: "Alex Rivers", role: "Master Barber", img: "/barber1.jpg" },
  { id: 2, name: "Sam Wilson", role: "Style Expert", img: "/barber2.jpg" },
];

const timeSlots = ["09:00 AM", "10:30 AM", "01:00 PM", "02:30 PM", "04:00 PM", "05:30 PM"];

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  return (
    <div className="max-w-4xl mx-auto py-20 px-6 min-h-screen">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold text-[#1A1A1B]">Book Appointment</h1>
        <div className="text-sm font-medium text-gray-400">Step {step} of 3</div>
      </div>

      {/* Step 1: Barber Selection */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <User className="text-[#C5A059]" size={20} /> Choose Your Barber
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {barbers.map((b) => (
              <div 
                key={b.id}
                onClick={() => { setSelectedBarber(b); setStep(2); }}
                className={`p-6 border-2 rounded-2xl cursor-pointer transition-all ${
                  selectedBarber?.id === b.id ? 'border-[#C5A059] bg-[#C5A059]/5' : 'border-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="font-bold text-lg">{b.name}</div>
                <div className="text-sm text-gray-500">{b.role}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Slot Selection */}
      {step === 2 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <button onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-black">← Back to Barbers</button>
          
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="text-[#C5A059]" size={20} /> Select Available Time
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => { setSelectedSlot(slot); setStep(3); }}
                  className="py-4 border rounded-xl hover:bg-[#1A1A1B] hover:text-white transition-all font-medium"
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <Card className="border-none shadow-2xl p-8 text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle size={64} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold">Appointment Confirmed!</h2>
          <div className="bg-gray-50 p-6 rounded-xl space-y-2 text-left max-w-sm mx-auto">
            <div className="flex justify-between text-sm"><span className="text-gray-400">Barber:</span> <strong>{selectedBarber?.name}</strong></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Time:</span> <strong>{selectedSlot}</strong></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Date:</span> <strong>Feb 6, 2026</strong></div>
          </div>
          <button className="w-full bg-[#1A1A1B] text-white py-4 rounded-xl font-bold hover:shadow-lg transition">
            Add to Google Calendar
          </button>
        </Card>
      )}
    </div>
  );
}