import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, ui, localDate, calcStreaks } from '../lib/shared';

type Task = { id: string; title: string; done: boolean; date: string };
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CHART_H = 150;
const FLAME = '#FFB020';

const prettyDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).toDateString();
};

export default function Weekly() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('tasks').then((v) => v && setTasks(JSON.parse(v)));
  }, []);

  const today = localDate();

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const date = localDate(d);
    const list = tasks.filter((t) => t.date === date);
    const done = list.filter((t) => t.done).length;
    const percent = list.length ? Math.round((done / list.length) * 100) : 0;
    return { date, label: DAYS[d.getDay()], total: list.length, done, percent };
  });

  const totalDone = days.reduce((a, d) => a + d.done, 0);
  const totalAll = days.reduce((a, d) => a + d.total, 0);
  const avg = totalAll ? Math.round((totalDone / totalAll) * 100) : 0;
  const best = [...days].sort((a, b) => b.percent - a.percent)[0];
  const streak = calcStreaks(tasks);

  const history = Array.from(new Set(tasks.map((t) => t.date)))
    .filter((d) => d !== today)
    .sort()
    .reverse()
    .slice(0, 30);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
      <Text style={ui.title}>Weekly</Text>
      <Text style={ui.sub}>Last 7 days of tasks</Text>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
        <View style={[ui.card, { flex: 1, marginTop: 0 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="flame" size={18} color={FLAME} />
            <Text style={ui.sub}>Current streak</Text>
          </View>
          <Text style={[ui.title, { color: FLAME }]}>{streak.current} <Text style={ui.sub}>days</Text></Text>
        </View>
        <View style={[ui.card, { flex: 1, marginTop: 0 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="trophy" size={18} color={C.accent} />
            <Text style={ui.sub}>Best streak</Text>
          </View>
          <Text style={[ui.title, { color: C.accent }]}>{streak.best} <Text style={ui.sub}>days</Text></Text>
        </View>
      </View>

      <View style={ui.card}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: CHART_H + 40 }}>
          {days.map((d) => (
            <View key={d.date} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
              <Text style={{ color: C.sub, fontSize: 11, marginBottom: 4 }}>{d.total ? `${d.percent}%` : '-'}</Text>
              <View style={{ width: 24, height: CHART_H, justifyContent: 'flex-end', backgroundColor: C.border, borderRadius: 8, overflow: 'hidden' }}>
                <View style={{ height: (d.percent / 100) * CHART_H, backgroundColor: d.date === today ? C.accent : '#2A8F66', borderRadius: 8 }} />
              </View>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          {days.map((d) => (
            <Text key={d.date} style={{ flex: 1, textAlign: 'center', fontSize: 12, color: d.date === today ? C.accent : C.sub }}>
              {d.label}
            </Text>
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
        <View style={[ui.card, { flex: 1, marginTop: 0 }]}>
          <Text style={ui.sub}>Average</Text>
          <Text style={[ui.title, { color: C.accent }]}>{avg}%</Text>
        </View>
        <View style={[ui.card, { flex: 1, marginTop: 0 }]}>
          <Text style={ui.sub}>Tasks done</Text>
          <Text style={ui.title}>{totalDone}/{totalAll}</Text>
        </View>
      </View>

      <View style={[ui.card, { marginTop: 14 }]}>
        <Text style={ui.sub}>Best day</Text>
        <Text style={[ui.cardLabel, { marginTop: 4 }]}>
          {best && best.total ? `${best.label} (${best.percent}%)` : 'No data yet'}
        </Text>
      </View>

      <Text style={[ui.title, { fontSize: 22, marginTop: 28, marginBottom: 6 }]}>History</Text>
      {history.length === 0 && <Text style={ui.empty}>No past days yet. Check back tomorrow.</Text>}
      {history.map((date) => {
        const list = tasks.filter((t) => t.date === date);
        const done = list.filter((t) => t.done).length;
        const p = Math.round((done / list.length) * 100);
        return (
          <View key={date} style={[ui.card, { marginTop: 10 }]}>
            <View style={ui.rowBetween}>
              <Text style={ui.cardLabel}>{prettyDate(date)}</Text>
              <Text style={[ui.cardLabel, { color: C.accent }]}>{done}/{list.length}</Text>
            </View>
            <View style={ui.barBg}>
              <View style={[ui.barFill, { width: `${p}%` }]} />
            </View>
            {list.map((t) => (
              <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <Ionicons name={t.done ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={t.done ? C.accent : C.sub} />
                <Text style={{ color: t.done ? C.sub : C.text, fontSize: 14, flex: 1 }}>{t.title}</Text>
              </View>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}