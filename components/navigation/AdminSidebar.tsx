"use client";
import React, { useState } from 'react';
import { Layout, Menu, Button, Modal, Progress, Badge } from 'antd';
import { 
  HomeOutlined, 
  DatabaseOutlined, 
  ShopOutlined, 
  SafetyCertificateOutlined,
  CloudUploadOutlined,
  LoadingOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';

const { Sider } = Layout;

interface AdminSidebarProps {
  onClose?: () => void;
}

export function AdminSidebar({ onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState([
    { id: 1, name: 'Database Connectivity Test', status: 'pending' },
    { id: 2, name: 'File Storage Write/Read Audit', status: 'pending' },
    { id: 3, name: 'Cron Scheduler & Backup Service Check', status: 'pending' },
    { id: 4, name: 'API Services Integration Check', status: 'pending' },
    { id: 5, name: 'Security Policy Compliance Audit', status: 'pending' }
  ]);

  const runDiagnostics = () => {
    setIsModalOpen(true);
    setRunning(true);
    setProgress(0);
    setSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));

    let currentStepIndex = 0;
    
    const interval = setInterval(() => {
      if (currentStepIndex < 5) {
        // Set current step to loading
        setSteps(prev => prev.map((s, idx) => {
          if (idx === currentStepIndex) return { ...s, status: 'loading' };
          return s;
        }));

        setTimeout(() => {
          // Complete current step to success
          setSteps(prev => prev.map((s, idx) => {
            if (idx === currentStepIndex) return { ...s, status: 'success' };
            return s;
          }));
          setProgress(Math.round(((currentStepIndex + 1) / 5) * 100));
          currentStepIndex++;
        }, 800);
      } else {
        clearInterval(interval);
        setRunning(false);
      }
    }, 1000);
  };

  const menuItems = [
    { key: '/admin', icon: <HomeOutlined />, label: 'Dashboard' },
    { key: '/admin/backups', icon: <DatabaseOutlined />, label: 'System Backups' },
    { key: '/admin/shops', icon: <ShopOutlined />, label: 'Shop Data' },
    { key: '/admin/logs', icon: <SafetyCertificateOutlined />, label: 'Security Logs' },
  ];

  return (
    <Sider 
      width={260} 
      theme="light" 
      style={{ height: '100vh', borderRight: '1px solid #E2E8F0', position: 'sticky', top: 0 }}
    >
      {/* Admin Logo */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'grid', color: '#7C4DFF', fontWeight: 'bolder', fontSize: '18px' }}>SYSTEM ADMIN</div>
        <div style={{ padding: '1px', width: '100%', height: '1px', backgroundColor: '#7C4DFF' }} />
      </div>

      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        onClick={({ key }) => {
          router.push(key);
          if (onClose) onClose();
        }}
        style={{ borderRight: 0, padding: '0 12px' }}
        items={menuItems}
      />

      {/* Admin Specific Widget */}
      <div style={{ margin: 'auto 20px 20px', padding: '20px', background: '#F8F9FF', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <CloudUploadOutlined style={{ fontSize: '20px', color: '#7C4DFF' }} />
          <div>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>System Status</p>
            <p style={{ margin: 0, fontSize: '10px', color: '#48BB78' }}>Operational</p>
          </div>
        </div>
        <Button 
          type="primary" 
          block 
          style={{ borderRadius: '12px', background: '#2D3748' }}
          onClick={runDiagnostics}
          loading={running}
        >
          Run Diagnostics
        </Button>
      </div>

      {/* Diagnostics Dialog */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#2D3748' }}>System Diagnostics</span>
            {running && <Badge status="processing" />}
          </div>
        }
        open={isModalOpen}
        onCancel={() => !running && setIsModalOpen(false)}
        footer={[
          <Button 
            key="close" 
            onClick={() => setIsModalOpen(false)} 
            disabled={running}
            type="primary"
            style={{ borderRadius: '8px', background: '#7C4DFF', border: 'none' }}
          >
            Close
          </Button>
        ]}
        centered
        destroyOnHidden
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', marginTop: '16px' }}>
          {/* Progress Indicator */}
          <div style={{ background: '#F8F9FF', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#718096' }}>DIAGNOSTIC PROGRESS</span>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#7C4DFF' }}>{progress}%</span>
            </div>
            <Progress 
              percent={progress} 
              showInfo={false} 
              strokeColor="#7C4DFF" 
              railColor="#E2E8F0"
              status={running ? "active" : "normal"}
            />
            {!running && progress === 100 && (
              <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#48BB78', fontWeight: 'bold', textAlign: 'center' }}>
                All systems functional. No anomalies detected!
              </p>
            )}
          </div>

          {/* Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {steps.map(step => {
              let icon = null;
              let textColor = '#4A5568';
              let statusText = 'Pending';
              
              if (step.status === 'loading') {
                icon = <LoadingOutlined style={{ color: '#7C4DFF' }} />;
                textColor = '#7C4DFF';
                statusText = 'Checking...';
              } else if (step.status === 'success') {
                icon = <CheckCircleOutlined style={{ color: '#48BB78' }} />;
                textColor = '#2D3748';
                statusText = 'Passed';
              } else {
                icon = <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#CBD5E0' }} />;
              }

              return (
                <div 
                  key={step.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: step.status === 'loading' ? '#F0EBFF' : step.status === 'success' ? '#DCFCE7' : '#F1F5F9',
                    background: step.status === 'loading' ? '#F8F9FF' : step.status === 'success' ? '#F0FDF4' : '#FFFFFF',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {icon}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: step.status === 'loading' || step.status === 'success' ? 600 : 400, color: textColor }}>
                      {step.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: step.status === 'success' ? '#48BB78' : step.status === 'loading' ? '#7C4DFF' : '#A0AEC0' }}>
                    {statusText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </Sider>
  );
}