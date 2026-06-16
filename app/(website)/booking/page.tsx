"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  UserOutlined, 
  ClockCircleOutlined, 
  CheckCircleFilled,
  ArrowLeftOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  LockOutlined
} from '@ant-design/icons';

const barbers = [
  { id: 1, name: "Kasun", role: "Senior Barber", img: "https://images.unsplash.com/photo-1618077360395-f3068be8e001?q=80&w=1780&auto=format&fit=crop" },
  { id: 2, name: "Danushka", role: "Master Stylist", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1887&auto=format&fit=crop" },
  { id: 3, name: "Nimal", role: "Style Director", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop" },
];

const timeSlots = ["09:00 AM", "09:45 AM", "10:30 AM", "11:15 AM", "01:00 PM", "01:45 PM", "02:30 PM", "04:00 PM"];

export default function BookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedBarber, setSelectedBarber] = useState<typeof barbers[0] | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Payment state
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [bookingDate, setBookingDate] = useState("");

  React.useEffect(() => {
    // Client-side guard check
    const roleCookie = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    const userRole = roleCookie ? roleCookie[2] : null;
    
    if (!roleCookie || !userRole) {
      window.location.href = '/login?callbackUrl=/booking';
      return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formatted = tomorrow.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    setBookingDate(formatted);
  }, []);

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Generate random code like SLAD70507
    const randomCode = "SLAD" + Math.floor(10000 + Math.random() * 90000);
    const newAppointment = {
      id: Math.random().toString(),
      code: randomCode,
      date: bookingDate || "Sep 24, 2026",
      time: selectedSlot || "09:00 AM",
      status: "Pending",
      amount: "LKR 4,000.00",
      paymentMethod: "Card",
      paymentStatus: "Paid",
      barberName: selectedBarber?.name || "Kasun",
      barberRole: selectedBarber?.role || "Senior Barber"
    };

    // Load existing appointments
    const existing = localStorage.getItem("appointments");
    let appointmentsList = [];
    if (existing) {
      try {
        appointmentsList = JSON.parse(existing);
      } catch (err) {
        console.error("Failed to parse appointments:", err);
      }
    } else {
      // Use the default one as initial
      appointmentsList = [
        {
          id: "1",
          code: "SLAD70507",
          date: "2026-09-24",
          time: "4:00 PM",
          status: "Pending",
          amount: "LKR 4,000.00",
          paymentMethod: "Card",
          paymentStatus: "Paid",
          barberName: "Kasun",
          barberRole: "Senior Barber"
        }
      ];
    }

    // Add new appointment to the start of the list
    appointmentsList.unshift(newAppointment);
    localStorage.setItem("appointments", JSON.stringify(appointmentsList));

    // Simulate payment processing
    setTimeout(() => {
      setStep(4);
    }, 800);
  };

  return (
    <div className="relative flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-amber-600 selection:text-white font-sans transition-colors duration-500 overflow-hidden">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto w-full py-24 px-6 md:px-12 flex-grow flex flex-col">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div>
            <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 transition-colors">Reservation</h3>
            <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white transition-colors">
              Book Your <span className="font-serif italic font-light text-zinc-500">Session</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <div className={`w-6 md:w-8 h-1 rounded-full ${step >= 1 ? 'bg-amber-600 dark:bg-amber-500' : 'bg-zinc-200 dark:bg-zinc-800'} transition-colors duration-500`}></div>
            <div className={`w-6 md:w-8 h-1 rounded-full ${step >= 2 ? 'bg-amber-600 dark:bg-amber-500' : 'bg-zinc-200 dark:bg-zinc-800'} transition-colors duration-500`}></div>
            <div className={`w-6 md:w-8 h-1 rounded-full ${step >= 3 ? 'bg-amber-600 dark:bg-amber-500' : 'bg-zinc-200 dark:bg-zinc-800'} transition-colors duration-500`}></div>
            <div className={`w-6 md:w-8 h-1 rounded-full ${step >= 4 ? 'bg-amber-600 dark:bg-amber-500' : 'bg-zinc-200 dark:bg-zinc-800'} transition-colors duration-500`}></div>
            <span className="text-[10px] md:text-xs font-bold tracking-widest text-zinc-500 uppercase ml-2">Step {step} of 4</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow flex flex-col">
          
          {/* Step 1: Barber Selection */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-xl md:text-2xl font-bold mb-8 flex items-center gap-3 text-zinc-900 dark:text-white">
                <UserOutlined className="text-amber-600 dark:text-amber-500" /> 
                Select Your Artisan
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {barbers.map((b) => {
                  const isSelected = selectedBarber?.id === b.id;
                  return (
                    <div 
                      key={b.id}
                      onClick={() => { 
                        setSelectedBarber(b); 
                        setTimeout(() => setStep(2), 300); // Small delay for visual feedback
                      }}
                      className={`group relative flex flex-col items-center p-6 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border ${isSelected ? 'border-amber-500 shadow-md shadow-amber-500/20' : 'border-zinc-200 dark:border-zinc-800/60 hover:border-amber-500/50'} cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md dark:shadow-none`}
                    >
                      <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden mb-6 border-2 border-transparent group-hover:border-amber-500/30 transition-all duration-500">
                        <img 
                          src={b.img} 
                          alt={b.name} 
                          className={`w-full h-full object-cover transition-all duration-700 ${isSelected ? 'grayscale-0 scale-105' : 'grayscale group-hover:grayscale-0 group-hover:scale-105'}`}
                        />
                      </div>
                      <h4 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-wide transition-colors">{b.name}</h4>
                      <p className="text-amber-600 dark:text-amber-500 font-light text-xs mb-2 tracking-widest uppercase mt-1">{b.role}</p>
                      
                      <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${isSelected ? 'border-amber-500 bg-amber-500 text-white' : 'border-zinc-300 dark:border-zinc-700 text-transparent'}`}>
                        <CheckCircleFilled className="text-sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Time Selection */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col h-full">
              <button 
                onClick={() => setStep(1)} 
                className="self-start mb-8 text-xs font-bold text-zinc-500 hover:text-amber-600 dark:hover:text-amber-500 uppercase tracking-widest flex items-center gap-2 transition-colors"
              >
                <ArrowLeftOutlined /> Back to Artisans
              </button>
              
              <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/60 p-8 md:p-12 shadow-lg dark:shadow-none mb-8">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 pb-8 border-b border-zinc-200 dark:border-zinc-800 gap-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 text-zinc-900 dark:text-white mb-2">
                      <ClockCircleOutlined className="text-amber-600 dark:text-amber-500" /> 
                      Choose Your Time
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-light">Select an available slot for your session.</p>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-zinc-100 dark:bg-zinc-950 px-4 py-3 border border-zinc-200 dark:border-zinc-800">
                    <img src={selectedBarber?.img} alt={selectedBarber?.name} className="w-12 h-12 object-cover rounded-full border border-zinc-300 dark:border-zinc-700" />
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Artisan</p>
                      <p className="font-bold text-zinc-900 dark:text-white text-sm">{selectedBarber?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {timeSlots.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-4 px-2 border flex items-center justify-center text-sm font-bold tracking-wider transition-all duration-300 ${
                          isSelected 
                            ? 'border-amber-500 bg-amber-600 text-white shadow-md shadow-amber-500/20' 
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:border-amber-500/50 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="mt-auto flex justify-end">
                <button 
                  onClick={() => selectedSlot && setStep(3)}
                  disabled={!selectedSlot}
                  className={`inline-flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-sm py-5 px-12 transition-all shadow-xl dark:shadow-none ${
                    selectedSlot 
                      ? 'bg-amber-600 text-white dark:text-zinc-950 hover:bg-amber-700 dark:hover:bg-amber-500 cursor-pointer hover:scale-105' 
                      : 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment Details */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col h-full">
              <button 
                onClick={() => setStep(2)} 
                className="self-start mb-8 text-xs font-bold text-zinc-500 hover:text-amber-600 dark:hover:text-amber-500 uppercase tracking-widest flex items-center gap-2 transition-colors"
              >
                <ArrowLeftOutlined /> Back to Time Selection
              </button>

              <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Payment Form (Mock HNB IPG Styled) */}
                <div className="flex-1 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/60 p-8 md:p-10 shadow-lg dark:shadow-none">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 text-zinc-900 dark:text-white">
                      <CreditCardOutlined className="text-amber-600 dark:text-amber-500" /> 
                      Payment Details
                    </h2>
                    <LockOutlined className="text-xl text-emerald-500" title="Secure Payment" />
                  </div>

                  <form onSubmit={handlePaymentSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Card Number <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        required
                        placeholder="0000 0000 0000 0000" 
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white px-4 py-3 outline-none focus:border-amber-500 transition-colors font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Expiration <span className="text-red-500">*</span></label>
                        <div className="flex gap-3">
                          <input 
                            type="text" 
                            required
                            placeholder="MM" 
                            maxLength={2}
                            value={expiryMonth}
                            onChange={(e) => setExpiryMonth(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white px-4 py-3 outline-none focus:border-amber-500 transition-colors font-mono text-center"
                          />
                          <input 
                            type="text" 
                            required
                            placeholder="YY" 
                            maxLength={2}
                            value={expiryYear}
                            onChange={(e) => setExpiryYear(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white px-4 py-3 outline-none focus:border-amber-500 transition-colors font-mono text-center"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">CVN <span className="text-red-500">*</span></label>
                        <input 
                          type="password" 
                          required
                          placeholder="123" 
                          maxLength={4}
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white px-4 py-3 outline-none focus:border-amber-500 transition-colors font-mono"
                        />
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-tight">This code is a three or four digit number printed on the back or front of credit cards.</p>
                      </div>
                    </div>

                    <div className="pt-6 flex justify-between items-center border-t border-zinc-200 dark:border-zinc-800">
                      <button type="button" onClick={() => setStep(2)} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors uppercase tracking-widest">
                        Cancel Order
                      </button>
                      <button 
                        type="submit"
                        className="inline-flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-sm py-4 px-10 bg-amber-600 text-white dark:text-zinc-950 hover:bg-amber-700 dark:hover:bg-amber-500 transition-all shadow-md hover:scale-105"
                      >
                        Pay LKR 4,000.00
                      </button>
                    </div>
                  </form>
                </div>

                {/* Order Summary */}
                <div className="w-full lg:w-80 flex flex-col gap-6">
                  <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
                    <h3 className="font-bold text-lg mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">Your Order</h3>
                    
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-zinc-500 text-sm">Service Fee</span>
                      <span className="font-medium">LKR 4,000.00</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-4 bg-zinc-200/50 dark:bg-zinc-950 px-4 mt-6">
                      <span className="font-bold text-zinc-900 dark:text-white">Total amount</span>
                      <span className="font-bold text-amber-600 dark:text-amber-500">LKR 4,000.00</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 p-4 border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
                    <span className="text-xs font-bold text-zinc-400">SECURE PAYMENT BY</span>
                    <span className="text-sm font-black text-[#0063A6]">HNB<span className="text-[#FDB913]">IPG</span></span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="animate-in zoom-in-95 fade-in duration-700 flex flex-col items-center justify-center py-12">
              <div className="w-full max-w-lg bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/60 p-10 md:p-14 shadow-2xl dark:shadow-none text-center relative overflow-hidden">
                
                {/* Success Background Elements */}
                <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="flex justify-center mb-8 relative z-10">
                  <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-500 shadow-inner">
                    <CheckCircleFilled className="text-5xl drop-shadow-md" />
                  </div>
                </div>
                
                <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2 relative z-10">Payment Successful.</h2>
                <p className="text-zinc-500 dark:text-zinc-400 font-light mb-10 relative z-10">Your appointment has been successfully confirmed and paid.</p>
                
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 space-y-4 text-left relative z-10 mb-10">
                  <div className="flex items-center gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                    <img src={selectedBarber?.img} alt={selectedBarber?.name} className="w-16 h-16 object-cover rounded-full border border-zinc-300 dark:border-zinc-700" />
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Artisan</p>
                      <p className="font-bold text-lg text-zinc-900 dark:text-white">{selectedBarber?.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-3">
                      <CalendarOutlined className="text-amber-600 dark:text-amber-500 text-lg" />
                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Date</span>
                    </div>
                    <strong className="text-zinc-900 dark:text-white font-bold">{bookingDate}</strong>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-3">
                      <ClockCircleOutlined className="text-amber-600 dark:text-amber-500 text-lg" />
                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Time</span>
                    </div>
                    <strong className="text-zinc-900 dark:text-white font-bold">{selectedSlot}</strong>
                  </div>
                </div>
                
                <button 
                  onClick={() => router.push('/profile')}
                  className="w-full border border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 py-4 font-bold uppercase tracking-widest text-xs hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-950 transition-colors relative z-10"
                >
                  View Appointments History
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}