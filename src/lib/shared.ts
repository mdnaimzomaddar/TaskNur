import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------- Themes ----------
export const DARK = {
  bg: '#0F1115',
  card: '#1A1D24',
  border: '#272B35',
  text: '#F2F4F8',
  sub: '#8A91A0',
  accent: '#3DDC97',
  accentDim: '#2A8F66',
  danger: '#FF6B6B',
  onAccent: '#0F1115',
};
export const LIGHT = {
  bg: '#F4F6FA',
  card: '#FFFFFF',
  border: '#E1E5EC',
  text: '#161A22',
  sub: '#667085',
  accent: '#12A66B',
  accentDim: '#7BD3AE',
  danger: '#E5484D',
  onAccent: '#FFFFFF',
};
export type Palette = typeof DARK;

export type Settings = { theme: 'dark' | 'light'; prayerEnabled: boolean; studyEnabled: boolean; keepDays: number };
const DEFAULTS: Settings = { theme: 'dark', prayerEnabled: false, studyEnabled: true, keepDays: 90 };

export const makeUi = (C: Palette) =>
  StyleSheet.create({
    title: { color: C.text, fontSize: 30, fontWeight: '700' },
    sub: { color: C.sub, fontSize: 14, marginTop: 4 },
    card: { backgroundColor: C.card, borderRadius: 18, padding: 16, marginTop: 18, borderWidth: 1, borderColor: C.border },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardLabel: { color: C.text, fontSize: 15, fontWeight: '600' },
    barBg: { height: 10, backgroundColor: C.border, borderRadius: 6, marginVertical: 12, overflow: 'hidden' },
    barFill: { height: 10, backgroundColor: C.accent, borderRadius: 6 },
    inputRow: { flexDirection: 'row', gap: 10, marginVertical: 16 },
    input: { flex: 1, backgroundColor: C.card, color: C.text, borderRadius: 14, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: C.border },
    inputBox: { backgroundColor: C.card, color: C.text, borderRadius: 14, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: C.border },
    addBtn: { width: 50, height: 50, borderRadius: 14, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
    task: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, padding: 16, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
    taskText: { flex: 1, color: C.text, fontSize: 16 },
    taskDone: { color: C.sub, textDecorationLine: 'line-through' },
    empty: { color: C.sub, textAlign: 'center', marginTop: 30 },
    section: { color: C.sub, fontSize: 13, fontWeight: '700', marginTop: 22, marginBottom: 10 },
  });

type Ctx = {
  C: Palette;
  ui: ReturnType<typeof makeUi>;
  settings: Settings;
  setSettings: (patch: Partial<Settings>) => void;
};
const AppCtx = createContext<Ctx | null>(null);

export function useApp(): Ctx {
  const v = useContext(AppCtx);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      let s: Settings = DEFAULTS;
      try {
        const raw = await AsyncStorage.getItem('settings');
        if (raw) {
          s = { ...DEFAULTS, ...JSON.parse(raw) };
        } else {
          // আগে Prayer ট্যাব ব্যবহার করে থাকলে সেটা চালু রাখা হবে
          const old = await AsyncStorage.getItem('prayer_items');
          s = { ...DEFAULTS, prayerEnabled: old !== null };
        }
      } catch {}
      setSettingsState(s);
      await cleanupOld(s.keepDays);
      setReady(true);
    })();
  }, []);

  const C = settings.theme === 'light' ? LIGHT : DARK;
  const ui = useMemo(() => makeUi(C), [C]);

  const setSettings = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettingsState(next);
    AsyncStorage.setItem('settings', JSON.stringify(next)).catch(() => {});
  };

  if (!ready) {
    return React.createElement(View, { style: { flex: 1, backgroundColor: DARK.bg } });
  }
  return React.createElement(AppCtx.Provider, { value: { C, ui, settings, setSettings } }, children);
}

// ---------- Date helpers ----------
export const localDate = (d = new Date()) => {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

export const parseDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const prettyDay = (s: string) => {
  if (s === localDate()) return 'Today';
  if (s === localDate(addDays(1))) return 'Tomorrow';
  const d = parseDate(s);
  const year = d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : '';
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}${year}`;
};

// 24 ঘণ্টার সময় থেকে "9:30 AM" ফরম্যাট
export const fmt12 = (h: number, m: number) => {
  const ap = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ap}`;
};

export const hhmm = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

// ---------- Storage hook ----------
export function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((v) => {
        if (v) setValue(JSON.parse(v));
      })
      .finally(() => setLoaded(true));
  }, [key]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(key, JSON.stringify(value));
  }, [value, loaded, key]);

  return [value, setValue] as const;
}

// ---------- Streak ----------
export function calcStreaks(tasks: { done: boolean; date: string }[]) {
  const days = new Set(tasks.filter((t) => t.done).map((t) => t.date));

  const d = new Date();
  if (!days.has(localDate(d))) d.setDate(d.getDate() - 1);
  let current = 0;
  while (days.has(localDate(d))) {
    current++;
    d.setDate(d.getDate() - 1);
  }

  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const s of [...days].sort()) {
    const cur = parseDate(s);
    if (prev) {
      const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = cur;
  }
  return { current, best };
}

// ---------- পুরনো ডেটা মোছা (অ্যাপ খোলার সময় একবার) ----------
export async function cleanupOld(keepDays: number) {
  if (!keepDays || keepDays <= 0) return; // 0 = চিরকাল রাখা
  try {
    const cutoff = localDate(addDays(-keepDays));

    const rawTasks = await AsyncStorage.getItem('tasks');
    if (rawTasks) {
      const arr: { date: string }[] = JSON.parse(rawTasks);
      const kept = arr.filter((t) => t.date >= cutoff);
      if (kept.length !== arr.length) await AsyncStorage.setItem('tasks', JSON.stringify(kept));
    }

    for (const key of ['prayer_done', 'study_done', 'islamic_done']) {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;
      const obj: Record<string, string[]> = JSON.parse(raw);
      const next: Record<string, string[]> = {};
      let changed = false;
      for (const d of Object.keys(obj)) {
        if (d >= cutoff) next[d] = obj[d];
        else changed = true;
      }
      if (changed) await AsyncStorage.setItem(key, JSON.stringify(next));
    }
  } catch {}
}