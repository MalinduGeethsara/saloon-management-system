"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Badge, Button, Popover, Typography, Avatar, notification, Modal } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BellOutlined, 
  CalendarOutlined, 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [api, notificationContextHolder] = notification.useNotification();
  const [modal, modalContextHolder] = Modal.useModal();
  const knownNotificationIds = useRef(new Set<string>());
  const isFirstLoad = useRef(true);
  const pathname = usePathname();
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/v1/notifications');
      if (res.ok) {
        const data = await res.json();
        if (data.notifications) {
          setNotifications(data.notifications);
          
          data.notifications.forEach((n: any) => {
            if (!knownNotificationIds.current.has(n.id)) {
              knownNotificationIds.current.add(n.id);
              
              if (!isFirstLoad.current && !n.read) {
                // Show a persistent popup window using hooks to consume theme context
                modal.info({
                  title: n.title,
                  content: (
                    <div className="mt-2">
                      <p className="text-sm text-slate-600">{n.desc}</p>
                      <p className="text-xs text-slate-400 mt-2 italic">Please review your updated schedule.</p>
                    </div>
                  ),
                  okText: 'Acknowledge',
                  centered: true,
                  okButtonProps: { className: 'bg-[#7C4DFF]' },
                });
                
                // Also show the toast as a secondary alert
                api.info({
                  title: n.title,
                  description: n.desc,
                  placement: 'topRight',
                  duration: 6,
                  icon: <BellOutlined style={{ color: '#7C4DFF' }} />
                });
              }
            }
          });

          if (isFirstLoad.current) {
            isFirstLoad.current = false;
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Poll every 5 seconds for "realtime" feel
    return () => clearInterval(interval);
  }, []);

  const unreadNotifications = notifications.filter(n => !n.read);
  const unreadCount = unreadNotifications.length;

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/v1/notifications', { method: 'PUT' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (e) {
      console.error('Failed to mark notifications as read');
    }
  };

  const handleNotificationClick = (item: any) => {
    // Navigate to the appropriate booking view
    if (pathname.startsWith('/owner')) {
      router.push('/owner/bookings/manage');
    } else if (pathname.startsWith('/barber')) {
      router.push('/barber');
    }
    setOpen(false); // Close popover
  };

  const content = (
    <div style={{ width: 320, maxHeight: '400px', overflowY: 'auto' }}>
      {unreadCount > 0 ? (
        <>
          <div className="flex flex-col">
            {unreadNotifications.map(item => (
              <div 
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className="flex items-start gap-3 p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <Avatar style={{ backgroundColor: '#F8F9FF', border: '1px solid #E2E8F0', flexShrink: 0 }}>
                  <CalendarOutlined style={{ color: '#7C4DFF' }}/>
                </Avatar>
                <div className="flex flex-col">
                  <Text strong style={{ fontSize: '13px', color: '#1A202C' }}>{item.title}</Text>
                  <Text style={{ fontSize: '12px', color: '#4A5568', lineHeight: '1.4', marginTop: '2px' }}>{item.desc}</Text>
                  <Text style={{ fontSize: '10px', color: '#A0AEC0', marginTop: '4px' }}>{dayjs(item.createdAt).fromNow()}</Text>
                </div>
              </div>
            ))}
          </div>
          <Button 
            type="text" 
            block 
            onClick={handleMarkAllAsRead}
            style={{ marginTop: 8, color: '#7C4DFF', fontWeight: 600 }}
          >
            Mark all as read
          </Button>
        </>
      ) : (
        // Empty State UI
        <div style={{ padding: '32px 0', textAlign: 'center', color: '#A0AEC0' }}>
          <BellOutlined style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }} />
          <div style={{ fontSize: '14px', fontWeight: 500 }}>No new notifications</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>You're all caught up!</div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {notificationContextHolder}
      {modalContextHolder}
      <Popover
      content={content}
      title={
        <div style={{ fontWeight: 800, paddingBottom: '8px', borderBottom: '1px solid #E2E8F0', fontSize: '14px' }}>
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
        icon={
          <Badge dot={unreadCount > 0} color="#7C4DFF" offset={[-2, 2]}>
            <BellOutlined style={{ fontSize: '20px', color: '#718096' }} />
          </Badge>
        } 
      />
      </Popover>
    </>
  );
}