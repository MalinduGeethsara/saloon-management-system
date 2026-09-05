"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { 
  PlusOutlined, 
  LeftOutlined, 
  RightOutlined, 
  ClockCircleOutlined, 
  CalendarOutlined,
  SearchOutlined,
  UserOutlined,
  EnvironmentOutlined
} from "@ant-design/icons";
import { 
  ConfigProvider, 
  Button, 
  Avatar, 
  Typography, 
  Card, 
  Calendar as MiniCalendar, 
  Badge,
  Input,
  Tag,
  theme,
  Divider,
  Empty
} from "antd"; 
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem"; 

// --- Import your Modal ---
import { NewBookingModal } from "@/components/modals/NewBookingModal";
import { Modal, Descriptions } from 'antd';

const { Title, Text } = Typography;
const { useToken } = theme;

// --- Predefined Colors for Dynamic Staff ---
const COLOR_PALETTE = ['#7C4DFF', '#059669', '#2563eb', '#d97706', '#dc2626', '#4f46e5', '#db2777', '#18181b'];

interface Barber {
  id: string;
  name: string;
  color: string;
  role: string;
}

// --- Helper: Generate Dates ---
const getRelativeDate = (days: number, hours: number, minutes: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

function ScheduleContent() {
  const { token } = useToken();
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const { showAlert } = useAlert();
  
  // --- States ---
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const [editingBooking, setEditingBooking] = useState<any>(null);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeBarberId, setActiveBarberId] = useState<string | undefined>(undefined);
  const [currentView, setCurrentView] = useState('timeGridDay');
  const [viewTitle, setViewTitle] = useState("");
  const [userRole, setUserRole] = useState<string>('owner');
  
  const fetchBookingsAndStaff = async () => {
    try {
      // Fetch Staff first to map colors
      const staffRes = await fetch('/api/v1/staff');
      const staffData = await staffRes.json();
      let staffList: Barber[] = [];
      
      if (staffData.staff) {
        staffList = staffData.staff.map((s: any, idx: number) => ({
          id: String(s.id),
          name: s.name,
          color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
          role: s.role
        }));
        setBarbers(staffList);
      }

      // Fetch Bookings
      const res = await fetch('/api/v1/bookings');
      const data = await res.json();
      if (data.bookings) {
        setEvents(data.bookings.map((b: any) => {
          const mainDuration = b.services?.[0]?.service?.duration || 60;
          const endDate = new Date(new Date(b.date).getTime() + mainDuration * 60000);
          const assignedBarber = staffList.find(s => s.id === String(b.barberId));
          const eventColor = assignedBarber?.color || '#7C4DFF';
          
          return {
            id: b.id,
            title: b.customer?.name || 'Walk-in Client',
            start: new Date(b.date),
            end: endDate,
            backgroundColor: b.status === 'PENDING' ? '#f97316' : eventColor,
            borderColor: b.status === 'PENDING' ? '#ea580c' : eventColor,
            textColor: '#ffffff',
            classNames: b.status === 'PENDING' ? ['animate-pulse', 'shadow-md', 'shadow-orange-400/50'] : [],
            extendedProps: {
              barberId: String(b.barberId),
              service: b.services?.map((s: any) => s.service?.name).filter(Boolean).join(', ') || 'Service',
              status: b.status,
              shop: b.shop?.name,
              color: eventColor
            }
          };
        }));
      }
    } catch (e) {
      showAlert('error', 'Failed to load calendar events');
    }
  };

  useEffect(() => {
    fetchBookingsAndStaff();
    
    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchBookingsAndStaff();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // --- Initialize Title & Cookies ---
  useEffect(() => {
    if (calendarRef.current) {
      setViewTitle(calendarRef.current.getApi().view.title);
    }

    const roleMatch = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    const barberMatch = document.cookie.match(new RegExp('(^| )barber_id=([^;]+)'));
    
    let currentRole = 'owner';
    let currentBarberId: string | undefined = undefined;

    if (roleMatch) {
      currentRole = roleMatch[2];
      setUserRole(currentRole);
    }
    if (barberMatch) {
      currentBarberId = barberMatch[2];
    }

    if (currentRole === 'barber' && currentBarberId) {
      setActiveBarberId(currentBarberId);
    }
  }, []);

  // --- Computed Events ---
  const filteredEvents = useMemo(() => {
    if (!activeBarberId) return events;
    return events.filter(e => e.extendedProps.barberId === activeBarberId);
  }, [events, activeBarberId]);

  // --- Upcoming List (Next 3 events) ---
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter(e => e.start > now)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 3);
  }, [events]);

  // --- Handlers ---

  // 1. Handle Date Selection on Main Calendar (Click & Drag)
  const handleDateSelect = (selectInfo: any) => {
    const calendarApi = selectInfo.view.calendar;
    
    // Prevent past booking (5 min buffer)
    if (selectInfo.start.getTime() < (new Date().getTime() - 300000)) {
      showAlert('error', 'Cannot book past time slots.');
      calendarApi.unselect(); 
      return;
    }

    setSelectedDate(selectInfo.start);
    setIsNewModalOpen(true);
    calendarApi.unselect();
  };

  // 2. Handle Date Click (Simple Click)
  const handleDateClick = (arg: any) => {
    if (arg.date.getTime() < (new Date().getTime() - 300000)) {
      showAlert('error', 'Cannot book past time slots.');
      return;
    }
    setSelectedDate(arg.date);
    setIsNewModalOpen(true);
  };

  // 3. Handle Mini Calendar Navigation
  const onMiniCalendarSelect = (value: Dayjs) => {
    const date = value.toDate();
    setSelectedDate(date);
    // Jump main calendar
    if (calendarRef.current) {
      calendarRef.current.getApi().gotoDate(date);
      setViewTitle(calendarRef.current.getApi().view.title);
    }
  };

  // 4. Calendar Navigation Buttons
  const handleCalendarNav = (direction: 'prev' | 'next' | 'today') => {
    if (!calendarRef.current) return;
    const api = calendarRef.current.getApi();
    api[direction]();
    setViewTitle(api.view.title);
    // Sync mini calendar selection state
    setSelectedDate(api.getDate());
  };

  // 5. Event Operations
  const handleEventClick = (clickInfo: any) => {
    setSelectedEvent(clickInfo.event);
    setIsDetailsModalOpen(true);
  };

  const handleSaveBooking = async (newBookingData: any) => {
    try {
      const res = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: newBookingData.extendedProps.service,
          barberId: newBookingData.extendedProps.barberId,
          shopId: newBookingData.extendedProps.shopId || null,
          date: newBookingData.start,
          amount: 0, 
          clientName: newBookingData.title, 
        })
      });
      if (res.ok) {
        showAlert('success', 'Appointment booked successfully!');
        fetchBookingsAndStaff();
        setIsNewModalOpen(false);
      } else {
        const errorData = await res.json();
        showAlert('error', errorData.error || 'Failed to save booking');
      }
    } catch(e) {
      showAlert('error', 'Error creating booking');
    }
  };

  // 6. Trigger Edit from Details Modal
  const handleEditClick = () => {
    setIsDetailsModalOpen(false); // 1. Close the details view
    
    // 2. Convert the FullCalendar event object back into a plain data object
    const rawEventData = {
      id: selectedEvent.id,
      title: selectedEvent.title,
      start: selectedEvent.start,
      end: selectedEvent.end,
      backgroundColor: selectedEvent.backgroundColor,
      borderColor: selectedEvent.borderColor,
      textColor: selectedEvent.textColor,
      extendedProps: { ...selectedEvent.extendedProps }
    };
    
    setEditingBooking(rawEventData); // 3. Pass data to the form state
    setIsNewModalOpen(true);         // 4. Open the New/Edit Booking Modal
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-6 p-4">
      
      {/* --- LEFT SIDEBAR (Control Panel) --- */}
      <div className="w-full lg:w-80 flex flex-col gap-4 h-full overflow-y-auto pr-1">
        


        {/* Mini Calendar Card */}
        <Card variant="borderless" className="shadow-sm rounded-2xl" styles={{ body: { padding: '10px' } }}>
          <div className="mini-cal-wrapper">
            <MiniCalendar 
              fullscreen={false} 
              onSelect={onMiniCalendarSelect}
              value={dayjs(selectedDate)}
              headerRender={({ value, onChange }) => {
                return (
                  <div className="flex justify-between items-center p-2 mb-2">
                    <span className="font-bold text-slate-700">{value.format('MMMM YYYY')}</span>
                    <div className="flex gap-1">
                      <Button size="small" type="text" icon={<LeftOutlined />} onClick={() => onChange(value.clone().subtract(1, 'month'))} />
                      <Button size="small" type="text" icon={<RightOutlined />} onClick={() => onChange(value.clone().add(1, 'month'))} />
                    </div>
                  </div>
                );
              }}
            />
          </div>
        </Card>

        {/* Staff Filter */}
        {userRole !== 'barber' && (
          <Card title={<span className="text-sm font-bold">Specialists</span>} variant="borderless" className="shadow-sm rounded-2xl" size="small">
            <div className="flex flex-col gap-2">
              <div 
                className={`p-2 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${!activeBarberId ? 'bg-purple-50 border border-purple-100' : 'hover:bg-slate-50'}`}
                onClick={() => setActiveBarberId(undefined)}
              >
                <Avatar icon={<UserOutlined />} className="bg-slate-300" />
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-700">All Specialists</div>
                  <div className="text-xs text-slate-400">View entire team</div>
                </div>
                {!activeBarberId && <div className="h-2 w-2 rounded-full bg-[#7C4DFF]" />}
              </div>

              {barbers.map(b => (
                <div 
                  key={b.id}
                  className={`p-2 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${activeBarberId === String(b.id) ? 'bg-purple-50 border border-purple-100' : 'hover:bg-slate-50'}`}
                  onClick={() => setActiveBarberId(String(b.id))}
                >
                  <Avatar style={{ backgroundColor: b.color }}>{b.name[0]}</Avatar>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-700">{b.name}</div>
                    <div className="text-xs text-slate-400">{b.role}</div>
                  </div>
                  {activeBarberId === String(b.id) && <div className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Upcoming Feed */}
        <Card title={<span className="text-sm font-bold">Up Next</span>} variant="borderless" className="shadow-sm rounded-2xl flex-1" size="small">
          {upcomingEvents.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No upcoming appointments" />
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingEvents.map(evt => (
                <div key={evt.id} className="flex gap-3 items-start border-b border-slate-50 pb-2 last:border-0">
                  <div className="bg-slate-100 rounded-lg p-2 text-center min-w-[50px]">
                    <div className="text-xs font-bold text-slate-500">{dayjs(evt.start).format('MMM')}</div>
                    <div className="text-lg font-black text-slate-800">{dayjs(evt.start).format('DD')}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold mb-0.5" style={{ color: evt.extendedProps.color }}>{dayjs(evt.start).format('h:mm A')}</div>
                    <div className="text-sm font-bold text-slate-800 leading-tight">{evt.title}</div>
                    <div className="text-xs text-slate-400 mt-1">{evt.extendedProps.service}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* --- RIGHT SIDE (Main Calendar) --- */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Custom Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white z-10 relative">
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <Button type="text" size="small" icon={<LeftOutlined />} onClick={() => handleCalendarNav('prev')} />
              <Button type="text" size="small" className="font-bold w-24" onClick={() => handleCalendarNav('today')}>Today</Button>
              <Button type="text" size="small" icon={<RightOutlined />} onClick={() => handleCalendarNav('next')} />
            </div>
            <Title level={4} style={{ margin: 0 }}>{viewTitle}</Title>
          </div>

          <div className="flex gap-2">
            <Input prefix={<SearchOutlined />} placeholder="Search event..." className="w-48 hidden md:flex rounded-lg" />
            <div className="bg-slate-100 p-1 rounded-lg flex">
              <Button 
                type={currentView === 'timeGridDay' ? 'default' : 'text'} 
                size="small" 
                onClick={() => { setCurrentView('timeGridDay'); calendarRef.current?.getApi().changeView('timeGridDay'); }}
                className={currentView === 'timeGridDay' ? 'font-bold text-[#7C4DFF]' : ''}
              >
                Day
              </Button>
              <Button 
                type={currentView === 'timeGridWeek' ? 'default' : 'text'} 
                size="small" 
                onClick={() => { setCurrentView('timeGridWeek'); calendarRef.current?.getApi().changeView('timeGridWeek'); }}
                className={currentView === 'timeGridWeek' ? 'font-bold text-[#7C4DFF]' : ''}
              >
                Week
              </Button>
              <Button 
                type={currentView === 'dayGridMonth' ? 'default' : 'text'} 
                size="small" 
                onClick={() => { setCurrentView('dayGridMonth'); calendarRef.current?.getApi().changeView('dayGridMonth'); }}
                className={currentView === 'dayGridMonth' ? 'font-bold text-[#7C4DFF]' : ''}
              >
                Month
              </Button>
            </div>
          </div>
        </div>

        {/* FullCalendar Instance */}
        <div className="flex-1 relative">
          <style jsx global>{`
            .fc {
              --fc-border-color: #f1f5f9;
              --fc-today-bg-color: #FBF7FF;
              --fc-event-bg-color: #7C4DFF;
              --fc-now-indicator-color: #7C4DFF;
            }
            .fc-col-header-cell { padding: 10px 0; background: #fff; }
            .fc-timegrid-slot { height: 3.5em !important; } 
            .fc-event { border: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
            .mini-cal-wrapper .ant-picker-calendar-full { background: transparent; }
            .mini-cal-wrapper .ant-picker-panel { background: transparent; }
          `}</style>
          
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridDay"
            height="100%"
            headerToolbar={false}
            allDaySlot={false}
            slotMinTime="08:00:00"
            slotMaxTime="21:00:00"
            slotDuration="00:15:00"
            
            selectable={true}
            editable={true}
            nowIndicator={true}
            
            events={filteredEvents}
            select={handleDateSelect}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            
            eventContent={(info) => (
              <div className="flex flex-col justify-center h-full px-2 py-1 border-l-4 border-black/20 overflow-hidden">
                <div className="text-[10px] opacity-90 flex items-center gap-1 font-medium">
                  <ClockCircleOutlined /> {info.timeText}
                </div>
                <div className="font-bold text-xs truncate leading-tight">{info.event.title}</div>
                {info.view.type !== 'dayGridMonth' && (
                  <div className="text-[10px] opacity-80 truncate">{info.event.extendedProps.service}</div>
                )}
              </div>
            )}
          />
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* 1. New Booking (Uses your provided component) */}
        <NewBookingModal 
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onSave={editingBooking ? async (data) => {/* Implement PUT here if needed */ setIsNewModalOpen(false); fetchBookingsAndStaff();} : handleSaveBooking}
          barbers={barbers}
          defaultDate={selectedDate}
          defaultBarberId={activeBarberId || undefined}
        />

      {/* 2. Simple Event Details (Inline for simplicity) */}
      <Modal
        title={<span className="font-bold">Booking Details</span>}
        open={isDetailsModalOpen}
        onCancel={() => setIsDetailsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailsModalOpen(false)}>Close</Button>,
          // ADDED the onClick handler here
          <Button key="edit" type="primary" ghost onClick={handleEditClick}>Edit</Button>
        ]}
      >
        {selectedEvent && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Client">{selectedEvent.title}</Descriptions.Item>
            <Descriptions.Item label="Service">{selectedEvent.extendedProps.service}</Descriptions.Item>
            <Descriptions.Item label="Branch">{selectedEvent.extendedProps.shop || 'Not specified'}</Descriptions.Item>
            <Descriptions.Item label="Time">
              {dayjs(selectedEvent.start).format('MMM D, h:mm A')} - {dayjs(selectedEvent.end).format('h:mm A')}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color="green">CONFIRMED</Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

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