"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import dayjs from "dayjs";
import Image from "next/image";
import {
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CalendarOutlined,
  LockOutlined,
  ScissorOutlined,
  HomeOutlined,
  ShoppingOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import DatePickerField from "@/components/ui/DatePickerField";
import SearchBar from "@/components/website/SearchBar";
import { useSearchFilter } from "@/hooks/useSearchFilter";
import { createBooking, getBookedSlots, getBookingPaymentStatus } from "@/lib/actions/booking";
import { thumbSource } from "@/lib/utils/image-url";
import {
  MAX_BOOKING_HORIZON_DAYS,
  SLOT_GRID,
  fitsOpeningHours,
  isShopOpenOnDay,
  isShopTemporarilyClosed,
  parseBookingDateTime,
  summarizeOpeningHours,
  todayHoursLabel,
  totalDurationMinutes,
} from "@/lib/services/booking-slots";

const STEP_LABELS = ["Branch", "Services", "Specialist", "Time", "Extras", "Pay"];

const fmtDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? (m ? `${h} h ${m} min` : `${h} h`) : `${m} min`;
};

// ── small building blocks ────────────────────────────────────────────────────

// The one control that moves you forward: pinned to the bottom of the screen so it is always in reach,
// with a live summary of what has been picked so far.
function StepBar({
  onBack, backLabel, summary, hint, primaryLabel, onPrimary, disabled, formId, busy,
}: {
  onBack?: () => void; backLabel?: string; summary?: React.ReactNode; hint?: string;
  primaryLabel: string; onPrimary?: () => void; disabled?: boolean; formId?: string; busy?: boolean;
}) {
  return (
    <div className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 md:mx-0 mt-8 bg-white dark:bg-zinc-950 border-t md:border border-zinc-200 dark:border-zinc-800 px-4 sm:px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center gap-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)]">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel || "Back"}
          className="h-12 shrink-0 px-3 sm:px-4 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-amber-500 hover:text-amber-600 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors"
        >
          <ArrowLeftOutlined />
          <span className="hidden sm:inline">{backLabel || "Back"}</span>
        </button>
      )}
      <div className="min-w-0 flex-1 leading-tight">
        {summary && <div className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-200 font-semibold truncate">{summary}</div>}
        {disabled && hint && <div className="text-[11px] sm:text-xs text-amber-600 dark:text-amber-500 mt-0.5">{hint}</div>}
      </div>
      <button
        type={formId ? "submit" : "button"}
        form={formId}
        onClick={onPrimary}
        disabled={disabled || busy}
        className={`h-12 shrink-0 inline-flex items-center justify-center gap-2 px-5 sm:px-8 font-bold uppercase tracking-widest text-xs sm:text-sm transition-all ${
          disabled || busy
            ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed"
            : "bg-amber-600 text-white dark:text-zinc-950 hover:bg-amber-700 dark:hover:bg-amber-500 shadow-lg shadow-amber-600/20"
        }`}
      >
        {busy ? <LoadingOutlined /> : null}
        {primaryLabel}
        {!busy && <ArrowRightOutlined />}
      </button>
    </div>
  );
}

