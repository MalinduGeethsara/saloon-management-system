"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Clock, 
  Crosshair
} from "lucide-react";
import { ConfigProvider, Modal } from "antd"; 
import { NewBookingModal } from "@/components/modals/NewBookingModal";
import { BookingDetailsModal } from "@/components/modals/BookingDetailsModal";
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem"; 

// --- Sri Lankan Staff Data ---
const BARBERS = [
  { id: 1, name: 'Nuwan Pradeep', color: '#18181b' },  // Zinc
  { id: 2, name: 'Kasun Perera', color: '#7C4DFF' },   // Cascal Purple
  { id: 3, name: 'Lahiru Thirimanne', color: '#2563eb' }, // Blue
  { id: 4, name: 'Chamara Silva', color: '#059669' },  // Emerald
];

// Helper to generate dates relative to "Now"
const getRelativeDate = (days: number, hours: number, minutes: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

// Mock Events
const INITIAL_EVENTS = [
  {
    id: '1',
    title: 'Amila Bandara',
    start: getRelativeDate(0, 10, 0), 
    end: getRelativeDate(0, 11, 0),
    backgroundColor: '#18181b',
    borderColor: '#18181b',
    extendedProps: { barberId: 1, barberName: 'Nuwan Pradeep', service: 'Haircut', status: 'Confirmed' }
  },
  {
    id: '2',
    title: 'Ruwan Kumara',
    start: getRelativeDate(0, 14, 30), 
    end: getRelativeDate(0, 15, 15),
    backgroundColor: '#7C4DFF',
    borderColor: '#7C4DFF',
    textColor: '#ffffff',
    extendedProps: { barberId: 2, barberName: 'Kasun Perera', service: 'Beard Trim', status: 'Confirmed' }
  },
  {
    id: '3',
    title: 'Past Booking (Sanjeewa)',
    start: getRelativeDate(-1, 9, 0), 
    end: getRelativeDate(-1, 10, 0),
    backgroundColor: '#059669',
    borderColor: '#059669',
    extendedProps: { barberId: 4, barberName: 'Chamara Silva', service: 'Full Service', status: 'Completed' }
  }
];

function ScheduleContent() {
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  
  // Modal States
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeFilter, setActiveFilter] = useState<number | 'ALL'>('ALL');
  const [viewTitle, setViewTitle] = useState("");
  const [currentView, setCurrentView] = useState('timeGridDay'); // Default to Today View
  
  // State for "Today's Past" blocking event
  const [nowDate, setNowDate] = useState(new Date());

  const { showAlert } = useAlert();

  useEffect(() => {
    setViewTitle(new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    
    // Update "Now" every minute to keep the red block accurate
    const interval = setInterval(() => setNowDate(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // --- Generate Background Event for "Today's Past" ---
  const todayPastBlocker = useMemo(() => {
    const startOfToday = new Date(nowDate);
    startOfToday.setHours(0, 0, 0, 0);

    return {
      start: startOfToday,
      end: nowDate, // Blocks up to current second
      display: 'background',
      backgroundColor: '#FEF2F2', // Light Red
      className: 'today-past-blocker' // Helper class if needed
    };
  }, [nowDate]);

  // Combine Real Events + The "Today Past" Blocker
  const allCalendarEvents = useMemo(() => {
    let visibleEvents = activeFilter === 'ALL' 
      ? events 
      : events.filter(evt => evt.extendedProps.barberId === activeFilter);
      
    // Append the blocker
    return [...visibleEvents, todayPastBlocker];
  }, [events, activeFilter, todayPastBlocker]);


  // --- Handlers ---
  const handleCalendarAction = (action: 'prev' | 'next' | 'today') => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api[action]();
    setViewTitle(api.view.title);
  };

  const handleScrollToNow = () => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    const now = new Date();
    const scrollTime = new Date(now.getTime() - 60 * 60 * 1000).toTimeString().split(' ')[0];
    api.scrollToTime(scrollTime);
    showAlert('success', 'Scrolled to current time');
  };

  const handleViewChange = (view: string) => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api.changeView(view);
    setCurrentView(view);
    setViewTitle(api.view.title);
  };

  const isDateInPast = (date: Date) => {
    const now = new Date();
    // 5 min buffer to prevent accidental blocks near "now"
    return date.getTime() < (now.getTime() - 5 * 60000);
  };

  const handleDateClick = (arg: any) => {
    if (isDateInPast(arg.date)) {
      showAlert('error', 'Cannot book appointments in the past.');
      return;
    }
    setSelectedDate(arg.date);
    setIsNewModalOpen(true);
  };

  const handleDateSelect = (selectInfo: any) => {
    const calendarApi = selectInfo.view.calendar;
    if (isDateInPast(selectInfo.start)) {
        showAlert('error', 'Cannot book past time slots.');
        calendarApi.unselect(); 
        return;
    }
    setSelectedDate(selectInfo.start);
    setIsNewModalOpen(true);
    calendarApi.unselect(); 
  };

  const handleEventClick = (clickInfo: any) => {
    // Prevent clicking on the background blocker
    if (clickInfo.event.display === 'background') return;

    setSelectedEvent(clickInfo.event);
    setIsDetailsModalOpen(true);
  };

  const handleCancelBooking = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    showAlert('success', 'Booking cancelled successfully.');
    setIsDetailsModalOpen(false);
  };

  const handleSaveBooking = (newBooking: any) => {
    setEvents(prev => [...prev, newBooking]);
    setIsNewModalOpen(false);
    showAlert('success', 'New appointment confirmed!');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 bg-white h-[calc(100vh-100px)]">
      
      {/* LEFT SIDEBAR */}
      <div className="w-full lg:w-72 flex flex-col gap-6 shrink-0 h-full">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Schedule</h2>
          <p className="text-sm text-slate-500">Manage appointments and staff.</p>
        </div>

        <button 
          onClick={() => { setSelectedDate(new Date()); setIsNewModalOpen(true); }}
          className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-xl bg-[#7C4DFF] px-8 text-sm font-bold text-white shadow-lg shadow-[#7C4DFF]/20 transition-all hover:bg-[#6c42e0] hover:translate-y-[-1px]"
        >
          <Plus className="mr-2 h-4 w-4" /> New Appointment
        </button>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 font-semibold text-sm text-slate-700 flex items-center gap-2">
            <Filter className="h-3.5 w-3.5" /> Staff Filter
          </div>
          <div className="p-4 grid gap-2 overflow-y-auto">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`flex items-center w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                activeFilter === 'ALL' 
                  ? 'bg-[#F0EBFF] text-[#7C4DFF] ring-1 ring-[#7C4DFF] shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <span className={`flex h-2 w-2 rounded-full mr-2 ${activeFilter === 'ALL' ? 'bg-[#7C4DFF]' : 'bg-slate-300'}`} />
              All Staff
            </button>
            
            {BARBERS.map((barber) => (
              <button
                key={barber.id}
                onClick={() => setActiveFilter(barber.id)}
                className={`flex items-center w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  activeFilter === barber.id 
                    ? 'bg-[#F0EBFF] text-[#7C4DFF] ring-1 ring-[#7C4DFF] shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span 
                  className="flex h-2 w-2 rounded-full mr-2" 
                  style={{ backgroundColor: barber.color }} 
                />
                {barber.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT CALENDAR AREA */}
      <div className="flex-1 flex flex-col rounded-xl border border-slate-200 shadow-sm bg-white overflow-hidden h-full">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4 bg-white">
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
            {['timeGridDay', 'timeGridWeek', 'dayGridMonth'].map((view) => (
              <button
                key={view}
                onClick={() => handleViewChange(view)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  currentView === view
                    ? 'bg-white text-[#7C4DFF] shadow-sm ring-1 ring-black/5'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {view.replace('timeGrid', '').replace('dayGrid', '')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => handleCalendarAction('prev')} className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-[#F0EBFF] hover:text-[#7C4DFF] text-slate-500 transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-sm font-bold text-slate-900 min-w-[140px] text-center uppercase tracking-wide">
              {viewTitle}
            </h2>
            <button onClick={() => handleCalendarAction('next')} className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-[#F0EBFF] hover:text-[#7C4DFF] text-slate-500 transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleScrollToNow}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold shadow-sm transition-colors hover:border-[#7C4DFF] hover:text-[#7C4DFF] group"
              title="Jump to current time"
            >
              <Crosshair className="h-3.5 w-3.5 mr-1 group-hover:animate-spin-slow" /> Now
            </button>

            <button 
              onClick={() => handleCalendarAction('today')}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold shadow-sm transition-colors hover:border-[#7C4DFF] hover:text-[#7C4DFF]"
            >
              Today
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 relative bg-white">
          <style jsx global>{`
            .fc {
              --fc-border-color: #e2e8f0;
              --fc-button-text-color: #0f172a;
              --fc-button-bg-color: #ffffff;
              --fc-button-border-color: #e2e8f0;
              --fc-event-bg-color: #7C4DFF;
              --fc-event-border-color: #7C4DFF;
              --fc-today-bg-color: transparent; 
              --fc-neutral-bg-color: #f1f5f9;
              --fc-page-bg-color: #ffffff;
              font-family: inherit;
            }
            .fc-header-toolbar { display: none !important; }
            .fc-theme-standard td, .fc-theme-standard th { border-color: var(--fc-border-color); }
            .fc-col-header-cell { background-color: #ffffff; padding: 12px 0; }
            .fc-col-header-cell-cushion { color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-decoration: none !important; }
            
            /* -- COLOR CUSTOMIZATION -- */
            
            /* 1. Base Future Slot -> Light Green */
            /* We set the default background for ALL slots to green */
            .fc-timegrid-slot { 
              height: 3rem !important; 
              background-color: #F0FDF4 !important; /* Light Green */
            }
            .fc-timegrid-slot-lane { background-color: #F0FDF4; }

            /* 2. Past Days (Columns) -> Light Red */
            .fc-timegrid-col.fc-day-past { 
              background-color: #FEF2F2 !important; /* Light Red */
            }

            /* 3. Today's Past (Overlay Event) -> Light Red */
            /* The 'todayPastBlocker' event we added will handle the red color for today's past hours. */
            /* We ensure background events have the right opacity/color */
            .fc-bg-event {
              background-color: #FEF2F2 !important;
              opacity: 1 !important; /* Make it solid to cover the green */
            }

            .fc-timegrid-slot-label-cushion { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }
            
            .fc-event { border-radius: 6px; padding: 2px; border: none; box-shadow: 0 4px 6px -1px rgba(124, 77, 255, 0.2); font-size: 0.75rem; font-weight: 600; cursor: pointer; }
            .fc-event:hover { filter: brightness(110%); }
            
            .fc-timegrid-now-indicator-line { border-color: #7C4DFF; border-width: 2px; }
            .fc-timegrid-now-indicator-arrow { border-color: #7C4DFF; border-width: 6px; }
          `}</style>

          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridDay"
            height="100%"
            headerToolbar={false}
            
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            allDaySlot={false}
            slotDuration="00:15:00"
            slotMinTime="08:00:00"
            slotMaxTime="22:00:00"
            expandRows={true}
            stickyHeaderDates={true}
            nowIndicator={true}
            scrollTime={new Date(new Date().getTime() - 3600000).toTimeString().slice(0, 8)}
            businessHours={{ daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: '09:00', endTime: '20:00' }}
            
            events={allCalendarEvents} // Uses the memoized list including the 'blocker'
            
            dateClick={handleDateClick}
            select={handleDateSelect}
            eventClick={handleEventClick}
            
            eventContent={(info) => (
              <div className="flex flex-col h-full justify-center px-2 py-1 overflow-hidden">
                <div className="flex items-center gap-1.5 mb-0.5 opacity-90">
                  <Clock className="h-3 w-3" />
                  <span className="text-[10px] font-medium">{info.timeText}</span>
                </div>
                <div className="font-bold truncate">{info.event.title}</div>
                {currentView !== 'dayGridMonth' && (
                  <div className="text-[10px] opacity-75 truncate mt-0.5 font-medium">
                    {info.event.extendedProps.service}
                  </div>
                )}
              </div>
            )}
          />
        </div>
      </div>

      {/* New Booking Modal (Create) */}
      <NewBookingModal 
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSave={handleSaveBooking}
        barbers={BARBERS}
        defaultDate={selectedDate}
        defaultBarberId={activeFilter !== 'ALL' ? activeFilter : undefined}
      />

      {/* Details Booking Modal (View/Cancel) */}
      <BookingDetailsModal 
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        event={selectedEvent}
        onCancelBooking={handleCancelBooking}
      />
    </div>
  );
}

export default function MasterSchedule() {
  return (
    <AlertProvider>
      <ConfigProvider theme={{ token: { colorPrimary: '#7C4DFF', borderRadius: 8 } }}>
        <ScheduleContent />
      </ConfigProvider>
    </AlertProvider>
  );
}