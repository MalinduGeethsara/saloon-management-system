"use client";

import { useState, useRef, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction"; 
import { Plus, ChevronLeft, ChevronRight, Calendar as CalIcon, Clock, Filter } from "lucide-react";
import { NewBookingModal } from "@/components/modals/NewBookingModal";

// --- Mock Data ---
const BARBERS = [
  { id: 1, name: 'Alex Rivers', color: '#1A1A1B' }, // Signature Black
  { id: 2, name: 'Sam Wilson', color: '#C5A059' },  // Gold
  { id: 3, name: 'Jordan Smith', color: '#4F46E5' }, // Indigo
  { id: 4, name: 'Mike Ross', color: '#059669' },    // Emerald
];

const INITIAL_EVENTS = [
  {
    id: '1',
    title: 'John Doe',
    start: new Date().setHours(10, 0, 0),
    end: new Date().setHours(11, 0, 0),
    backgroundColor: '#1A1A1B',
    borderColor: '#1A1A1B',
    extendedProps: { barberId: 1, service: 'Haircut', status: 'Confirmed' }
  },
  {
    id: '2',
    title: 'Sarah J.',
    start: new Date().setHours(11, 30, 0),
    end: new Date().setHours(12, 15, 0),
    backgroundColor: '#C5A059',
    borderColor: '#C5A059',
    textColor: '#1A1A1B', // Dark text on Gold background
    extendedProps: { barberId: 2, service: 'Beard Trim', status: 'Pending' }
  },
];

export default function MasterSchedule() {
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeFilter, setActiveFilter] = useState<number | 'ALL'>('ALL');
  const [currentViewTitle, setCurrentViewTitle] = useState(new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));

  // Filter Logic
  const filteredEvents = useMemo(() => {
    if (activeFilter === 'ALL') return events;
    return events.filter(evt => evt.extendedProps.barberId === activeFilter);
  }, [events, activeFilter]);

  // --- Handlers for Custom Toolbar ---
  const handlePrev = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.prev();
    updateTitle();
  };

  const handleNext = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.next();
    updateTitle();
  };

  const handleToday = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.today();
    updateTitle();
  };

  const handleViewChange = (view: string) => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.changeView(view);
    updateTitle();
  };

  const updateTitle = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      setCurrentViewTitle(calendarApi.view.title);
    }
  };

  const handleDateClick = (arg: any) => {
    setSelectedDate(arg.date);
    setIsModalOpen(true);
  };

  const handleSaveBooking = (newBooking: any) => {
    setEvents((prev) => [...prev, newBooking]);
    setIsModalOpen(false);
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row gap-6 p-2">
      
      {/* Sidebar Controls (Desktop) / Top (Mobile) */}
      <aside className="w-full md:w-64 flex flex-col gap-6 shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-[#1A1A1B]">Schedule</h1>
          <p className="text-sm text-gray-500">Manage shop appointments.</p>
        </div>

        {/* Action Button */}
        <button 
          onClick={() => { setSelectedDate(new Date()); setIsModalOpen(true); }}
          className="w-full bg-[#1A1A1B] text-[#C5A059] py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:translate-y-[-2px]"
        >
          <Plus size={20} /> New Appointment
        </button>

        {/* Mini Calendar / Filter Legend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex-1 flex flex-col">
          <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
            <Filter size={14} /> Filter by Staff
          </h3>
          
          <div className="space-y-2 overflow-y-auto">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-bold transition-all ${
                activeFilter === 'ALL' 
                  ? 'bg-gray-100 text-[#1A1A1B] ring-1 ring-gray-200' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              All Staff
            </button>

            {BARBERS.map((barber) => (
              <button
                key={barber.id}
                onClick={() => setActiveFilter(barber.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-bold transition-all ${
                  activeFilter === barber.id 
                    ? 'bg-gray-100 text-[#1A1A1B] ring-1 ring-gray-200' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-full shadow-sm" 
                  style={{ backgroundColor: barber.color }} 
                />
                {barber.name}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Calendar Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        
        {/* Custom Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
             <button onClick={() => handleViewChange('timeGridDay')} className="px-3 py-1.5 text-xs font-bold rounded-md hover:bg-white hover:shadow-sm transition">Day</button>
             <button onClick={() => handleViewChange('timeGridWeek')} className="px-3 py-1.5 text-xs font-bold rounded-md hover:bg-white hover:shadow-sm transition bg-white shadow-sm">Week</button>
             <button onClick={() => handleViewChange('dayGridMonth')} className="px-3 py-1.5 text-xs font-bold rounded-md hover:bg-white hover:shadow-sm transition">Month</button>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handlePrev} className="p-2 hover:bg-gray-100 rounded-full transition"><ChevronLeft size={20} /></button>
            <h2 className="text-lg font-black text-[#1A1A1B] min-w-[180px] text-center">{currentViewTitle}</h2>
            <button onClick={handleNext} className="p-2 hover:bg-gray-100 rounded-full transition"><ChevronRight size={20} /></button>
          </div>

          <button onClick={handleToday} className="px-4 py-2 text-xs font-bold border rounded-lg hover:bg-gray-50 transition">
            Today
          </button>
        </div>

        {/* FullCalendar Instance */}
        <div className="flex-1 relative">
           {/* CSS Injection for Deep Customization */}
           <style jsx global>{`
            .fc { font-family: inherit; }
            .fc-header-toolbar { display: none !important; } /* Hide default toolbar */
            .fc-col-header-cell { background-color: #FAFAFA; padding: 12px 0; border: none !important; border-bottom: 1px solid #E5E7EB !important; }
            .fc-col-header-cell-cushion { font-weight: 800; color: #1A1A1B; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
            
            /* Grid Lines */
            .fc-theme-standard td, .fc-theme-standard th { border-color: #F3F4F6; }
            .fc-timegrid-slot { height: 48px !important; border-bottom: 1px dashed #F3F4F6 !important; }
            .fc-timegrid-slot-label { font-size: 11px; font-weight: 600; color: #9CA3AF; vertical-align: middle; }
            
            /* Current Time Indicator */
            .fc-timegrid-now-indicator-line { border-color: #C5A059; border-width: 2px; }
            .fc-timegrid-now-indicator-arrow { border-color: #C5A059; border-width: 6px; }

            /* Business Hours */
            .fc-business-container { background-color: rgba(255, 255, 255, 0); }
            .fc-non-business { background-color: #FAFAFA !important; opacity: 0.6; }

            /* Events */
            .fc-event { 
              border: none; 
              border-radius: 6px; 
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              transition: transform 0.1s;
            }
            .fc-event:hover { transform: scale(1.02); z-index: 50; }
          `}</style>

          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            height="100%"
            headerToolbar={false} // We use our custom toolbar
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            allDaySlot={false}
            slotDuration="00:15:00" // 15 min slots for precision
            snapDuration="00:15:00"
            slotMinTime="08:00:00" // Shop opens 8 AM
            slotMaxTime="22:00:00" // Shop closes 10 PM
            businessHours={{
              daysOfWeek: [ 1, 2, 3, 4, 5, 6 ], // Mon - Sat
              startTime: '09:00', 
              endTime: '20:00', 
            }}
            nowIndicator={true}
            events={filteredEvents}
            dateClick={handleDateClick}
            eventContent={(eventInfo) => (
               <div className="flex flex-col h-full justify-center px-1">
                 <div className="flex items-center gap-1 text-[10px] opacity-90">
                    <Clock size={10} />
                    <span>{eventInfo.timeText}</span>
                 </div>
                 <div className="font-bold text-xs truncate leading-tight">
                    {eventInfo.event.title}
                 </div>
                 {/* Show service if height allows */}
                 {eventInfo.view.type !== 'dayGridMonth' && (
                    <div className="text-[10px] opacity-75 truncate">
                       {eventInfo.event.extendedProps.service} 
                       {activeFilter === 'ALL' && ` • ${eventInfo.event.extendedProps.barberName || 'Staff'}`}
                    </div>
                 )}
               </div>
            )}
          />
        </div>
      </div>

      <NewBookingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBooking}
        barbers={BARBERS}
        defaultDate={selectedDate || new Date()}
        defaultBarberId={activeFilter !== 'ALL' ? activeFilter : undefined}
      />
    </div>
  );
}