import React from 'react';
import Link from 'next/link';
import { Button } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';

export default function WebsiteHomePage() {
  return (
    <div style={{ padding: '80px 5%', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#2D3748', marginBottom: '20px', lineHeight: 1.2 }}>
        Premium Grooming <br />
        <span style={{ color: '#7C4DFF' }}>Experience</span>
      </h1>
      
      <p style={{ fontSize: '1.25rem', color: '#718096', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
        Book your next haircut with our expert barbers today. Experience top-tier styling in a modern, relaxing environment.
      </p>

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <Link href="/book">
          <Button 
            type="primary" 
            size="large" 
            icon={<CalendarOutlined />}
            style={{ 
              background: '#7C4DFF', 
              borderRadius: '12px', 
              fontWeight: 'bold',
              height: '56px',
              padding: '0 32px',
              fontSize: '16px',
              boxShadow: '0 4px 14px rgba(124, 77, 255, 0.3)'
            }}
          >
            Book Appointment
          </Button>
        </Link>
        <Link href="/services">
          <Button 
            size="large" 
            style={{ 
              borderRadius: '12px', 
              fontWeight: 'bold',
              height: '56px',
              padding: '0 32px',
              fontSize: '16px',
            }}
          >
            Our Services
          </Button>
        </Link>
      </div>
    </div>
  );
}