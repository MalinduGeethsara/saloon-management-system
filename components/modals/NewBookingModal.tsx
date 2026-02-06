"use client";

import { useState, useEffect } from "react";
import { X, Save, User, Scissors, Clock, Calendar as CalIcon, CheckCircle2 } from "lucide-react";

interface Barber {
  id: number;
  name: string;
  color: string;
}

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: any) => void;
  barbers: Barber[];
  defaultDate?: Date;
  defaultBarberId?: number;
}

export function NewBookingModal({ isOpen, onClose, onSave, barbers, defaultDate, defaultBarberId }: NewBookingModalProps) {
  const [clientName, setClientName] = useState("");
  const [service, setService] = useState("Haircut");
  const [barberId, setBarberId] = useState(defaultBarberId || barbers[0]?.id);
  const [startTime, setStartTime] = useState("09:00");
  const [dateStr, setDateStr] = useState("");
  const [duration, setDuration] = useState(60);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && defaultDate) {
      const d = new Date(defaultDate);
      setDateStr(d.toISOString().split('T')[0]);
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      setStartTime(`${hours}:${mins}`);
      if (defaultBarberId) setBarberId(defaultBarberId);
    }
  }, [isOpen, defaultDate, defaultBarberId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const startDateTime = new Date(`${dateStr}T${startTime}`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
    const selectedBarber = barbers.find(b => b.id === Number(barberId));

    onSave({
      id: String(Date.now()),
      title: `${clientName}`, // Title is just client name, details in props
      start: startDateTime,
      end: endDateTime,
      backgroundColor: selectedBarber?.color || '#1A1A1B',
      borderColor: selectedBarber?.color || '#1A1A1B',
      // We store all details in extendedProps to access them in the render function
      extendedProps: {
        barberId: Number(barberId),
        barberName: selectedBarber?.name,
        service: service,
        status: "Confirmed"
      }
    });
    
    onClose();
    setClientName("");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 transition-all">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#1A1A1B] px-6 py-4 flex justify-between items-center border-b border-[#C5A059]">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CalIcon className="text-[#C5A059]" size={20} /> New Appointment
            </h2>
            <p className="text-xs text-gray-400 mt-1">Enter client details below.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition bg-white/10 p-2 rounded-full"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          
          {/* Client Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Client Details</label>
            <div className="flex items-center gap-3 border border-gray-200 rounded-xl p-3 focus-within:ring-2 ring-[#C5A059] transition-all bg-gray-50 focus-within:bg-white">
              <User size={20} className="text-gray-400" />
              <input 
                required
                className="w-full outline-none text-base font-semibold bg-transparent text-[#1A1A1B] placeholder:text-gray-300" 
                placeholder="Client Full Name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Service Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Service Type</label>
              <div className="relative">
                <Scissors className="absolute left-3 top-3 text-gray-400" size={18} />
                <select 
                  className="w-full border border-gray-200 rounded-xl p-3 pl-10 text-sm font-medium outline-none focus:border-[#C5A059] bg-white appearance-none"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                >
                  <option>Haircut</option>
                  <option>Beard Trim</option>
                  <option>Full Service</option>
                  <option>Hair Coloring</option>
                  <option>Consultation</option>
                </select>
              </div>
            </div>

            {/* Barber Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Specialist</label>
              <div className="grid grid-cols-1 gap-2">
                 <select 
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#C5A059] bg-white"
                  value={barberId}
                  onChange={(e) => setBarberId(Number(e.target.value))}
                >
                  {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Date & Time Row */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400">Date</label>
                <input 
                  type="date"
                  required
                  className="w-full bg-transparent font-bold text-[#1A1A1B] outline-none"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                />
             </div>
             <div className="space-y-1 border-l pl-4 border-gray-200">
                <label className="text-xs font-bold text-gray-400">Start Time</label>
                <input 
                  type="time" 
                  required
                  className="w-full bg-transparent font-bold text-[#1A1A1B] outline-none"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
             </div>
          </div>

          {/* Duration Slider */}
          <div className="space-y-3">
             <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                <span>Duration</span>
                <span className="text-[#C5A059]">{duration} Minutes</span>
             </div>
             <input 
               type="range" 
               min="15" 
               max="180" 
               step="15" 
               value={duration} 
               onChange={(e) => setDuration(Number(e.target.value))}
               className="w-full accent-[#1A1A1B] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
             />
             <div className="flex justify-between text-[10px] text-gray-400">
               <span>15m</span>
               <span>3h</span>
             </div>
          </div>

          <button type="submit" className="w-full bg-[#1A1A1B] hover:bg-black text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 group">
            <CheckCircle2 size={20} className="text-[#C5A059] group-hover:scale-110 transition-transform" /> 
            Confirm Booking
          </button>

        </form>
      </div>
    </div>
  );
}