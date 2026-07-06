"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined,
  PhoneOutlined,
  ArrowLeftOutlined,
  GoogleOutlined
} from '@ant-design/icons';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/profile';

  // Force dark mode on login page to ensure the background/overscroll matches the dark theme of the page
  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains('dark');
    if (!hadDark) {
      html.classList.add('dark');
    }
    return () => {
      if (!hadDark) {
        html.classList.remove('dark');
      }
    };
  }, []);

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [signupMethod, setSignupMethod] = useState<'email' | 'phone'>('email');
  const [signupStep, setSignupStep] = useState<'input' | 'verify'>('input');
  const [sentCode, setSentCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [showNotification, setShowNotification] = useState<{
    show: boolean;
    type: 'sms' | 'email';
    title: string;
    message: string;
    code: string;
  } | null>(null);

  // Resend timer countdown
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Clear message and verification state on tab switch
  useEffect(() => {
    if (activeTab === 'login' && searchParams.get('reset') === 'success') {
      setMessage({ type: 'success', text: 'Password reset successfully. Please sign in with your new password.' });
    } else {
      setMessage(null);
    }
    setSignupStep('input');
    setEnteredCode('');
    setSentCode('');
    setShowNotification(null);
  }, [activeTab, searchParams]);

  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setMessage(null);

    const identifier = signupMethod === 'email' ? email : phone;
    if (!identifier) {
      setMessage({ type: 'error', text: `Please enter a valid ${signupMethod === 'email' ? 'email address' : 'phone number'}.` });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      const data = await response.json();

      if (response.ok) {
        setSentCode(data.code);
        setSignupStep('verify');
        setResendCountdown(30);

        setShowNotification({
          show: true,
          type: data.type,
          title: data.type === 'sms' ? 'New Message from MR POLAA' : 'Verification Code Inbox',
          message: data.type === 'sms' 
            ? `Your verification OTP for MR POLAA Premium Grooming is: ${data.code}` 
            : `Please verify your email address to complete registration. Your verification code is: ${data.code}`,
          code: data.code
        });

        setTimeout(() => {
          setShowNotification(prev => prev?.code === data.code ? null : prev);
        }, 15000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to send verification code.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (enteredCode !== sentCode) {
      setMessage({ type: 'error', text: 'Invalid verification code. Please check the code and try again.' });
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name,
        password,
        email: signupMethod === 'email' ? email : '',
        phone: signupMethod === 'phone' ? phone : '',
        isRegister: true
      };

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Account verified & created successfully! Logging you in...'
        });
        
        setTimeout(() => {
          router.push(callbackUrl);
          router.refresh();
        }, 1200);
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Something went wrong during registration.'
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const payload = { email, password };

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Welcome back, ${data.name}!`
        });
        
        setTimeout(() => {
          router.push(callbackUrl);
          router.refresh();
        }, 1200);
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Something went wrong. Please try again.'
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Network error. Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (usePhone = false) => {
    setEmail(usePhone ? '+94 77 123 4567' : 'customer@salon.com');
    setPassword('password123');
    setActiveTab('login');
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-zinc-950 text-zinc-100 selection:bg-amber-600 selection:text-white font-sans relative">
      
      {/* Slide-down Notification Bubble */}
      {showNotification && showNotification.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-100 w-full max-w-sm mx-auto p-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl animate-in slide-in-from-top-12 duration-500 text-zinc-100">
          <div className="flex gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${showNotification.type === 'sms' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
              {showNotification.type === 'sms' ? <PhoneOutlined className="text-sm" /> : <MailOutlined className="text-sm" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white uppercase tracking-wider">{showNotification.title}</p>
              <p className="text-[11px] text-zinc-400 mt-1 leading-normal">{showNotification.message}</p>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-[10px] bg-zinc-950 px-2.5 py-1 font-mono font-bold text-white border border-zinc-800/80 rounded">
                  Code: {showNotification.code}
                </span>
                <button 
                  type="button"
                  onClick={() => {
                    setEnteredCode(showNotification.code);
                    setShowNotification(null);
                  }} 
                  className="text-[9px] text-amber-500 hover:text-amber-400 font-bold uppercase tracking-wider underline cursor-pointer ml-auto"
                >
                  Auto-fill
                </button>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setShowNotification(null)}
              className="text-zinc-500 hover:text-zinc-300 text-xs shrink-0 self-start p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Left Column: Ambient branding (hidden on mobile/tablet) */}
      <div className="hidden lg:flex lg:col-span-7 relative flex-col justify-between p-16 overflow-hidden">
        
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0 bg-zinc-900">
          <img 
            src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop" 
            alt="Salon Background" 
            className="w-full h-full object-cover opacity-30 grayscale"
          />
          <div className="absolute inset-0 bg-linear-to-tr from-zinc-950 via-zinc-950/80 to-transparent"></div>
        </div>

        {/* Brand Logo & Name */}
        <Link href="/" className="relative z-10 flex items-center gap-3 group w-fit">
          <div className="flex flex-col justify-center">
            <span className="text-2xl font-black tracking-[0.2em] leading-none text-white group-hover:text-amber-500 transition-colors duration-500">
              MR POLAA
            </span>
            <span className="text-[9px] tracking-[0.3em] text-amber-500 font-bold uppercase mt-1.5">
              Premium Grooming
            </span>
          </div>
        </Link>

        {/* Brand Message */}
        <div className="relative z-10 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
            Your Chair <br />
            Is Awaiting <br />
            <span className="font-serif italic font-light text-amber-500">Excellence.</span>
          </h1>
          <p className="text-zinc-400 leading-relaxed font-light text-sm">
            Sign in to manage your appointments, view historical styling sessions, explore products, and book premium artisan barber slots with ease.
          </p>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-zinc-600 flex justify-between">
          <span>© 2026 MR POLAA. All Rights Reserved.</span>
          <Link href="/about" className="hover:underline">Learn about our heritage</Link>
        </div>
      </div>

      {/* Right Column: Authentication Card */}
      <div className="col-span-1 lg:col-span-5 flex flex-col justify-center items-center p-6 sm:p-12 md:p-16 relative bg-zinc-900 border-l border-zinc-800/50">
        
        {/* Mobile Logo Branding (visible only on mobile) */}
        <div className="lg:hidden mb-8 text-center flex flex-col items-center">
          <Link href="/" className="flex flex-col items-center gap-1 group">
            <span className="text-xl font-black tracking-[0.2em] leading-none text-white group-hover:text-amber-500 transition-colors">
              MR POLAA
            </span>
            <span className="text-[8px] tracking-[0.3em] text-amber-500 font-bold uppercase mt-1.5">
              Premium Grooming
            </span>
          </Link>
        </div>

        {/* Back Link */}
        <Link 
          href="/" 
          className="absolute top-6 left-6 text-xs font-bold text-zinc-500 hover:text-amber-500 uppercase tracking-widest flex items-center gap-2 transition-colors duration-300"
        >
          <ArrowLeftOutlined /> Back to home
        </Link>

        <div className="w-full max-w-md">
          {/* Headline */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-white tracking-wide">
              {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
              {activeTab === 'login' 
                ? 'Sign in to access your grooming history & details.' 
                : 'Join MR POLAA to secure premium slots instantly.'}
            </p>
          </div>

          {/* Form Tabs Switcher */}
          <div className="grid grid-cols-2 bg-zinc-950/80 p-1 mb-8 border border-zinc-800/80">
            <button
              onClick={() => setActiveTab('login')}
              className={`py-3 text-xs font-bold tracking-widest uppercase transition-all duration-300 ${
                activeTab === 'login' 
                  ? 'bg-amber-600 text-white shadow-lg' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`py-3 text-xs font-bold tracking-widest uppercase transition-all duration-300 ${
                activeTab === 'signup' 
                  ? 'bg-amber-600 text-white shadow-lg' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`p-4 mb-6 text-xs font-bold tracking-wide border ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                : 'bg-red-500/10 border-red-500/30 text-red-500'
            }`}>
              {message.text}
            </div>
          )}

          {/* Forms */}
          {activeTab === 'login' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Email Address or Phone Number
                </label>
                <div className="relative">
                  {/^[+\d\s-]+$/.test(email) ? (
                    <PhoneOutlined className="absolute left-4 top-3.5 text-zinc-500 text-sm" />
                  ) : (
                    <MailOutlined className="absolute left-4 top-3.5 text-zinc-500 text-sm" />
                  )}
                  <input
                    type="text"
                    required
                    placeholder="customer@salon.com or +94 77 123 4567"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800/80 focus:border-amber-500 text-white text-sm pl-11 pr-4 py-3.5 outline-none transition-colors duration-300 rounded-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Password</label>
                  <Link 
                    href="/forgot-password" 
                    className="text-[10px] font-bold uppercase tracking-widest text-amber-500/85 hover:text-amber-500 underline transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <LockOutlined className="absolute left-4 top-3.5 text-zinc-500 text-sm" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800/80 focus:border-amber-500 text-white text-sm pl-11 pr-4 py-3.5 outline-none transition-colors duration-300 rounded-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-4 text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-xl active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed disabled:active:scale-100 flex justify-center items-center gap-2"
              >
                {loading ? 'Processing...' : 'Sign In'}
              </button>
            </form>
          ) : signupStep === 'input' ? (
            <form onSubmit={handleSendCode} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Full Name</label>
                <div className="relative">
                  <UserOutlined className="absolute left-4 top-3.5 text-zinc-500 text-sm" />
                  <input
                    type="text"
                    required
                    placeholder="Malindu Geethsara"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800/80 focus:border-amber-500 text-white text-sm pl-11 pr-4 py-3.5 outline-none transition-colors duration-300 rounded-none"
                  />
                </div>
              </div>

              {/* Signup Method Switcher */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Sign Up Method</label>
                <div className="grid grid-cols-2 bg-zinc-950/80 p-1 border border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setSignupMethod('email')}
                    className={`py-2 text-[10px] font-bold tracking-widest uppercase transition-all duration-300 ${
                      signupMethod === 'email' 
                        ? 'bg-zinc-800 text-white shadow' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Email Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupMethod('phone')}
                    className={`py-2 text-[10px] font-bold tracking-widest uppercase transition-all duration-300 ${
                      signupMethod === 'phone' 
                        ? 'bg-zinc-800 text-white shadow' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Phone Number
                  </button>
                </div>
              </div>

              {signupMethod === 'email' ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Email Address</label>
                  <div className="relative">
                    <MailOutlined className="absolute left-4 top-3.5 text-zinc-500 text-sm" />
                    <input
                      type="email"
                      required
                      placeholder="customer@salon.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800/80 focus:border-amber-500 text-white text-sm pl-11 pr-4 py-3.5 outline-none transition-colors duration-300 rounded-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Phone Number</label>
                  <div className="relative">
                    <PhoneOutlined className="absolute left-4 top-3.5 text-zinc-500 text-sm" />
                    <input
                      type="tel"
                      required
                      placeholder="+94 77 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800/80 focus:border-amber-500 text-white text-sm pl-11 pr-4 py-3.5 outline-none transition-colors duration-300 rounded-none"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Password</label>
                <div className="relative">
                  <LockOutlined className="absolute left-4 top-3.5 text-zinc-500 text-sm" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800/80 focus:border-amber-500 text-white text-sm pl-11 pr-4 py-3.5 outline-none transition-colors duration-300 rounded-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-4 text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-xl active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed disabled:active:scale-100 flex justify-center items-center gap-2"
              >
                {loading ? 'Processing...' : signupMethod === 'email' ? 'Send Email Code' : 'Send SMS OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndRegister} className="space-y-5">
              <div className="p-4 bg-zinc-950/60 border border-zinc-800/60 text-xs text-zinc-400 leading-relaxed font-light">
                <span className="font-bold text-amber-500 block mb-1">Verify Identity</span>
                We simulated sending a 6-digit verification code to: <br />
                <span className="font-mono font-bold text-white mt-1 block">
                  {signupMethod === 'email' ? email : phone}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Verification Code</label>
                <div className="relative">
                  <LockOutlined className="absolute left-4 top-3.5 text-zinc-500 text-sm" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="••••••"
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-zinc-950 border border-zinc-800/80 focus:border-amber-500 text-white pl-11 pr-4 py-3.5 outline-none transition-colors duration-300 rounded-none tracking-widest font-mono text-center text-lg animate-pulse"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || enteredCode.length < 6}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-4 text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-xl active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed disabled:active:scale-100 flex justify-center items-center gap-2"
              >
                {loading ? 'Verifying...' : 'Verify & Register'}
              </button>

              <div className="flex justify-between items-center text-xs mt-4">
                <button
                  type="button"
                  onClick={() => setSignupStep('input')}
                  className="text-zinc-500 hover:text-zinc-300 font-bold uppercase tracking-wider text-[10px]"
                >
                  ← Edit Details
                </button>

                <button
                  type="button"
                  disabled={resendCountdown > 0}
                  onClick={() => handleSendCode()}
                  className="text-amber-500 hover:text-amber-400 font-bold uppercase tracking-wider text-[10px] disabled:text-zinc-600 disabled:cursor-not-allowed"
                >
                  {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          {/* Social Logins */}
          <div className="mt-8 pt-8 border-t border-zinc-800/50 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => fillDemoCredentials(false)}
                className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-300 hover:text-white py-3.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                Demo Email
              </button>

              <button 
                type="button"
                onClick={() => fillDemoCredentials(true)}
                className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-300 hover:text-white py-3.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                Demo Phone
              </button>
            </div>

            <button 
              type="button" 
              className="w-full bg-zinc-950 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-400 hover:text-white py-3.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 cursor-not-allowed opacity-50"
              disabled
            >
              <GoogleOutlined className="text-sm" />
              Continue with Google
            </button>
          </div>

          {/* Assistance details */}
          <div className="mt-8 p-5 bg-zinc-950/60 border border-zinc-800/60 text-[11px] text-zinc-500 leading-relaxed font-light">
            <span className="font-bold text-amber-500 uppercase tracking-widest block mb-2">Demo Credentials</span>
            <span className="font-bold text-zinc-400">Email:</span> customer@salon.com <br />
            <span className="font-bold text-zinc-400">Phone:</span> +94 77 123 4567 <br />
            <span className="font-bold text-zinc-400">Password:</span> password123 <br />
            <span className="block mt-3 text-[10px] text-zinc-600 border-t border-zinc-900 pt-2">
              Are you a staff member? <Link href="/staff-login" className="text-amber-500/80 hover:text-amber-500 underline font-bold uppercase tracking-wider text-[9px] ml-1">Staff Portal</Link>
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-zinc-800 mb-4"></div>
          <div className="h-4 bg-zinc-800 rounded w-32 mb-2"></div>
        </div>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
