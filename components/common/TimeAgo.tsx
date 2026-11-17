'use client';

import React, { useState, useEffect } from 'react';
import { formatTimeAgo } from '@/lib/utils';

interface TimeAgoProps {
  date: string;
  fallback?: string;
  className?: string;
}

export function TimeAgo({
  date,
  fallback = 'Baru saja',
  className,
}: TimeAgoProps) {
  const [mounted, setMounted] = useState(false);
  const [timeText, setTimeText] = useState(fallback);

  useEffect(() => {
    setMounted(true);
    setTimeText(formatTimeAgo(date));

    const interval = setInterval(() => {
      setTimeText(formatTimeAgo(date));
    }, 15000);

    return () => clearInterval(interval);
  }, [date]);

  return (
    <span className={className} suppressHydrationWarning>
      {mounted ? timeText : fallback}
    </span>
  );
}
