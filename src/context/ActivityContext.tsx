'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface ActivityEntry {
  id: string;
  action: string;
  resource: string;
  detail: string;
  timestamp: string;
  type: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'login' | 'info';
}

interface ActivityCtx {
  activities: ActivityEntry[];
  log: (entryOrType: Omit<ActivityEntry, 'id' | 'timestamp'> | ActivityEntry['type'], resource?: string, detail?: string) => void;
  clear: () => void;
}

const ActivityContext = createContext<ActivityCtx>({
  activities: [],
  log: () => {},
  clear: () => {},
});

const STORAGE_KEY = 'admin_activity_log';
const MAX_ENTRIES = 100;

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setActivities(JSON.parse(stored));
    } catch {}
  }, []);

  const log = useCallback((entryOrType: Omit<ActivityEntry, 'id' | 'timestamp'> | ActivityEntry['type'], resource?: string, detail?: string) => {
    const entry: Omit<ActivityEntry, 'id' | 'timestamp'> =
      typeof entryOrType === 'string'
        ? { type: entryOrType as ActivityEntry['type'], action: entryOrType, resource: resource ?? '', detail: detail ?? '' }
        : entryOrType;
    const newEntry: ActivityEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => {
      const next = [newEntry, ...prev].slice(0, MAX_ENTRIES);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setActivities([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <ActivityContext.Provider value={{ activities, log, clear }}>
      {children}
    </ActivityContext.Provider>
  );
}

export const useActivity = () => useContext(ActivityContext);
