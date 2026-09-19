"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Badge, Button, Popover, Typography, Avatar, notification, Modal, Switch } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import {
  BellOutlined,
  CalendarOutlined,
  ShoppingOutlined,
  WarningOutlined,
  DollarOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { linkFor } from '@/lib/notification-links';
import { readSession, SESSION_REFRESHED_EVENT } from '@/hooks/useAccess';

dayjs.extend(relativeTime);

const { Text } = Typography;

const SOUND_KEY = 'polaa_notification_sound';
const POLL_MS = 5000;

interface AppNotification {
  id: string;
  title: string;
  desc: string;
  read: boolean;
  createdAt: string;
  refType?: string | null; // what it is about (BOOKING, ORDER, PRODUCT, PAYMENT ...), so a click can open that record
  refId?: string | null;
}

// Things that need the owner to DO something get a more insistent tone
const isUrgent = (n: Pick<AppNotification, 'title'>) => /action needed|refund|out of stock|oversold|chargeback|mismatch/i.test(n.title);

// Where a notification takes you: the exact record it is about, if this person may open it (null = nowhere to go).
// Older notifications have no record attached, so they fall back to the right page by their wording.
function targetFor(n: Pick<AppNotification, 'title' | 'refType' | 'refId'>): string | null {
  const { role, rows } = readSession();
  if (n.refType) return linkFor(n.refType, n.refId, role, rows);
  const t = n.title.toLowerCase();
  const type = t.includes('stock') ? 'PRODUCT' : t.includes('order') || t.includes('oversold') ? 'ORDER' : t.includes('payment') && !t.includes('not completed') ? 'PAYMENT' : 'BOOKING';
  return linkFor(type, null, role, rows);
}

