"use client";

import React, { useState } from 'react';
import { Badge, Button, Popover, List, Typography, Avatar } from 'antd';
import { 
  BellOutlined, 
  CalendarOutlined, 
  AlertOutlined, 
  InfoCircleOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

// --- Mock Notifications Data ---
const INITIAL_NOTIFICATIONS = [
  { 
    id: 1, 
    title: 'New Booking Request', 
    desc: 'Kamal Perera booked a haircut for 3:00 PM.', 
    time: '10 min ago', 
    icon: <CalendarOutlined style={{ color: '#7C4DFF' }}/>, 
    read: false 
  },
  { 
    id: 2, 
    title: 'Low Stock Alert', 
    desc: 'Matte Clay Wax is running low in inventory.', 
    time: '1 hour ago', 
    icon: <AlertOutlined style={{ color: '#F59E0B' }}/>, 
    read: false 
  },
  { 
    id: 3, 
    title: 'System Update', 
    desc: 'Weekly analytics report is ready to view.', 
    time: '2 hours ago', 
    icon: <InfoCircleOutlined style={{ color: '#10B981' }}/>, 
    read: true // This one is already read, so it won't show up initially
  },
];

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  
  // Filter to only show notifications that haven't been read yet
  const unreadNotifications = notifications.filter(n => !n.read);
  const unreadCount = unreadNotifications.length;

  const handleMarkAllAsRead = () => {
    // Set all notifications to read = true, which will make them disappear from the filtered list
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const content = (
    <div style={{ width: 320 }}>
      {unreadCount > 0 ? (
        <>
          <List
            itemLayout="horizontal"
            dataSource={unreadNotifications}
            renderItem={item => (
              <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
                <List.Item.Meta
                  avatar={
                    <Avatar style={{ backgroundColor: '#F8F9FF', border: '1px solid #E2E8F0' }}>
                      {item.icon}
                    </Avatar>
                  }
                  title={<Text strong style={{ fontSize: '13px' }}>{item.title}</Text>}
                  description={
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                      <Text style={{ fontSize: '12px', color: '#4A5568', lineHeight: '1.4' }}>{item.desc}</Text>
                      <Text style={{ fontSize: '10px', color: '#A0AEC0' }}>{item.time}</Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
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
  );
}