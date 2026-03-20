import { SettingOutlined, ShopOutlined, GlobalOutlined, UserOutlined } from '@ant-design/icons';

export const PORTAL_ROUTES = [
  { 
    id: 'admin',
    title: 'Administration', 
    desc: 'System health and root settings', 
    icon: <SettingOutlined />, 
    href: '/admin', 
    color: '#7C4DFF',
    allowedRoles: ['admin', 'owner'] 
  },
  { 
    id: 'owner',
    title: 'Owner Portal', 
    desc: 'Shop reports and staff performance', 
    icon: <ShopOutlined />, 
    href: '/owner', 
    color: '#48BB78',
    allowedRoles: ['owner'] 
  },
  { 
    id: 'staff',
    title: 'Staff Portal', 
    desc: 'Manager and Barber access', 
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
    allowedRoles: ['public', 'staff', 'owner', 'admin'] 
  },
];