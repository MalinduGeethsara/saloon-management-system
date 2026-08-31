"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  UserOutlined, 
  ClockCircleOutlined, 
  CheckCircleFilled,
  ArrowLeftOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  LockOutlined,
  ScissorOutlined,
  HomeOutlined
} from '@ant-design/icons';
import ScrollReveal from "@/components/ui/ScrollReveal";
import DatePickerField from "@/components/ui/DatePickerField";
import { getAllPublicBarbers, getAllPublicServices, getPublicShops } from "@/lib/actions/public";
import { createBooking, getBookedSlots } from "@/lib/actions/booking";

const timeSlots = ["09:00 AM", "09:45 AM", "10:30 AM", "11:15 AM", "01:00 PM", "01:45 PM", "02:30 PM", "04:00 PM"];

export default function BookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  // Data State
  const [barbers, setBarbers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection State
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<any | null>(null);
  const [selectedShop, setSelectedShop] = useState<any | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Date and Time locking
  const [bookingDate, setBookingDate] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  // Payment state
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Client-side guard check
    const roleCookie = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    const userRole = roleCookie ? roleCookie[2] : null;
    
    if (!roleCookie || !userRole) {
      window.location.href = '/login?callbackUrl=/booking';
      return;
    }

    // Set initial date to today for the input date picker
    const today = new Date();
    // Format to YYYY-MM-DD
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setBookingDate(`${yyyy}-${mm}-${dd}`);

    // Fetch dynamic data
    const fetchInitialData = async () => {
      try {
        const [fetchedBarbers, fetchedServices, fetchedShops] = await Promise.all([
          getAllPublicBarbers(),
          getAllPublicServices(),
          getPublicShops()
        ]);
        setBarbers(fetchedBarbers);
        setServices(fetchedServices);
        setShops(fetchedShops);
      } catch (err) {
        console.error("Failed to load booking data", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);

  // Fetch booked slots whenever the date or barber changes
  useEffect(() => {
    const loadBookedSlots = async () => {
      if (!selectedBarber || !bookingDate) return;
      setIsFetchingSlots(true);
      try {
        const slots = await getBookedSlots(selectedBarber.id, bookingDate);
        setBookedSlots(slots);
        // Reset selected slot if it became booked
        if (selectedSlot && slots.includes(selectedSlot)) {
          setSelectedSlot(null);
        }
      } catch (error) {
        console.error("Failed to fetch booked slots", error);
      } finally {
        setIsFetchingSlots(false);
      }
    };

    loadBookedSlots();
  }, [selectedBarber, bookingDate]);

  const toggleService = (service: any) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id);
      if (exists) {
        return prev.filter(s => s.id !== service.id);
      }
      return [...prev, service];
    });
  };

  const calculateTotalAmount = () => {
    return selectedServices.reduce((sum, service) => sum + service.price, 0);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage("");

    if (selectedServices.length === 0 || !selectedBarber || !selectedSlot) {
      setErrorMessage("Please complete all previous steps.");
      setIsProcessing(false);
      return;
    }

    const payload = {
      serviceIds: selectedServices.map(s => s.id),
      barberId: selectedBarber.id,
      shopId: selectedShop?.id,
      date: bookingDate,
      time: selectedSlot,
      paymentMethod: "Card"
    };

    const result = await createBooking(payload);

    if (result.success) {
      setStep(6);
    } else {
      setErrorMessage(result.message || "Payment failed. Please try again.");
    }
    
    setIsProcessing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-amber-500 font-bold uppercase tracking-widest text-sm">Loading Booking Engine...</div>
      </div>
    );
  }

  const totalAmount = calculateTotalAmount();

  const getLocalDateString = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const isBookingDateInPast = !!bookingDate && bookingDate < getLocalDateString(new Date());

  const isSlotPassed = (slotTimeStr: string, selectedDateStr: string) => {
    if (!selectedDateStr) return false;
    const now = new Date();
    const [yyyy, mm, dd] = selectedDateStr.split('-').map(Number);
    const selectedDate = new Date(yyyy, mm - 1, dd);
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (selectedDate < today) return true;
    if (selectedDate > today) return false;
    
    const [time, period] = slotTimeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    const slotDate = new Date(yyyy, mm - 1, dd, hours, minutes);
    return slotDate < now;
  };

  return (
    <div className="relative flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-amber-600 selection:text-white font-sans transition-colors duration-500 overflow-hidden">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto w-full py-24 px-6 md:px-12 flex-grow flex flex-col">
        
        {/* Header Section */}
        <ScrollReveal direction="down">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div>
              <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 transition-colors">Reservation</h3>
              <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white transition-colors">
                Book Your <span className="font-serif italic font-light text-zinc-500">Session</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              <div className={`w-4 md:w-5 h-1 rounded-full ${step >= 1 ? 'bg-amber-600 dark:bg-amber-500' : 'bg-zinc-200 dark:bg-zinc-800'} transition-colors duration-500`}></div>
              <div className={`w-4 md:w-5 h-1 rounded-full ${step >= 2 ? 'bg-amber-600 dark:bg-amber-500' : 'bg-zinc-200 dark:bg-zinc-800'} transition-colors duration-500`}></div>
              <div className={`w-4 md:w-5 h-1 rounded-full ${step >= 3 ? 'bg-amber-600 dark:bg-amber-500' : 'bg-zinc-200 dark:bg-zinc-800'} transition-colors duration-500`}></div>
              <div className={`w-4 md:w-5 h-1 rounded-full ${step >= 4 ? 'bg-amber-600 dark:bg-amber-500' : 'bg-zinc-200 dark:bg-zinc-800'} transition-colors duration-500`}></div>
              <div className={`w-4 md:w-5 h-1 rounded-full ${step >= 5 ? 'bg-amber-600 dark:bg-amber-500' : 'bg-zinc-200 dark:bg-zinc-800'} transition-colors duration-500`}></div>
              <span className="text-[10px] md:text-xs font-bold tracking-widest text-zinc-500 uppercase ml-2">Step {step > 5 ? 5 : step} of 5</span>
            </div>
          </div>
        </ScrollReveal>

        {/* Content Area */}
        <ScrollReveal direction="down" delay={0.2} className="flex-grow flex flex-col">
          
          {/* Step 1: Branch Selection */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col h-full">
              <h2 className="text-xl md:text-2xl font-bold mb-8 flex items-center gap-3 text-zinc-900 dark:text-white">
                <HomeOutlined className="text-amber-600 dark:text-amber-500" /> 
                Select A Branch
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">Choose the location most convenient for you.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:gap-6 mb-8">
                {shops.map((shop) => {
                  const isSelected = selectedShop?.id === shop.id;
                  return (
                    <div 
                      key={shop.id}
                      onClick={() => setSelectedShop(shop)}
                      className={`group relative flex flex-col px-6 py-8 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border ${isSelected ? 'border-amber-500 shadow-md shadow-amber-500/20' : 'border-zinc-200 dark:border-zinc-800/60 hover:border-amber-500/50'} cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md dark:shadow-none w-full overflow-hidden`}
                    >
                      <h4 className="text-xl font-bold text-zinc-900 dark:text-white tracking-wide transition-colors">{shop.name}</h4>
                      <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm mt-2">{shop.address}</p>
                      
                      <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${isSelected ? 'border-amber-500 bg-amber-500 text-white' : 'border-zinc-300 dark:border-zinc-700 text-transparent'}`}>
                        <CheckCircleFilled className="text-sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-auto flex justify-end">
                <button 
                  onClick={() => selectedShop && setStep(2)}
                  disabled={!selectedShop}
                  className={`inline-flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-sm py-5 px-12 transition-all shadow-xl dark:shadow-none ${
                    selectedShop
                      ? 'bg-amber-600 text-white dark:text-zinc-950 hover:bg-amber-700 dark:hover:bg-amber-500 cursor-pointer hover:scale-105' 
                      : 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Service Selection */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col h-full">
              <button 
                onClick={() => setStep(1)} 
                className="self-start mb-8 text-xs font-bold text-zinc-500 hover:text-amber-600 dark:hover:text-amber-500 uppercase tracking-widest flex items-center gap-2 transition-colors"
              >
                <ArrowLeftOutlined /> Back to Branch
              </button>
              <h2 className="text-xl md:text-2xl font-bold mb-8 flex items-center gap-3 text-zinc-900 dark:text-white">
                <ScissorOutlined className="text-amber-600 dark:text-amber-500" /> 
                Select Your Services
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">You can select one or multiple services for your booking.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6 mb-8">
                {services.map((s) => {
                  const isSelected = selectedServices.some(selected => selected.id === s.id);
                  return (
                    <div 
                      key={s.id}
                      onClick={() => toggleService(s)}
                      className={`group relative flex flex-col px-6 py-6 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border ${isSelected ? 'border-amber-500 shadow-md shadow-amber-500/20' : 'border-zinc-200 dark:border-zinc-800/60 hover:border-amber-500/50'} cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md dark:shadow-none w-full overflow-hidden`}
                    >
                      <div className="w-full h-40 overflow-hidden mb-6 border border-transparent group-hover:border-amber-500/30 transition-all duration-500 relative bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                        {s.imageUrl ? (
                          <img 
                            src={s.imageUrl} 
                            alt={s.name} 
                            className={`w-full h-full object-cover transition-all duration-700 ${isSelected ? 'grayscale-0 scale-105' : 'grayscale group-hover:grayscale-0 group-hover:scale-105'}`}
                          />
                        ) : (
                          <span className="text-zinc-500 text-sm font-bold uppercase tracking-widest">No Image</span>
                        )}
                      </div>
                      <h4 className="text-lg font-bold text-zinc-900 dark:text-white tracking-wide transition-colors">{s.name}</h4>
                      <p className="text-amber-600 dark:text-amber-500 font-mono tracking-widest text-sm mt-2">LKR {s.price}</p>
                      
                      <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${isSelected ? 'border-amber-500 bg-amber-500 text-white' : 'border-zinc-300 dark:border-zinc-700 text-transparent'}`}>
                        <CheckCircleFilled className="text-sm" />
                      </div>
                    </div>
                  );
                })}
                {services.length === 0 && (
                  <div className="col-span-full py-12 text-center text-zinc-500">
                    No active services found in the database.
                  </div>
                )}
              </div>
              
              <div className="mt-auto flex justify-end">
                <button 
                  onClick={() => selectedServices.length > 0 && setStep(3)}
                  disabled={selectedServices.length === 0}
                  className={`inline-flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-sm py-5 px-12 transition-all shadow-xl dark:shadow-none ${
                    selectedServices.length > 0
                      ? 'bg-amber-600 text-white dark:text-zinc-950 hover:bg-amber-700 dark:hover:bg-amber-500 cursor-pointer hover:scale-105' 
                      : 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Barber Selection */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <button 
                onClick={() => setStep(2)} 
                className="self-start mb-8 text-xs font-bold text-zinc-500 hover:text-amber-600 dark:hover:text-amber-500 uppercase tracking-widest flex items-center gap-2 transition-colors"
              >
                <ArrowLeftOutlined /> Back to Services
              </button>
              
              <h2 className="text-xl md:text-2xl font-bold mb-8 flex items-center gap-3 text-zinc-900 dark:text-white">
                <UserOutlined className="text-amber-600 dark:text-amber-500" /> 
                Select Your Artisan
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
                {barbers.filter(b => !selectedShop || b.shopId === selectedShop.id || !b.shopId).map((b) => {
                  const isSelected = selectedBarber?.id === b.id;
                  return (
                    <div 
                      key={b.id}
                      onClick={() => { 
                        setSelectedBarber(b); 
                        setTimeout(() => setStep(4), 300);
                      }}
                      className={`group relative flex flex-col items-center px-4 py-6 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border ${isSelected ? 'border-amber-500 shadow-md shadow-amber-500/20' : 'border-zinc-200 dark:border-zinc-800/60 hover:border-amber-500/50'} cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md dark:shadow-none w-full overflow-hidden`}
                    >
                      <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden mb-6 border-2 border-transparent group-hover:border-amber-500/30 transition-all duration-500 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                        {b.imageUrl ? (
                          <img 
                            src={b.imageUrl} 
                            alt={b.name} 
                            className={`w-full h-full object-cover transition-all duration-700 ${isSelected ? 'grayscale-0 scale-105' : 'grayscale group-hover:grayscale-0 group-hover:scale-105'}`}
                          />
                        ) : (
                          <UserOutlined className="text-4xl text-zinc-400" />
                        )}
                      </div>
                      <h4 className="text-[13px] sm:text-[14px] md:text-[15px] lg:text-[12.5px] xl:text-[14px] 2xl:text-base font-bold text-zinc-900 dark:text-white tracking-wide transition-colors text-center whitespace-nowrap">{b.name}</h4>
                      <p className="text-amber-600 dark:text-amber-500 font-light text-xs mb-2 tracking-widest uppercase mt-1 text-center">{b.role === 'OWNER' ? 'Master Stylist' : 'Senior Barber'}</p>
                      
                      <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${isSelected ? 'border-amber-500 bg-amber-500 text-white' : 'border-zinc-300 dark:border-zinc-700 text-transparent'}`}>
                        <CheckCircleFilled className="text-sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Date & Time */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col">
              <button 
                onClick={() => setStep(3)} 
                className="self-start mb-8 text-xs font-bold text-zinc-500 hover:text-amber-600 dark:hover:text-amber-500 uppercase tracking-widest flex items-center gap-2 transition-colors"
              >
                <ArrowLeftOutlined /> Back to Artisan
              </button>
              
              <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/60 p-8 md:p-12 shadow-lg dark:shadow-none mb-8">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 pb-8 border-b border-zinc-200 dark:border-zinc-800 gap-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 text-zinc-900 dark:text-white mb-2">
                      <CalendarOutlined className="text-amber-600 dark:text-amber-500" /> 
                      Choose Date & Time
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-light">Select an available date and time slot for your {selectedServices.length} selected services.</p>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-zinc-100 dark:bg-zinc-950 px-4 py-3 border border-zinc-200 dark:border-zinc-800">
                    <div className="w-12 h-12 rounded-full border border-zinc-300 dark:border-zinc-700 overflow-hidden flex items-center justify-center bg-zinc-200 dark:bg-zinc-800">
                      {selectedBarber?.imageUrl ? (
                        <img src={selectedBarber.imageUrl} alt={selectedBarber.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserOutlined />
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Artisan</p>
                      <p className="font-bold text-zinc-900 dark:text-white text-sm">{selectedBarber?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-10">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Select Date</h3>
                  <div className="w-full md:w-72">
                    <DatePickerField value={bookingDate} onChange={setBookingDate} />
                  </div>
                </div>

                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-3">
                  Select Time 
                  {isFetchingSlots && <span className="text-[10px] text-amber-500 animate-pulse normal-case">Checking availability...</span>}
                </h3>
                
                {!bookingDate || isBookingDateInPast ? (
                  <div className="text-center py-10 text-sm text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-800">
                    {isBookingDateInPast ? 'Please select today or a future date to see available times.' : 'Please select a date to see available times.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {timeSlots.map((slot) => {
                      const isBooked = bookedSlots.includes(slot);
                      const isPassed = isSlotPassed(slot, bookingDate);
                      const isDisabled = isBooked || isPassed;
                      const isSelected = selectedSlot === slot;

                      return (
                        <button
                          key={slot}
                          onClick={() => !isDisabled && setSelectedSlot(slot)}
                          disabled={isDisabled}
                          className={`py-4 px-2 border flex items-center justify-center text-sm font-bold tracking-wider transition-all duration-300 ${
                            isDisabled
                              ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 cursor-not-allowed line-through opacity-70'
                              : isSelected
                                ? 'border-amber-500 bg-amber-600 text-white shadow-md shadow-amber-500/20'
                                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:border-amber-500/50 hover:text-zinc-900 dark:hover:text-white'
                          }`}
                        >
                          {slot}
                          {isBooked ? (
                            <span className="text-[10px] ml-2 font-normal line-through-none">(Booked)</span>
                          ) : isPassed ? (
                            <span className="text-[10px] ml-2 font-normal line-through-none">(Passed)</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-auto flex justify-end">
                <button
                  onClick={() => bookingDate && !isBookingDateInPast && selectedSlot && setStep(5)}
                  disabled={!bookingDate || isBookingDateInPast || !selectedSlot}
                  className={`inline-flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-sm py-5 px-12 transition-all shadow-xl dark:shadow-none ${
                    bookingDate && !isBookingDateInPast && selectedSlot
                      ? 'bg-amber-600 text-white dark:text-zinc-950 hover:bg-amber-700 dark:hover:bg-amber-500 cursor-pointer hover:scale-105'
                      : 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Checkout & Payment */}
          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto w-full">
              <button 
                onClick={() => setStep(4)} 
                className="self-start mb-8 text-xs font-bold text-zinc-500 hover:text-amber-600 dark:hover:text-amber-500 uppercase tracking-widest flex items-center gap-2 transition-colors"
              >
                <ArrowLeftOutlined /> Back to Schedule
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

                  {errorMessage && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-bold tracking-wide">
                      {errorMessage}
                    </div>
                  )}

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
                      <button type="button" onClick={() => setStep(4)} disabled={isProcessing} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors uppercase tracking-widest">
                        Cancel Order
                      </button>
                      <button 
                        type="submit"
                        disabled={isProcessing}
                        className="inline-flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-sm py-4 px-10 bg-amber-600 text-white dark:text-zinc-950 hover:bg-amber-700 dark:hover:bg-amber-500 transition-all shadow-md hover:scale-105 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none"
                      >
                        {isProcessing ? 'Processing...' : `Pay LKR ${totalAmount.toLocaleString()}`}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Order Summary */}
                <div className="w-full lg:w-80 flex flex-col gap-6">
                  <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6">
                    <h3 className="font-bold text-lg mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">Your Order</h3>
                    
                    <div className="flex flex-col gap-3 mb-4">
                      {selectedServices.map(s => (
                        <div key={s.id} className="flex justify-between items-center text-sm">
                          <span className="text-zinc-500">{s.name}</span>
                          <span className="font-medium">LKR {s.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center py-4 bg-zinc-200/50 dark:bg-zinc-950 px-4 mt-6">
                      <span className="font-bold text-zinc-900 dark:text-white">Total amount</span>
                      <span className="font-bold text-amber-600 dark:text-amber-500">LKR {totalAmount.toLocaleString()}</span>
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

          {/* Success Step */}
          {step === 6 && (
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
                    <div className="w-16 h-16 overflow-hidden rounded-full border border-zinc-300 dark:border-zinc-700 flex items-center justify-center bg-zinc-200 dark:bg-zinc-800">
                      {selectedBarber?.imageUrl ? (
                        <img src={selectedBarber.imageUrl} alt={selectedBarber.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserOutlined />
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Artisan</p>
                      <p className="font-bold text-lg text-zinc-900 dark:text-white">{selectedBarber?.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-start py-2 border-b border-zinc-200 dark:border-zinc-800 border-dashed">
                    <div className="flex items-center gap-3 mt-1">
                      <ScissorOutlined className="text-amber-600 dark:text-amber-500 text-lg" />
                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Services</span>
                    </div>
                    <div className="text-right">
                      {selectedServices.map(s => (
                        <div key={s.id} className="text-zinc-900 dark:text-white font-bold text-sm mb-1">{s.name}</div>
                      ))}
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

        </ScrollReveal>
      </div>
    </div>
  );
}