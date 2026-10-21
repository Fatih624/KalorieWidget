'use client';
import { useEffect } from 'react';
export default function Install() {
  useEffect(() => {
    // Never cache authenticated pages, journal responses, or photos.
    if ('serviceWorker' in navigator && window.isSecureContext)
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  }, []);
  return null;
}
