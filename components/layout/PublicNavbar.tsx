"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { SunOutlined, MoonOutlined, MenuOutlined } from '@ant-design/icons';
import Magnetic from "@/components/ui/Magnetic";

export function PublicNavbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name: string; initials: string; role?: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      
      const isDark = 
        localStorage.theme === 'dark' || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      setIsDarkMode(isDark);
      
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Read cookie for customer state
      const roleCookie = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
      const userRole = roleCookie ? roleCookie[2] : null;

      const nameCookie = document.cookie.match(new RegExp('(^| )user_name=([^;]+)'));
      const userName = nameCookie ? decodeURIComponent(nameCookie[2]) : null;

      if (userRole) {
        setIsLoggedIn(true);
        const displayName = userName || (userRole === 'customer' ? 'Malindu' : userRole.charAt(0).toUpperCase() + userRole.slice(1));
        setUserProfile({
          name: displayName,
          initials: displayName.charAt(0).toUpperCase(),
          role: userRole.toLowerCase()
        });
      } else {
        setIsLoggedIn(false);
        setUserProfile(null);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <header className="bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-xl text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-900 sticky top-0 z-50 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-6 h-24 flex justify-between items-center">
          
          {/* Left: Logo & Brand */}
          <Link 
            href="/" 
            onClick={(e) => {
              // ✅ Added smooth scroll to top logic here
              if (pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
              closeMobileMenu();
            }} 
            className="flex items-center gap-1 group z-50"
          >
            <div className="relative w-14 h-14 overflow-hidden rounded-full transition-colors duration-500 shrink-0">
              <Image src="/images/dashboard/logo_black.png" alt="Mr Polaa Logo Light" fill className="object-contain p-1 block dark:hidden" />
              <Image src="/images/dashboard/logo_white.png" alt="Mr Polaa Logo Dark" fill className="object-contain p-1 hidden dark:block" />
            </div>
            
            <div className="flex flex-col justify-center">
              <span className="text-xl sm:text-2xl font-black tracking-[0.2em] leading-none text-zinc-900 dark:text-white group-hover:text-amber-500 transition-colors duration-500">
                MR POLAA
              </span>
              <span className="text-[8px] sm:text-[9px] tracking-[0.82em] text-amber-600 dark:text-amber-500 font-bold uppercase mt-1.5">
                Unisex salon
              </span>
            </div>
          </Link>

        {/* Center: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-10">
            {[
              { name: 'Home', path: '/' },
              { name: 'About', path: '/about' },
              { name: 'Services', path: '/services' },
              { name: 'Products', path: '/products' },
              { name: 'Contact', path: '/contact' }
            ].map((link) => (
              <Magnetic key={link.name} range={35} strength={0.3}>
                <Link 
                  href={link.path} 
                  className={`text-xs font-black tracking-[0.15em] transition-colors uppercase ${
                    pathname === link.path 
                      ? 'text-amber-600 dark:text-amber-500' // Active page stays Amber
                      : 'd text-black dark:text-white hover:text-amber-600 dark:hover:text-amber-500' 
                  }`}
                >
                  {link.name}
                </Link>
              </Magnetic>
            ))}
          </nav>
          {/* Right: Actions */}
          <div className="flex items-center gap-4 lg:gap-6 z-50">
            
            {mounted && (
              <Magnetic range={40} strength={0.35}>
                <button 
                  onClick={toggleTheme}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-500/10 dark:hover:text-amber-500 transition-all duration-300 active:scale-95"
                  aria-label="Toggle Dark Mode"
                >
                  {isDarkMode ? <SunOutlined className="text-lg" /> : <MoonOutlined className="text-lg" />}
                </button>
              </Magnetic>
            )}

            <div className="hidden lg:flex items-center gap-6">
              <Magnetic range={50} strength={0.3}>
                <Link href="/booking" className="group relative flex items-center justify-center h-12 w-40 border border-zinc-900 dark:border-zinc-100 overflow-hidden cursor-pointer active:scale-95 transition-transform">
                  <span className="absolute inset-0 w-full h-full bg-amber-600 dark:bg-amber-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></span>
                  <span className="relative z-10 text-sm font-black uppercase text-black dark:text-zinc-100 group-hover:text-white dark:group-hover:text-zinc-950 transition-colors duration-300 mt-0.5">
                    Book Now
                  </span>
                </Link>
              </Magnetic>
              
              <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-800 mx-2"></div>
              
              {isLoggedIn && userProfile ? (
                <Magnetic range={40} strength={0.3}>
                  <Link href={userProfile.role === 'admin' ? '/admin' : userProfile.role === 'customer' ? '/profile' : '/owner'} className="flex items-center gap-3 group active:scale-95 transition-transform cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white font-bold group-hover:bg-amber-600 group-hover:text-white transition-colors border border-zinc-300 dark:border-zinc-700">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors hidden xl:block border-b border-transparent group-hover:border-amber-600 dark:group-hover:border-amber-500 pb-0.5">
                      {userProfile.name}
                    </span>
                  </Link>
                </Magnetic>
              ) : (
                <Magnetic range={40} strength={0.3}>
                  <Link 
                    href="/login" 
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-500/10 dark:hover:text-amber-500 transition-all duration-300 active:scale-95"
                    aria-label="Login"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </Link>
                </Magnetic>
              )}
            </div>

            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden flex items-center justify-center w-10 h-10 transition-all duration-300 active:scale-90 ${isMobileMenuOpen ? 'text-amber-600 dark:text-amber-500' : 'text-zinc-900 dark:text-zinc-100 hover:text-amber-600 dark:hover:text-amber-500'}`}
              aria-label="Toggle Mobile Menu"
            >
              {isMobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                  <circle cx="7" cy="18" r="3" />
                  <circle cx="17" cy="18" r="3" />
                  <line x1="8.5" y1="15.5" x2="19" y2="4" />
                  <line x1="15.5" y1="15.5" x2="5" y2="4" />
                  <circle cx="12" cy="10" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              ) : (
                <MenuOutlined className="text-xl" />
              )}
            </button>

          </div>
        </div>
      </header>

      {/* Clickable Dark Backdrop Overlay */}
      <div 
        className={`fixed inset-0 top-24 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-500 ease-in-out ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closeMobileMenu}
      />

      {/* Mobile Menu Side Drawer */}
      <div className={`fixed top-24 right-0 bottom-0 w-[75vw] sm:w-80 bg-zinc-50/98 dark:bg-zinc-950/98 backdrop-blur-2xl border-l border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl z-40 lg:hidden transition-transform duration-500 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col px-6 py-8 h-full overflow-y-auto pb-32">
          
          <nav className="flex flex-col gap-8 mb-10">
            {[
              { name: 'Home', path: '/' },
              { name: 'About', path: '/about' },
              { name: 'Services', path: '/services' },
              { name: 'Products', path: '/products' },
              { name: 'Contact', path: '/contact' }
            ].map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link 
                  key={link.name} 
                  href={link.path} 
                  onClick={(e) => {
                    // ✅ Allow the drawer links to scroll to top as well if already there!
                    if (pathname === link.path && link.path === '/') {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                    closeMobileMenu();
                  }} 
                  className={`group flex items-center text-lg font-black tracking-[0.15em] uppercase transition-colors ${
                    isActive 
                      ? 'text-amber-600 dark:text-amber-500' 
                      : 'text-zinc-900 dark:text-zinc-100 hover:text-amber-600 dark:hover:text-amber-500 active:text-amber-600 dark:active:text-amber-500'
                  }`}
                >
                  <span className={`transform transition-transform duration-300 ${isActive ? 'translate-x-2' : 'translate-x-0 group-hover:translate-x-2 group-active:translate-x-2'}`}>
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800 mb-10"></div>

          {/* Mobile Action Buttons */}
          <div className="flex flex-col gap-4">
            <Link 
              href="/booking" 
              onClick={closeMobileMenu}
              className="flex items-center justify-center h-14 w-full border border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 hover:text-amber-600 hover:border-amber-600 dark:hover:text-amber-500 dark:hover:border-amber-500 active:text-amber-600 active:border-amber-600 dark:active:text-amber-500 dark:active:border-amber-500 text-sm font-bold uppercase tracking-[0.2em] transition-colors duration-300"
            >
              Book Now
            </Link>
            
            {isLoggedIn && userProfile ? (
              <Link 
                href={userProfile.role === 'admin' ? '/admin' : userProfile.role === 'customer' ? '/profile' : '/owner'}
                onClick={closeMobileMenu}
                className="flex items-center justify-center h-14 w-full border border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 hover:text-amber-600 hover:border-amber-600 dark:hover:text-amber-500 dark:hover:border-amber-500 active:text-amber-600 active:border-amber-600 dark:active:text-amber-500 dark:active:border-amber-500 text-sm font-bold uppercase tracking-[0.2em] transition-colors duration-300"
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[12px] h-[12px]">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <span className="mt-0.5">{userProfile.name}</span>
                </div>
              </Link>
            ) : (
              <Link 
                href="/login" 
                onClick={closeMobileMenu}
                className="flex items-center justify-center h-14 w-full border border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 hover:text-amber-600 hover:border-amber-600 dark:hover:text-amber-500 dark:hover:border-amber-500 active:text-amber-600 active:border-amber-600 dark:active:text-amber-500 dark:active:border-amber-500 transition-colors duration-300"
              >
                <div className="flex items-center justify-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              </Link>
            )}
          </div>
          
        </div>
      </div>
    </>
  );
}