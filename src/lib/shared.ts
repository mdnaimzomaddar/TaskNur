import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const C = {
  bg: '#0F1115',
  card: '#1A1D24',
  border: '#272B35',
  text: '#F2F4F8',
  sub: '#8A91A0',
  accent: '#3DDC97',
};

// ফোনের স্থানীয় সময় অনুযায়ী তারিখ (YYYY-MM-DD)
export const localDate = (d = new Date()) => {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

// ডেটা পড়া ও পরিবর্তন হলে নিজে থেকে সেভ করা
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

export const ui = StyleSheet.create({
  title: { color: C.text, fontSize: 30, fontWeight: '700' },
  sub: { color: C.sub, fontSize: 14, marginTop: 4 },
  card: { backgroundColor: C.card, borderRadius: 18, padding: 16, marginTop: 18, borderWidth: 1, borderColor: C.border },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: C.text, fontSize: 15, fontWeight: '600' },
  barBg: { height: 10, backgroundColor: C.border, borderRadius: 6, marginVertical: 12, overflow: 'hidden' },
  barFill: { height: 10, backgroundColor: C.accent, borderRadius: 6 },
  inputRow: { flexDirection: 'row', gap: 10, marginVertical: 16 },
  input: { flex: 1, backgroundColor: C.card, color: C.text, borderRadius: 14, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: C.border },
  addBtn: { width: 50, height: 50, borderRadius: 14, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  task: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, padding: 16, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  taskText: { flex: 1, color: C.text, fontSize: 16 },
  taskDone: { color: C.sub, textDecorationLine: 'line-through' },
  empty: { color: C.sub, textAlign: 'center', marginTop: 30 },
});

// টানা কত দিন অন্তত একটা টাস্ক সম্পন্ন হয়েছে
export function calcStreaks(tasks: { done: boolean; date: string }[]) {
  const days = new Set(tasks.filter((t) => t.done).map((t) => t.date));

  // বর্তমান streak (আজ কিছু না করলে গতকাল থেকে গোনা শুরু)
  const d = new Date();
  if (!days.has(localDate(d))) d.setDate(d.getDate() - 1);
  let current = 0;
  while (days.has(localDate(d))) {
    current++;
    d.setDate(d.getDate() - 1);
  }

  // সেরা streak
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const s of [...days].sort()) {
    const [y, m, dd] = s.split('-').map(Number);
    const cur = new Date(y, m - 1, dd);
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