function StepTitle({ icon, title, hint }: { icon: React.ReactNode; title: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 text-zinc-900 dark:text-white">
        <span className="text-amber-600 dark:text-amber-500">{icon}</span>
        {title}
      </h2>
      {hint && <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">{hint}</p>}
    </div>
  );
}

function Check({ selected }: { selected: boolean }) {
  return (
    <span className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selected ? "border-amber-500 bg-amber-500 text-white" : "border-zinc-300 dark:border-zinc-700 text-transparent"}`}>
      <CheckCircleFilled className="text-sm" />
    </span>
  );
}

// Small round/square picture (or a placeholder icon): never a big photo, the list has to be quick to scan.
function Thumb({ src, alt, icon, round }: { src?: string | null; alt: string; icon: React.ReactNode; round?: boolean }) {
  const thumb = src ? thumbSource(src, 96) : null;
  return (
    <span className={`shrink-0 w-11 h-11 overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 ${round ? "rounded-full" : "rounded-md"}`}>
      {thumb ? (
        <Image src={thumb.src} alt={alt} width={44} height={44} sizes="44px" unoptimized={thumb.unoptimized} loading="lazy" className="w-full h-full object-cover" />
      ) : (
        icon
      )}
    </span>
  );
}

const rowClass = (selected: boolean, disabled?: boolean) =>
  `w-full text-left flex items-center gap-3 px-3 sm:px-4 py-3 border transition-colors duration-200 ${
    disabled
      ? "opacity-50 cursor-not-allowed border-zinc-200 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/40"
      : selected
        ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10 cursor-pointer"
        : "border-zinc-200 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/60 hover:border-amber-500/60 cursor-pointer"
  }`;

// ── page ─────────────────────────────────────────────────────────────────────

export interface BookingInitialData {
  barbers: any[];
  services: any[];
  shops: any[];
  products: any[];
  contact: { hasPhone: boolean; maskedPhone: string };
}

export default function BookingClient({ initial }: { initial: BookingInitialData }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  // Data State
  const { barbers, services, products, shops } = initial;

  // Selection State
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<any | null>(null);
  // A single open branch needs no choosing
  const [selectedShop, setSelectedShop] = useState<any | null>(() => {
    const open = initial.shops.filter((sh: any) => !isShopTemporarilyClosed(sh));
    return initial.shops.length === 1 && open.length === 1 ? open[0] : null;
  });
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Date and Time locking
  const [bookingDate, setBookingDate] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  // Payment state
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  // Mobile number for SMS updates: only asked when the account has none saved yet
  const [phone, setPhone] = useState("");
  // Asked only when the customer's account has no number yet (the database decides, see getBookingContact)
  const [hasSavedPhone, setHasSavedPhone] = useState(initial.contact.hasPhone);
  const [maskedPhone, setMaskedPhone] = useState(initial.contact.maskedPhone);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  // 'form' = collecting address/starting checkout, 'confirming' = PayHere popup closed and we're
  // waiting for the server-side webhook to confirm, 'timeout' = webhook hasn't landed yet
  const [paymentPhase, setPaymentPhase] = useState<'form' | 'confirming' | 'timeout'>('form');

  // Search inside the lists
  const serviceSearch = useSearchFilter(services, (s) => [s.name, s.description, s.price]);
  const productSearch = useSearchFilter(products, (p) => [p.name, p.brand, p.category, p.description, p.price]);

  useEffect(() => {
    // Client-side guard (the middleware already redirects visitors who are not signed in)
    const roleCookie = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    if (!roleCookie || !roleCookie[2]) window.location.href = '/login?callbackUrl=/booking';
  }, []);

  // Every step starts at the top of the page
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const visitMinutes = useMemo(() => totalDurationMinutes(selectedServices), [selectedServices]);

  // ── opening hours ──
  const today = useMemo(() => dayjs().startOf("day"), []);
  const maxDate = useMemo(() => today.add(MAX_BOOKING_HORIZON_DAYS, "day"), [today]);
  const isClosedDay = (d: dayjs.Dayjs) => !isShopOpenOnDay(selectedShop, d.toDate());

  const isSlotPassed = (slot: string, dateStr: string) => {
    const start = parseBookingDateTime(dateStr, slot);
    return !start || start.getTime() < Date.now();
  };
  // Times the branch is closed for (closed day, before opening, or a visit that would run past closing
  // time) stay on screen but are blocked and marked "Closed"
  const isSlotClosed = (slot: string, dateStr: string) => {
    const start = parseBookingDateTime(dateStr, slot);
    return !start || !fitsOpeningHours(selectedShop, start, visitMinutes);
  };
  const hasFreeTime = (d: dayjs.Dayjs) => {
    const ds = d.format("YYYY-MM-DD");
    return SLOT_GRID.some((slot) => !isSlotClosed(slot, ds) && !isSlotPassed(slot, ds));
  };

  // The next few days this branch can actually take a booking: one tap to pick a day
  const quickDays = useMemo(() => {
    if (!selectedShop) return [];
    const out: dayjs.Dayjs[] = [];
    for (let i = 0; i <= MAX_BOOKING_HORIZON_DAYS && out.length < 7; i++) {
      const d = today.add(i, "day");
      if (isClosedDay(d) || !hasFreeTime(d)) continue;
      out.push(d);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShop, visitMinutes, today]);

  // Arriving at the time step: start on the first day that can really be booked
  useEffect(() => {
    if (step !== 4 || !selectedShop) return;
    const current = bookingDate ? dayjs(bookingDate, "YYYY-MM-DD") : null;
    if (current && !current.isBefore(today, "day") && !isClosedDay(current) && hasFreeTime(current)) return;
    if (quickDays.length) { setBookingDate(quickDays[0].format("YYYY-MM-DD")); setSelectedSlot(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selectedShop, visitMinutes]);

  // Fetch booked slots whenever the date or barber changes
  useEffect(() => {
    const loadBookedSlots = async () => {
      if (step !== 4 || !selectedBarber || !bookingDate) return;
      setIsFetchingSlots(true);
      try {
        // A long service (e.g. a 90-minute colour) also blocks the slots that follow an existing booking
        const slots = await getBookedSlots(selectedBarber.id, bookingDate, visitMinutes || undefined);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selectedBarber, bookingDate, visitMinutes]);

  const toggleService = (service: any) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id);
      if (exists) {
        return prev.filter(s => s.id !== service.id);
      }
      return [...prev, service];
    });
    setSelectedSlot(null); // the visit length changed, so the chosen time may no longer fit
  };

  const toggleProduct = (product: any) => {
    if (product.stock <= 0) return;
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const calculateTotalAmount = () => {
    const servicesTotal = selectedServices.reduce((sum, service) => sum + service.price, 0);
    const productsTotal = selectedProducts.reduce((sum, product) => sum + product.price, 0);
    return servicesTotal + productsTotal;
  };

  // Polls the server for the webhook-confirmed outcome after the PayHere popup closes. The
  // popup's own onCompleted callback is never trusted as proof of payment — only this
  // server-verified status (ultimately set by the signed PayHere notify webhook) can advance
  // the booking to the success screen.
  const pollPaymentStatus = async (bookingId: string) => {
    const maxAttempts = 15; // ~30s at 2s intervals
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      try {
        const res = await getBookingPaymentStatus(bookingId);
        if (res.success) {
          if (res.bookingStatus === 'CONFIRMED') {
            setIsProcessing(false);
            setStep(7);
            return;
          }
          if (res.bookingStatus === 'CANCELLED') {
            setIsProcessing(false);
            setPaymentPhase('form');
            setErrorMessage("Payment was not completed. Please try again.");
            return;
          }
        }
      } catch (err) {
        console.error("Failed to poll payment status", err);
      }
    }
    // Still PENDING after the poll window — the webhook may just be delayed, not necessarily failed
    setIsProcessing(false);
    setPaymentPhase('timeout');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (selectedServices.length === 0 || !selectedBarber || !selectedSlot) {
      setErrorMessage("Please complete all previous steps.");
      return;
    }

    // An address is only needed when products are part of the order
    const hasProducts = selectedProducts.length > 0;
    if (hasProducts && (!address.trim() || !city.trim())) {
      setErrorMessage("Please enter your delivery address and city to continue to payment.");
      return;
    }

    if (!hasSavedPhone && !/^(?:\+?94|0)?7[0-8]\d{7}$/.test(phone.replace(/[\s-]/g, ''))) {
      setErrorMessage("Please enter a valid mobile number (e.g. 077 123 4567) so we can send your booking updates.");
      return;
    }

    const payhere = (window as any).payhere;
    if (!payhere) {
      setErrorMessage("Payment system is still loading. Please wait a moment and try again.");
      return;
    }

    setIsProcessing(true);

    const payload = {
      serviceIds: selectedServices.map(s => s.id),
      productIds: selectedProducts.map(p => p.id),
      barberId: selectedBarber.id,
      shopId: selectedShop?.id,
      date: bookingDate,
      time: selectedSlot,
      address: hasProducts ? address : undefined,
      city: hasProducts ? city : undefined,
      phone: hasSavedPhone ? undefined : phone,
    };

    const result = await createBooking(payload);

    if (!result.success || !result.payhere) {
      setErrorMessage(result.message || "Could not start payment. Please try again.");
      setIsProcessing(false);
      return;
    }

    if (result.phoneSaved) { setHasSavedPhone(true); setMaskedPhone(''); }
    const bookingId = result.bookingId;

    payhere.onCompleted = function () {
      // Only drives UI state — the actual confirmation comes from the poll below, which reflects
      // the server-verified webhook outcome, not this client-side callback.
      setPaymentPhase('confirming');
      pollPaymentStatus(bookingId);
    };

    payhere.onDismissed = function () {
      setIsProcessing(false);
      setErrorMessage("Payment was not completed.");
    };

    payhere.onError = function (error: string) {
      console.error("PayHere error:", error);
      setIsProcessing(false);
      setErrorMessage("Something went wrong with the payment. Please try again.");
    };

    payhere.startPayment(result.payhere);
  };

  const totalAmount = calculateTotalAmount();
  const openSlotCount = bookingDate ? SLOT_GRID.filter((slot) => !isSlotClosed(slot, bookingDate)).length : 0;
  const selectedDay = bookingDate ? dayjs(bookingDate, "YYYY-MM-DD") : null;
  const dayIsBookable = !!selectedDay && !selectedDay.isBefore(today, "day") && !isClosedDay(selectedDay);
  const hoursText = summarizeOpeningHours(selectedShop);
  const servicesSummary = selectedServices.length
    ? `${selectedServices.length} service${selectedServices.length > 1 ? "s" : ""} · ${fmtDuration(visitMinutes)} · LKR ${selectedServices.reduce((a, s) => a + s.price, 0).toLocaleString()}`
    : "";
  const whenText = selectedDay && selectedSlot ? `${selectedDay.format("ddd D MMM")} · ${selectedSlot}` : "";

  const goTo = (n: number) => setStep(n);

  return (
    <div className="relative flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-amber-600 selection:text-white font-sans transition-colors duration-500 overflow-x-clip">

      <Script src="https://www.payhere.lk/lib/payhere-2.0.js" strategy="afterInteractive" />

      {/* Soft glow as a plain gradient (no blur filter: those are very slow to paint on phones) */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_10%_15%,rgba(245,158,11,0.08),transparent_35%),radial-gradient(circle_at_90%_85%,rgba(59,130,246,0.05),transparent_35%)]"></div>

      <div className="relative z-10 max-w-3xl mx-auto w-full pt-6 pb-0 md:pt-16 px-4 sm:px-6 flex-grow flex flex-col">

        {/* Header + progress */}
        <div ref={topRef} className="scroll-mt-24 mb-6 md:mb-8">
          <h3 className="text-amber-600 dark:text-amber-500 font-bold tracking-[0.3em] uppercase text-[11px] mb-2">Reservation</h3>
          <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white">
            Book Your <span className="font-serif italic font-light text-zinc-500">Session</span>
          </h1>
          {step <= 6 && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                <span>Step {step} of 6 · <span className="text-amber-600 dark:text-amber-500">{STEP_LABELS[step - 1]}</span></span>
                <span className="hidden sm:inline">{STEP_LABELS.slice(0, 6).map((l, i) => (
                  <span key={l} className={i + 1 <= step ? "text-zinc-700 dark:text-zinc-300" : ""}>{i ? " › " : ""}{l}</span>
                ))}</span>
              </div>
              <div className="flex gap-1.5" aria-hidden="true">
                {STEP_LABELS.map((l, i) => (
                  <div key={l} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i + 1 <= step ? "bg-amber-600 dark:bg-amber-500" : "bg-zinc-200 dark:bg-zinc-800"}`} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-grow flex flex-col">

          {/* Step 1: Branch */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col flex-grow">
              <StepTitle icon={<HomeOutlined />} title="Select a branch" hint="Choose the location most convenient for you." />
              <div className="flex flex-col gap-3" role="radiogroup" aria-label="Branch">
                {shops.map((shop) => {
                  const isSelected = selectedShop?.id === shop.id;
                  const closed = isShopTemporarilyClosed(shop);
                  const summary = summarizeOpeningHours(shop);
                  return (
                    <button
                      key={shop.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={closed}
                      onClick={() => { setSelectedShop(shop); setSelectedSlot(null); setTimeout(() => goTo(2), 250); }}
                      className={`${rowClass(isSelected, closed)} py-4`}
                    >
                      <span className="shrink-0 w-11 h-11 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-500 flex items-center justify-center text-lg"><HomeOutlined /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-zinc-900 dark:text-white truncate">{shop.name}</span>
                        {shop.address && <span className="block text-sm text-zinc-500 dark:text-zinc-400 truncate">{shop.address}</span>}
                        <span className={`block text-xs mt-1 font-semibold ${closed ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>{todayHoursLabel(shop)}</span>
                        {summary && !closed && <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{summary}</span>}
                      </span>
                      <Check selected={isSelected} />
                    </button>
                  );
                })}
                {shops.length === 0 && <div className="py-12 text-center text-zinc-500">No branches are open for booking right now.</div>}
              </div>
              <StepBar
                summary={selectedShop?.name}
                hint="Tap a branch to continue"
                disabled={!selectedShop}
                primaryLabel="Continue"
                onPrimary={() => goTo(2)}
              />
            </div>
          )}

          {/* Step 2: Services */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col flex-grow">
              <StepTitle icon={<ScissorOutlined />} title="Select your services" hint="Pick one or more." />
              {services.length > 5 && (
                <SearchBar
                  className="mb-4"
                  value={serviceSearch.query}
                  onChange={serviceSearch.setQuery}
                  placeholder="Search services"
                  resultText={`${serviceSearch.filtered.length} of ${services.length} services`}
                />
              )}
              <div className="flex flex-col gap-2" role="group" aria-label="Services">
                {serviceSearch.filtered.map((s) => {
                  const isSelected = selectedServices.some(selected => selected.id === s.id);
                  return (
                    <button key={s.id} type="button" role="checkbox" aria-checked={isSelected} onClick={() => toggleService(s)} className={rowClass(isSelected)}>
                      <Thumb src={s.imageUrl} alt="" icon={<ScissorOutlined />} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-zinc-900 dark:text-white truncate">{s.name}</span>
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {fmtDuration(s.duration || 30)}{s.description ? ` · ${s.description}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-mono text-sm text-amber-600 dark:text-amber-500 whitespace-nowrap">LKR {s.price.toLocaleString()}</span>
                      </span>
                      <Check selected={isSelected} />
                    </button>
                  );
                })}
                {services.length === 0 && <div className="py-12 text-center text-zinc-500">No services are available right now.</div>}
                {services.length > 0 && serviceSearch.filtered.length === 0 && (
                  <div className="py-10 text-center text-zinc-500 text-sm">
                    Nothing matches &ldquo;{serviceSearch.query}&rdquo;.{" "}
                    <button type="button" onClick={() => serviceSearch.setQuery("")} className="text-amber-600 font-bold underline">Clear</button>
                  </div>
                )}
              </div>
              <StepBar
                onBack={() => goTo(1)}
                backLabel="Branch"
                summary={servicesSummary}
                hint="Select at least one service"
                disabled={selectedServices.length === 0}
                primaryLabel="Continue"
                onPrimary={() => goTo(3)}
              />
            </div>
          )}

          {/* Step 3: Specialist */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col flex-grow">
              <StepTitle icon={<UserOutlined />} title="Choose your specialist" hint={selectedShop ? `Available at ${selectedShop.name}.` : undefined} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" aria-label="Specialist">
                {barbers.filter(b => !selectedShop || b.shopId === selectedShop.id || !b.shopId).map((b) => {
                  const isSelected = selectedBarber?.id === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => { setSelectedBarber(b); setSelectedSlot(null); setTimeout(() => goTo(4), 250); }}
                      className={rowClass(isSelected)}
                    >
                      <Thumb src={b.imageUrl} alt="" icon={<UserOutlined />} round />
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-zinc-900 dark:text-white truncate">{b.name}</span>
                        <span className="block text-[11px] uppercase tracking-widest text-amber-600 dark:text-amber-500">{b.role === 'OWNER' ? 'Master Stylist' : 'Senior Barber'}</span>
                      </span>
                      <Check selected={isSelected} />
                    </button>
                  );
                })}
                {barbers.filter(b => !selectedShop || b.shopId === selectedShop.id || !b.shopId).length === 0 && (
                  <div className="col-span-full py-12 text-center text-zinc-500">No specialists are available at this branch yet.</div>
                )}
              </div>
              <StepBar
                onBack={() => goTo(2)}
                backLabel="Services"
                summary={selectedBarber ? `With ${selectedBarber.name}` : servicesSummary}
                hint="Tap a specialist to continue"
                disabled={!selectedBarber}
                primaryLabel="Continue"
                onPrimary={() => goTo(4)}
              />
            </div>
          )}

          {/* Step 4: Date & time */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col flex-grow">
              <StepTitle icon={<CalendarOutlined />} title="Pick a day and time" hint={selectedBarber ? `${fmtDuration(visitMinutes)} with ${selectedBarber.name}` : undefined} />

              {/* Opening hours of the chosen branch, so nobody picks a time the branch is closed */}
              {selectedShop && (
                <div className="mb-5 flex items-start gap-3 px-4 py-3 border border-amber-500/30 bg-amber-500/5 text-sm">
                  <InfoCircleOutlined className="text-amber-600 dark:text-amber-500 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-bold text-zinc-900 dark:text-white truncate">{selectedShop.name}</div>
                    <div className="text-zinc-600 dark:text-zinc-400 text-[13px] leading-snug">{hoursText || "Opening hours not set."}</div>
                  </div>
                </div>
              )}

              {/* One-tap days */}
              {quickDays.length > 0 && (
                <div className="mb-4">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Next available days</div>
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" role="group" aria-label="Next available days">
                    {quickDays.map((d) => {
                      const ds = d.format("YYYY-MM-DD");
                      const active = ds === bookingDate;
                      return (
                        <button
                          key={ds}
                          type="button"
                          aria-pressed={active}
                          onClick={() => { setBookingDate(ds); setSelectedSlot(null); }}
                          className={`shrink-0 w-[4.25rem] py-2.5 border text-center transition-colors ${active ? "border-amber-500 bg-amber-600 text-white" : "border-zinc-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/60 hover:border-amber-500"}`}
                        >
                          <span className="block text-[10px] uppercase tracking-widest opacity-80">{d.isSame(today, "day") ? "Today" : d.format("ddd")}</span>
                          <span className="block text-lg font-black leading-tight">{d.date()}</span>
                          <span className="block text-[10px] uppercase tracking-widest opacity-80">{d.format("MMM")}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mb-5">
                <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Or choose another date</div>
                <div className="w-full sm:w-72">
                  <DatePickerField
                    value={bookingDate}
                    onChange={(v) => { setBookingDate(v); setSelectedSlot(null); }}
                    isDateClosed={isClosedDay}
                    maxDate={maxDate}
                    disabledHint="Struck-through days are closed."
                  />
                </div>
              </div>

              <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-3">
                Available times {selectedDay ? `· ${selectedDay.format("ddd D MMM")}` : ""}
                {isFetchingSlots && <span className="text-amber-500 animate-pulse normal-case tracking-normal font-normal">Checking availability...</span>}
              </div>

              {!bookingDate ? (
                <div className="text-center py-8 text-sm text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-800">Pick a day to see the available times.</div>
              ) : selectedDay?.isBefore(today, "day") ? (
                <div className="text-center py-8 px-4 text-sm text-zinc-600 dark:text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-800">
                  That day has passed. Please pick today or a later day.
                </div>
              ) : (
                <>
                  {/* Why nothing can be booked on this day */}
                  {isClosedDay(selectedDay!) ? (
                    <div role="alert" className="mb-3 px-4 py-3 border border-red-500/30 bg-red-500/10 text-sm font-semibold text-red-600 dark:text-red-400">
                      {isShopTemporarilyClosed(selectedShop)
                        ? `${selectedShop?.name} is temporarily closed.`
                        : `${selectedShop?.name || "This branch"} is closed on ${selectedDay?.format("dddd")}s. Please pick another day.`}
                    </div>
                  ) : openSlotCount === 0 ? (
                    <div role="alert" className="mb-3 px-4 py-3 border border-amber-500/30 bg-amber-500/10 text-sm text-zinc-700 dark:text-zinc-300">
                      A {fmtDuration(visitMinutes)} visit does not fit {selectedShop?.name}&apos;s opening hours on this day. Please pick another day.
                    </div>
                  ) : null}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Available times">
                    {SLOT_GRID.map((slot) => {
                      const isClosed = isSlotClosed(slot, bookingDate);
                      const isBooked = !isClosed && bookedSlots.includes(slot);
                      const isPassed = !isClosed && isSlotPassed(slot, bookingDate);
                      const isDisabled = isClosed || isBooked || isPassed;
                      const isSelected = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          aria-label={`${slot}${isClosed ? " closed" : isBooked ? " booked" : isPassed ? " passed" : ""}`}
                          onClick={() => !isDisabled && setSelectedSlot(slot)}
                          disabled={isDisabled}
                          className={`h-14 px-1 border flex flex-col items-center justify-center text-sm font-bold tracking-wide transition-colors ${
                            isClosed
                              ? "border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 text-red-300 dark:text-red-900 cursor-not-allowed"
                              : isDisabled
                                ? "border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                                : isSelected
                                  ? "border-amber-500 bg-amber-600 text-white shadow-md shadow-amber-500/20"
                                  : "border-zinc-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:border-amber-500"
                          }`}
                        >
                          <span className={isDisabled ? "line-through" : ""}>{slot}</span>
                          {isClosed ? <span className="text-[10px] font-normal">Closed</span> : isBooked ? <span className="text-[10px] font-normal">Booked</span> : isPassed ? <span className="text-[10px] font-normal">Passed</span> : null}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              <StepBar
                onBack={() => goTo(3)}
                backLabel="Specialist"
                summary={whenText || servicesSummary}
                hint={!bookingDate || !dayIsBookable ? "Pick a day the branch is open" : "Pick a time to continue"}
                disabled={!bookingDate || !dayIsBookable || !selectedSlot}
                primaryLabel="Continue"
                onPrimary={() => goTo(5)}
              />
            </div>
          )}

          {/* Step 5: Product add-ons */}
          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col flex-grow">
              <StepTitle icon={<ShoppingOutlined />} title={<>Add products <span className="text-sm font-normal text-zinc-500">(optional)</span></>} hint="Grooming essentials to pick up with your appointment." />
              {products.length > 5 && (
                <SearchBar
                  className="mb-4"
                  value={productSearch.query}
                  onChange={productSearch.setQuery}
                  placeholder="Search products"
                  resultText={`${productSearch.filtered.length} of ${products.length} products`}
                />
              )}
              <div className="flex flex-col gap-2" role="group" aria-label="Products">
                {productSearch.filtered.map((p) => {
                  const isSelected = selectedProducts.some(selected => selected.id === p.id);
                  const isOutOfStock = p.stock <= 0;
                  return (
                    <button key={p.id} type="button" role="checkbox" aria-checked={isSelected} disabled={isOutOfStock} onClick={() => toggleProduct(p)} className={rowClass(isSelected, isOutOfStock)}>
                      <Thumb src={p.imageUrl} alt="" icon={<ShoppingOutlined />} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-zinc-900 dark:text-white truncate">{p.name}</span>
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {isOutOfStock ? "Out of stock" : [p.brand, p.category].filter(Boolean).join(" · ") || "In stock"}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-sm text-amber-600 dark:text-amber-500 whitespace-nowrap">LKR {p.price.toLocaleString()}</span>
                      <Check selected={isSelected} />
                    </button>
                  );
                })}
                {products.length === 0 && <div className="py-12 text-center text-zinc-500">No products are available right now. You can continue.</div>}
                {products.length > 0 && productSearch.filtered.length === 0 && (
                  <div className="py-10 text-center text-zinc-500 text-sm">
                    Nothing matches &ldquo;{productSearch.query}&rdquo;.{" "}
                    <button type="button" onClick={() => productSearch.setQuery("")} className="text-amber-600 font-bold underline">Clear</button>
                  </div>
                )}
              </div>
              <StepBar
                onBack={() => goTo(4)}
                backLabel="Time"
                summary={selectedProducts.length ? `${selectedProducts.length} product${selectedProducts.length > 1 ? "s" : ""} added` : whenText}
                primaryLabel={selectedProducts.length > 0 ? "Continue" : "Skip"}
                onPrimary={() => goTo(6)}
              />
            </div>
          )}

          {/* Step 6: Checkout & payment */}
          {step === 6 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col flex-grow">
              {paymentPhase === 'confirming' && (
                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/60 p-6 sm:p-10 shadow-lg dark:shadow-none text-center">
                  <LoadingOutlined className="text-4xl text-amber-500 mb-6" />
                  <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white mb-3">Confirming your payment...</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Please don&apos;t close this page — this only takes a few seconds.</p>
                </div>
              )}

              {paymentPhase === 'timeout' && (
                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/60 p-6 sm:p-10 shadow-lg dark:shadow-none text-center">
                  <ClockCircleOutlined className="text-4xl text-amber-500 mb-6" />
                  <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white mb-3">Still confirming your payment</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">This is taking longer than usual. If the payment succeeded, it&apos;ll show up in My Bookings shortly.</p>
                  <button
                    onClick={() => router.push('/profile')}
                    className="border border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 py-3 px-8 font-bold uppercase tracking-widest text-xs hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-950 transition-colors"
                  >
                    Go to My Bookings
                  </button>
                </div>
              )}

              {paymentPhase === 'form' && (
                <>
                  <StepTitle icon={<LockOutlined />} title="Review & pay" />

                  {/* Your booking */}
                  <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 mb-5">
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex justify-between gap-4"><span className="text-zinc-500 shrink-0">Branch</span><span className="font-semibold text-right">{selectedShop?.name}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-zinc-500 shrink-0">Specialist</span><span className="font-semibold text-right">{selectedBarber?.name}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-zinc-500 shrink-0">When</span><span className="font-semibold text-right">{selectedDay?.format("dddd, D MMMM")} · {selectedSlot}</span></div>
                    </div>
                    <div className="border-t border-zinc-200 dark:border-zinc-800 mt-3 pt-3 flex flex-col gap-2 text-sm">
                      {selectedServices.map(s => (
                        <div key={s.id} className="flex justify-between gap-4"><span className="text-zinc-600 dark:text-zinc-400">{s.name}</span><span className="font-medium whitespace-nowrap">LKR {s.price.toLocaleString()}</span></div>
                      ))}
                      {selectedProducts.map(p => (
                        <div key={p.id} className="flex justify-between gap-4"><span className="text-zinc-600 dark:text-zinc-400">{p.name}</span><span className="font-medium whitespace-nowrap">LKR {p.price.toLocaleString()}</span></div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                      <span className="font-bold">Total</span>
                      <span className="font-black text-lg text-amber-600 dark:text-amber-500">LKR {totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {errorMessage && (
                    <div role="alert" className="mb-5 p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm font-bold tracking-wide">
                      {errorMessage}
                    </div>
                  )}

                  <form id="payment-form" onSubmit={handlePaymentSubmit} className="space-y-4">
                    {selectedProducts.length > 0 && (
                      <>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          Your order includes products, so we need a delivery address.
                        </p>
                        <div className="space-y-1.5">
                          <label htmlFor="bk-address" className="text-xs font-bold uppercase tracking-widest text-zinc-500">Address <span className="text-red-500">*</span></label>
                          <input
                            id="bk-address"
                            type="text"
                            required
                            autoComplete="street-address"
                            placeholder="123 Galle Road"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full h-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-base px-4 outline-none focus:border-amber-500 transition-colors"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="bk-city" className="text-xs font-bold uppercase tracking-widest text-zinc-500">City <span className="text-red-500">*</span></label>
                          <input
                            id="bk-city"
                            type="text"
                            required
                            autoComplete="address-level2"
                            placeholder="Colombo"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full h-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-base px-4 outline-none focus:border-amber-500 transition-colors"
                          />
                        </div>
                      </>
                    )}

                    {!hasSavedPhone && (
                      <div className="space-y-1.5">
                        <label htmlFor="bk-phone" className="text-xs font-bold uppercase tracking-widest text-zinc-500">Mobile Number <span className="text-red-500">*</span></label>
                        <input
                          id="bk-phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          required
                          placeholder="077 123 4567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full h-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-base px-4 outline-none focus:border-amber-500 transition-colors"
                        />
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">We&apos;ll text your booking updates to this number and save it to your account.</p>
                      </div>
                    )}

                    {selectedProducts.length === 0 && hasSavedPhone && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        No extra details needed. We&apos;ll send your confirmation by email and SMS
                        {maskedPhone ? <> (to <strong className="font-semibold whitespace-nowrap">{maskedPhone}</strong>)</> : null} once your payment goes through.
                      </p>
                    )}
                    {selectedProducts.length > 0 && hasSavedPhone && maskedPhone && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Booking updates will be texted to <strong className="font-semibold whitespace-nowrap">{maskedPhone}</strong>.</p>
                    )}

                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                      &ldquo;Pay&rdquo; opens PayHere&apos;s secure checkout: your card details are entered there, never on this page. By paying you agree to our{' '}
                      <a href="/terms-conditions" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-600">Terms &amp; Conditions</a>,{' '}
                      <a href="/refund-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-600">Refund Policy</a> and{' '}
                      <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-600">Privacy Policy</a>.
                    </p>

                    <div className="flex items-center justify-center gap-2 p-3 border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
                      <LockOutlined className="text-emerald-500" />
                      <span className="text-xs font-bold text-zinc-400">SECURED BY</span>
                      <span className="text-sm font-black text-[#122b78]">Pay<span className="text-[#00a651]">Here</span></span>
                    </div>
                  </form>

                  <StepBar
                    onBack={() => goTo(5)}
                    backLabel="Extras"
                    summary={`Total LKR ${totalAmount.toLocaleString()}`}
                    primaryLabel={isProcessing ? "Opening PayHere" : "Pay now"}
                    formId="payment-form"
                    busy={isProcessing}
                  />
                </>
              )}
            </div>
          )}

          {/* Success Step */}
          {step === 7 && (
            <div className="animate-in zoom-in-95 fade-in duration-500 flex flex-col items-center justify-center py-8">
              <div className="w-full max-w-lg bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/60 p-6 sm:p-10 shadow-2xl dark:shadow-none text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>

                <div className="flex justify-center mb-6 relative z-10">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-500 shadow-inner">
                    <CheckCircleFilled className="text-4xl drop-shadow-md" />
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mb-2 relative z-10">Payment successful</h2>
                <p className="text-zinc-500 dark:text-zinc-400 font-light mb-8 relative z-10">Your appointment is confirmed and paid. We&apos;ve sent the details by email and SMS.</p>

                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 text-left relative z-10 mb-8 text-sm">
                  <div className="flex justify-between gap-4"><span className="text-zinc-500">Branch</span><strong className="text-right">{selectedShop?.name}</strong></div>
                  <div className="flex justify-between gap-4"><span className="text-zinc-500">Specialist</span><strong className="text-right">{selectedBarber?.name}</strong></div>
                  <div className="flex justify-between gap-4"><span className="text-zinc-500">Services</span><strong className="text-right">{selectedServices.map(s => s.name).join(", ")}</strong></div>
                  {selectedProducts.length > 0 && (
                    <div className="flex justify-between gap-4"><span className="text-zinc-500">Products</span><strong className="text-right">{selectedProducts.map(p => p.name).join(", ")}</strong></div>
                  )}
                  <div className="flex justify-between gap-4"><span className="text-zinc-500">Date</span><strong>{selectedDay?.format("ddd, D MMM YYYY")}</strong></div>
                  <div className="flex justify-between gap-4"><span className="text-zinc-500">Time</span><strong>{selectedSlot}</strong></div>
                  <div className="flex justify-between gap-4 pt-3 border-t border-dashed border-zinc-300 dark:border-zinc-700"><span className="text-zinc-500">Paid</span><strong className="text-amber-600 dark:text-amber-500">LKR {totalAmount.toLocaleString()}</strong></div>
                </div>

                <button
                  onClick={() => router.push('/profile')}
                  className="w-full h-12 border border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-bold uppercase tracking-widest text-xs hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-950 transition-colors relative z-10"
                >
                  View my appointments
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
