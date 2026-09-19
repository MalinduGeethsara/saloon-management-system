"use client";

import { useCallback, useEffect, useState } from 'react';
import { Access, PermissionRow, resolveAnyAccess } from '@/lib/access';

// Fired by the notification bell when the server re-issued this person's session (their role or permissions changed)
export const SESSION_REFRESHED_EVENT = 'polaa:session-refreshed';

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function readSession(): { role: string; rows: PermissionRow[] } {
  const role = (readCookie('user_role') || '').toUpperCase();
  let rows: PermissionRow[] = [];
  try {
    const raw = readCookie('user_permissions');
    if (raw) rows = JSON.parse(raw);
  } catch {
    rows = [];
  }
  return { role, rows: Array.isArray(rows) ? rows : [] };
}

// What the signed-in person may do on a page (or any of several pages). This only shows/hides buttons:
// the server checks the same rules again on every request.
export function useAccess(pages: string | string[]): Access & { ready: boolean; role: string } {
  const key = Array.isArray(pages) ? pages.join('|') : pages;
  const compute = useCallback(() => {
    const { role, rows } = readSession();
    return { ...resolveAnyAccess(role, rows, key.split('|')), ready: true, role };
  }, [key]);

  const [state, setState] = useState<Access & { ready: boolean; role: string }>({ view: false, add: false, edit: false, delete: false, source: 'none', ready: false, role: '' });

  useEffect(() => {
    setState(compute());
    const onRefresh = () => setState(compute());
    window.addEventListener(SESSION_REFRESHED_EVENT, onRefresh);
    return () => window.removeEventListener(SESSION_REFRESHED_EVENT, onRefresh);
  }, [compute]);

  return state;
}
