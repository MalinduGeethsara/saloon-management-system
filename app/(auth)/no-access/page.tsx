"use client";

import React from 'react';
import { Button } from 'antd';
import { useRouter } from 'next/navigation';

// Where a staff member lands when the owner has not given them any page yet (or took all of them away)
export default function NoAccessPage() {
  const router = useRouter();

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/staff-login');
    router.refresh();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F4F0FF] px-4">
      <div className="max-w-md w-full rounded-2xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-extrabold text-slate-900">No pages yet</h1>
        <p className="mt-3 text-slate-600">
          Your account is active, but the owner has not given you access to any page. Ask the owner to update your
          permissions. This page refreshes itself once they do.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="large" onClick={() => router.push('/staff-login')}>Check again</Button>
          <Button size="large" type="primary" onClick={signOut}>Sign out</Button>
        </div>
      </div>
    </div>
  );
}
