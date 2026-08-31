"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined,
  PhoneOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';

function ForgotPasswordContent() {
  const router = useRouter();

  const [step, setStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNotification, setShowNotification] = useState<{
    show: boolean;
    type: 'sms' | 'email';
    title: string;
    message: string;
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

  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setMessage(null);

    const identifier = method === 'email' ? email : phone;
    if (!identifier) {
      setMessage({ type: 'error', text: `Please enter a valid ${method === 'email' ? 'email address' : 'phone number'}.` });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, purpose: 'PASSWORD_RESET' }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep('verify');
        setResendCountdown(30);

        setShowNotification({
          show: true,
          type: data.type,
          title: 'Reset code sent',
          message: data.type === 'sms'
            ? `We sent a 6-digit password reset code by SMS to ${identifier}.`
            : `We sent a 6-digit password reset code to ${identifier}. Check your inbox.`,
        });

        setTimeout(() => {
          setShowNotification(null);
        }, 8000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to send verification code.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const identifier = method === 'email' ? email : phone;

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, purpose: 'PASSWORD_RESET', code: enteredCode }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.message || 'Invalid verification code.' });
        setLoading(false);
        return;
      }

      setStep('reset');
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      setLoading(false);
      return;
    }

    const identifier = method === 'email' ? email : phone;

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, newPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.message || 'Failed to reset password.' });
        setLoading(false);
        return;
      }

      setMessage({
        type: 'success',
        text: 'Your password has been reset successfully! Redirecting to login...'
      });
      setLoading(false);

      setTimeout(() => {
        router.push('/login?reset=success');
      }, 1500);
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-zinc-950 text-zinc-100 selection:bg-amber-600 selection:text-white font-sans relative">

      {/* Slide-down Notification Bubble */}
      {showNotification && showNotification.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm mx-auto p-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl animate-in slide-in-from-top-12 duration-500 text-zinc-100">
          <div className="flex gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${showNotification.type === 'sms' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
              {showNotification.type === 'sms' ? <PhoneOutlined className="text-sm" /> : <MailOutlined className="text-sm" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white uppercase tracking-wider">{showNotification.title}</p>
              <p className="text-[11px] text-zinc-400 mt-1 leading-normal">{showNotification.message}</p>
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
      <div className="hidden lg:flex lg:col-span-7 relative flex-col justify-between p-10 xl:p-16 overflow-hidden lg:h-screen">
        
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0 bg-zinc-900">
          <img 
            src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop" 
            alt="Salon Background" 
            className="w-full h-full object-cover opacity-30 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-950/80 to-transparent"></div>
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
            Regain Access <br />
            To Premium <br />
            <span className="font-serif italic font-light text-amber-500">Service.</span>
          </h1>
          <p className="text-zinc-400 leading-relaxed font-light text-sm">
            Easily reset your password and get back to booking premium artisan barber services, monitoring grooming history, and exploring salon items.
          </p>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-zinc-600 flex justify-between">
          <span>© 2026 MR POLAA. All Rights Reserved.</span>
          <Link href="/about" className="hover:underline">Learn about our heritage</Link>
        </div>
      </div>

      {/* Right Column: Authentication Card */}
      <div className="col-span-1 lg:col-span-5 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-10 xl:p-16 relative bg-zinc-900 border-l border-zinc-800/50 lg:h-screen lg:overflow-y-auto">
        
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
          href="/login" 
          className="absolute top-6 left-6 text-xs font-bold text-zinc-500 hover:text-amber-500 uppercase tracking-widest flex items-center gap-2 transition-colors duration-300"
        >
          <ArrowLeftOutlined /> Back to login
        </Link>

        <div className="w-full max-w-md">
          {/* Headline */}
          <div className="mb-8 lg:mb-5">
            <h2 className="text-2xl font-black text-white tracking-wide">
              {step === 'request' && 'Reset Password'}
              {step === 'verify' && 'Verify Identity'}
              {step === 'reset' && 'Create New Password'}
            </h2>
            <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
              {step === 'request' && 'Enter email or phone linked to your account.'}
              {step === 'verify' && 'Enter the 6-digit OTP code sent to your device.'}
              {step === 'reset' && 'Choose a strong new password for your account.'}
            </p>
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
          {step === 'request' && (
            <form onSubmit={handleSendCode} className="space-y-5">
              
              {/* Method Switcher */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Method</label>
                <div className="grid grid-cols-2 bg-zinc-950/80 p-1 border border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setMethod('email')}
                    className={`py-2 text-[10px] font-bold tracking-widest uppercase transition-all duration-300 ${
                      method === 'email' 
                        ? 'bg-zinc-800 text-white shadow' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Email Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('phone')}
                    className={`py-2 text-[10px] font-bold tracking-widest uppercase transition-all duration-300 ${
                      method === 'phone' 
                        ? 'bg-zinc-800 text-white shadow' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Phone Number
                  </button>
                </div>
              </div>

              {method === 'email' ? (
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-4 text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-xl active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed disabled:active:scale-100 flex justify-center items-center gap-2"
              >
                {loading ? 'Processing...' : method === 'email' ? 'Send Reset Code' : 'Send Reset SMS OTP'}
              </button>
            </form>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div className="p-4 bg-zinc-950/60 border border-zinc-800/60 text-xs text-zinc-400 leading-relaxed font-light">
                <span className="font-bold text-amber-500 block mb-1">Verify Identity</span>
                We sent a 6-digit verification code to: <br />
                <span className="font-mono font-bold text-white mt-1 block">
                  {method === 'email' ? email : phone}
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
                    className="w-full bg-zinc-950 border border-zinc-800/80 focus:border-amber-500 text-white text-sm pl-11 pr-4 py-3.5 outline-none transition-colors duration-300 rounded-none tracking-widest font-mono text-center text-lg animate-pulse"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || enteredCode.length < 6}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-4 text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-xl active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed disabled:active:scale-100 flex justify-center items-center gap-2"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <div className="flex justify-between items-center text-xs mt-4">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="text-zinc-500 hover:text-zinc-300 font-bold uppercase tracking-wider text-[10px]"
                >
                  ← Back
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

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">New Password</label>
                <div className="relative">
                  <LockOutlined className="absolute left-4 top-3.5 text-zinc-500 text-sm" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800/80 focus:border-amber-500 text-white text-sm pl-11 pr-4 py-3.5 outline-none transition-colors duration-300 rounded-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Confirm New Password</label>
                <div className="relative">
                  <LockOutlined className="absolute left-4 top-3.5 text-zinc-500 text-sm" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800/80 focus:border-amber-500 text-white text-sm pl-11 pr-4 py-3.5 outline-none transition-colors duration-300 rounded-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-4 text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-xl active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed disabled:active:scale-100 flex justify-center items-center gap-2"
              >
                {loading ? 'Saving...' : 'Reset Password'}
              </button>
            </form>
          )}

        </div>

      </div>

    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-zinc-800 mb-4"></div>
          <div className="h-4 bg-zinc-800 rounded w-32 mb-2"></div>
        </div>
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  );
}
