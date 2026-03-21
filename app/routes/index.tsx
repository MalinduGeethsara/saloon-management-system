import { SettingOutlined, ShopOutlined, GlobalOutlined, UserOutlined } from '@ant-design/icons';

export const PORTAL_ROUTES = [
  { 
    id: 'admin',
    title: 'Administration', 
    desc: 'System health and root settings', 
    icon: <SettingOutlined />, 
    href: '/admin', 
    color: '#7C4DFF',
    allowedRoles: ['admin'] // Only admin
  },
  { 
    id: 'owner',
    title: 'Salon Portal', // Renamed slightly since Barbers/Managers use this path
    desc: 'Dashboard, Schedule, and Reports', 
    icon: <ShopOutlined />, 
    href: '/owner', 
    color: '#48BB78',
    allowedRoles: ['owner', 'manager', 'barber'] // Added manager and barber
  },
  { 
    id: 'staff',
    title: 'Staff Portal', 
    desc: 'General staff access', 
    icon: <UserOutlined />, 
    href: '/staff', 
    color: '#ED8936',
    allowedRoles: ['staff', 'owner', 'admin'] 
  },
  { 
    id: 'public',
    title: 'Public Site', 
    desc: 'Client-facing booking and portfolio', 
    icon: <GlobalOutlined />, 
    href: '/public', 
    color: '#3182CE',
    allowedRoles: ['public', 'staff', 'owner', 'manager', 'barber', 'admin'] 
  },
];