function iconFor(n: Pick<AppNotification, 'title'>) {
  const t = n.title.toLowerCase();
  if (isUrgent(n)) return <WarningOutlined style={{ color: '#DC2626' }} />;
  if (t.includes('stock') || t.includes('order')) return <ShoppingOutlined style={{ color: '#F59E0B' }} />;
  if (t.includes('payment')) return <DollarOutlined style={{ color: '#10B981' }} />;
  return <CalendarOutlined style={{ color: '#7C4DFF' }} />;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  // Fresh notifications waiting for the user to acknowledge them (shown in ONE dialog, never stacked)
  const [alerts, setAlerts] = useState<AppNotification[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const [audioReady, setAudioReady] = useState(false);
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [api, notificationContextHolder] = notification.useNotification();

  const knownIds = useRef(new Set<string>());
  const isFirstLoad = useRef(true);
  const audioCtx = useRef<AudioContext | null>(null);
  const soundOnRef = useRef(true);
  const pathname = usePathname();
  const router = useRouter();

  // ── sound ────────────────────────────────────────────────────────────────
  // Browsers only allow audio after the person has interacted with the page once, so the audio engine
  // is created/unlocked on the first tap/click/key press anywhere.
  const ensureAudio = useCallback(() => {
    try {
      if (!audioCtx.current) {
        const Ctor = window.AudioContext || (window as any).webkitAudioContext;
        if (!Ctor) return null;
        audioCtx.current = new Ctor();
      }
      if (audioCtx.current.state === 'suspended') audioCtx.current.resume().catch(() => {});
      setAudioReady(audioCtx.current.state === 'running');
      return audioCtx.current;
    } catch {
      return null;
    }
  }, []);

  const playTone = useCallback((urgent: boolean) => {
    const ctx = ensureAudio();
    if (!ctx || ctx.state !== 'running') return;
    // pleasant two-note chime; urgent = four quick alternating notes
    const notes: [number, number][] = urgent
      ? [[988, 0], [784, 0.22], [988, 0.44], [784, 0.66]]
      : [[880, 0], [1175, 0.2]];
    const start = ctx.currentTime;
    for (const [freq, offset] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start + offset);
      gain.gain.exponentialRampToValueAtTime(0.35, start + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.55);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start + offset);
      osc.stop(start + offset + 0.6);
    }
  }, [ensureAudio]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SOUND_KEY);
      const on = saved !== 'off';
      setSoundOn(on);
      soundOnRef.current = on;
    } catch {}
    setDesktopPermission(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);

    const unlock = () => { ensureAudio(); };
    window.addEventListener('pointerdown', unlock, { once: false });
    window.addEventListener('keydown', unlock, { once: false });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [ensureAudio]);

  const toggleSound = (on: boolean) => {
    setSoundOn(on);
    soundOnRef.current = on;
    try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch {}
    if (on) { ensureAudio(); playTone(false); }
  };

  const enableDesktopAlerts = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setDesktopPermission(result);
  };

  // ── fetching + reacting to new notifications ─────────────────────────────
  const markRead = useCallback(async (ids?: string[]) => {
    try {
      const res = await fetch('/api/v1/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids ? { ids } : {}),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => (!ids || ids.includes(n.id) ? { ...n, read: true } : n)));
        setUnreadCount(prev => (ids ? Math.max(0, prev - ids.length) : 0));
      }
    } catch {
      console.error('Failed to mark notifications as read');
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/notifications', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      // The owner changed this person's access: the server issued a new sign-in token, so re-read it and reload the page
      if (data.sessionRefreshed) {
        window.dispatchEvent(new Event(SESSION_REFRESHED_EVENT));
        router.refresh();
      }
      const list: AppNotification[] = data.notifications || [];
      setNotifications(list);
      setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : list.filter(n => !n.read).length);

      const fresh = list.filter(n => !n.read && !knownIds.current.has(n.id));
      list.forEach(n => knownIds.current.add(n.id));

      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        // Opened the dashboard with unread items waiting: say so, they must not be overlooked
        const waiting = typeof data.unreadCount === 'number' ? data.unreadCount : fresh.length;
        if (waiting > 0) {
          setAlerts(list.filter(n => !n.read));
          if (soundOnRef.current) playTone(list.some(n => !n.read && isUrgent(n)));
        }
        return;
      }

      if (fresh.length > 0) {
        // A new one arrived while the dashboard is open: chime, buzz, and put it in front of the user
        setAlerts(prev => {
          const have = new Set(prev.map(a => a.id));
          return [...fresh.filter(f => !have.has(f.id)), ...prev];
        });
        if (soundOnRef.current) playTone(fresh.some(isUrgent));
        try { navigator.vibrate?.([200, 100, 200]); } catch {}
        // Tab in the background: a system notification, if the person allowed them
        if (document.hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          fresh.slice(0, 3).forEach(n => {
            try { new Notification(n.title, { body: n.desc, tag: n.id }); } catch {}
          });
        }
      }
    } catch {
      console.error('Failed to fetch notifications');
    }
  }, [playTone, router]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_MS);
    // Coming back to the tab (or the phone waking up): check right away instead of waiting for the timer
    const onVisible = () => { if (!document.hidden) fetchNotifications(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [fetchNotifications]);

  // Unread count in the browser tab title: "(3) Page name". Next rewrites the title on every page load and
  // navigation, so the prefix is re-applied whenever the title changes underneath us.
  useEffect(() => {
    const strip = (t: string) => t.replace(/^\(\d+\)\s*/, '');
    const apply = () => {
      const wanted = unreadCount > 0 ? `(${unreadCount}) ${strip(document.title)}` : strip(document.title);
      if (document.title !== wanted) document.title = wanted;
    };
    apply();
    const titleEl = document.querySelector('title');
    if (!titleEl) return;
    const observer = new MutationObserver(apply);
    observer.observe(titleEl, { childList: true, characterData: true, subtree: true });
    return () => { observer.disconnect(); };
  }, [unreadCount, pathname]);

  // A reminder that sound is blocked until the first tap
  const soundHint = soundOn && !audioReady;

  // ── UI ───────────────────────────────────────────────────────────────────
  const acknowledge = async (thenOpen: boolean) => {
    const shown = alerts;
    setAlerts([]);
    await markRead(shown.map(a => a.id));
    const target = shown.length ? targetFor(shown[0]) : null;
    if (thenOpen && target) router.push(target);
  };

  const openItem = async (item: AppNotification) => {
    setOpen(false);
    if (!item.read) await markRead([item.id]);
    const target = targetFor(item);
    if (target) router.push(target);
  };

  const content = (
    <div style={{ width: 340, maxWidth: '82vw' }}>
      <div className="flex items-center justify-between gap-2 pb-2 mb-1 border-b border-slate-100">
        <span className="flex items-center gap-2 text-xs text-slate-600">
          <SoundOutlined /> Sound
          <Switch size="small" checked={soundOn} onChange={toggleSound} aria-label="Notification sound" />
        </span>
        {desktopPermission === 'default' && (
          <Button type="link" size="small" onClick={enableDesktopAlerts} style={{ padding: 0, fontSize: 12 }}>Enable desktop alerts</Button>
        )}
        {desktopPermission === 'granted' && <span className="text-[11px] text-emerald-600">Desktop alerts on</span>}
      </div>
      {soundHint && (
        <div className="text-[11px] text-amber-600 mb-2">Your browser keeps sound off until you tap or click anywhere on the page once.</div>
      )}

      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {notifications.length > 0 ? (
          notifications.map(item => (
            <div
              key={item.id}
              onClick={() => openItem(item)}
              className={`flex items-start gap-3 p-3 border-b border-slate-100 cursor-pointer transition-colors ${item.read ? 'opacity-60 hover:bg-slate-50' : 'bg-violet-50/60 hover:bg-violet-50'}`}
            >
              <Avatar style={{ backgroundColor: '#F8F9FF', border: '1px solid #E2E8F0', flexShrink: 0 }}>{iconFor(item)}</Avatar>
              <div className="flex flex-col min-w-0">
                <Text strong style={{ fontSize: 13, color: isUrgent(item) ? '#DC2626' : '#1A202C' }}>
                  {!item.read && <span className="inline-block w-2 h-2 rounded-full bg-[#7C4DFF] mr-1.5 align-middle" />}
                  {item.title}
                </Text>
                <Text style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.4, marginTop: 2 }}>{item.desc}</Text>
                <Text style={{ fontSize: 10, color: '#A0AEC0', marginTop: 4 }}>{dayjs(item.createdAt).fromNow()}</Text>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '32px 0', textAlign: 'center', color: '#A0AEC0' }}>
            <BellOutlined style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }} />
            <div style={{ fontSize: 14, fontWeight: 500 }}>No notifications yet</div>
          </div>
        )}
      </div>

      {unreadCount > 0 && (
        <Button type="text" block onClick={() => markRead()} style={{ marginTop: 8, color: '#7C4DFF', fontWeight: 600 }}>
          Mark all as read ({unreadCount})
        </Button>
      )}
    </div>
  );

  const urgentInAlerts = alerts.some(isUrgent);

  return (
    <>
      {notificationContextHolder}

      {/* New notifications: one dialog that stays until acknowledged, so nothing is missed */}
      <Modal
        open={alerts.length > 0}
        centered
        closable={false}
        maskClosable={false}
        keyboard={false}
        width={440}
        title={
          <span style={{ color: urgentInAlerts ? '#DC2626' : undefined }}>
            <BellOutlined /> {alerts.length === 1 ? alerts[0].title : `${alerts.length} new notifications`}
          </span>
        }
        footer={[
          <Button key="ok" onClick={() => acknowledge(false)}>Acknowledge</Button>,
          ...(alerts.length > 0 && targetFor(alerts[0]) ? [<Button key="open" type="primary" onClick={() => acknowledge(true)} style={{ backgroundColor: '#7C4DFF' }}>Open</Button>] : []),
        ]}
      >
        <div style={{ maxHeight: 320, overflowY: 'auto' }} className="flex flex-col gap-3 mt-2">
          {alerts.slice(0, 6).map(a => (
            <div key={a.id} className="border-l-4 pl-3" style={{ borderColor: isUrgent(a) ? '#DC2626' : '#7C4DFF' }}>
              {alerts.length > 1 && <div className="text-xs font-bold text-slate-700">{a.title}</div>}
              <div className="text-sm text-slate-600">{a.desc}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{dayjs(a.createdAt).fromNow()}</div>
            </div>
          ))}
          {alerts.length > 6 && <div className="text-xs text-slate-500">…and {alerts.length - 6} more in the bell.</div>}
        </div>
        {soundHint && <div className="text-[11px] text-amber-600 mt-3">Tap anywhere on the page once to turn notification sounds on.</div>}
      </Modal>

      <Popover
        content={content}
        title={
          <div style={{ fontWeight: 800, paddingBottom: 8, borderBottom: '1px solid #E2E8F0', fontSize: 14 }}>
            Notifications
          </div>
        }
        trigger="click"
        open={open}
        onOpenChange={setOpen}
        placement="bottomRight"
      >
        <Button
          type="text"
          shape="circle"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          icon={
            <Badge count={unreadCount} overflowCount={99} color="#7C4DFF" size="small" offset={[-2, 2]}>
              <BellOutlined style={{ fontSize: 20, color: unreadCount > 0 ? '#7C4DFF' : '#718096' }} />
            </Badge>
          }
        />
      </Popover>
    </>
  );
}
