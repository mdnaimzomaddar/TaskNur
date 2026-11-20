import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useStored, localDate, parseDate, addDays, prettyDay, fmt12, hhmm } from '../lib/shared';
import { ensurePermission, scheduleFuture, cancelNotif, whenOf } from '../lib/notify';
import { pickDate, pickTime } from '../lib/pickers';
import { showAlert, confirmAction } from '../lib/dialog';

type Goal = { id: string; title: string; current: number; total: number };
type Future = { id: string; title: string; date: string; time: string; done: boolean };

function Chip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  onPress: () => void;
}) {
  const { C } = useApp();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: active ? C.accent : C.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: active ? C.accent : C.border,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      {icon && <Ionicons name={icon} size={16} color={active ? C.onAccent : C.sub} />}
      <Text style={{ color: active ? C.onAccent : C.text, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export default function Target() {
  const { C, ui } = useApp();
  const [mode, setMode] = useState<'today' | 'future'>('today');

  // Today target
  const [goals, setGoals] = useStored<Goal[]>('goals', []);
  const [title, setTitle] = useState('');
  const [total, setTotal] = useState('');

  // Future target
  const [futures, setFutures] = useStored<Future[]>('futures', []);
  const [fTitle, setFTitle] = useState('');
  const [fDate, setFDate] = useState(localDate(addDays(1)));
  const [fTime, setFTime] = useState('09:00');

  const today = localDate();
  const tomorrow = localDate(addDays(1));
  const nextWeek = localDate(addDays(7));
  const customDate = fDate !== tomorrow && fDate !== nextWeek;
  const [fh, fm] = fTime.split(':').map(Number);

  const btn = {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  // ----- Today target -----
  const addGoal = () => {
    const t = title.trim();
    const n = parseInt(total, 10);
    if (!t || !n || n < 1) return;
    setGoals((prev) => [...prev, { id: Date.now().toString(), title: t, current: 0, total: n }]);
    setTitle('');
    setTotal('');
  };
  const change = (id: string, delta: number) =>
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, current: Math.max(0, Math.min(g.total, g.current + delta)) } : g)));
  const removeGoal = (g: Goal) =>
    confirmAction('Delete target?', g.title, 'Delete', () => setGoals((prev) => prev.filter((x) => x.id !== g.id)));

  // ----- Future target -----
  const addFuture = async () => {
    const t = fTitle.trim();
    if (!t) return;
    const when = whenOf(fDate, fTime);
    if (when.getTime() <= Date.now()) {
      showAlert('Time already passed', 'Pick a later date or reminder time.');
      return;
    }
    const id = Date.now().toString();
    if (await ensurePermission()) {
      await scheduleFuture(id, t, when);
    } else {
      showAlert('Notifications are off', 'The target was saved, but no reminder will ring. Allow notifications in phone settings.');
    }
    setFutures((prev) => [...prev, { id, title: t, date: fDate, time: fTime, done: false }]);
    setFTitle('');
  };

  const toggleFuture = (f: Future) => {
    const next = !f.done;
    setFutures((prev) => prev.map((x) => (x.id === f.id ? { ...x, done: next } : x)));
    if (next) {
      cancelNotif('fut-' + f.id);
    } else {
      const when = whenOf(f.date, f.time);
      if (when.getTime() > Date.now()) scheduleFuture(f.id, f.title, when);
    }
  };
  const removeFuture = (f: Future) =>
    confirmAction('Delete target?', f.title, 'Delete', () => {
      cancelNotif('fut-' + f.id);
      setFutures((prev) => prev.filter((x) => x.id !== f.id));
    });

  const sorted = [...futures].sort((a, b) => ((a.date + a.time) < (b.date + b.time) ? -1 : 1));
  const futDates = Array.from(new Set(sorted.map((f) => f.date)));
  const pending = futures.filter((f) => !f.done).length;

  return (
    <View style={{ flex: 1 }}>
      <Text style={ui.title}>Target</Text>
      <Text style={ui.sub}>{mode === 'today' ? "Today's targets and progress" : 'Plan ahead with a date and a reminder'}</Text>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        {(
          [
            { key: 'today', label: `Today (${goals.length})` },
            { key: 'future', label: `Future (${pending})` },
          ] as const
        ).map((m) => {
          const active = mode === m.key;
          return (
            <Pressable
              key={m.key}
              onPress={() => setMode(m.key)}
              style={{ flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center', backgroundColor: active ? C.accent : C.card, borderWidth: 1, borderColor: active ? C.accent : C.border }}
            >
              <Text style={{ color: active ? C.onAccent : C.text, fontWeight: '700' }}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {mode === 'today' ? (
          <>
            <View style={ui.inputRow}>
              <TextInput style={ui.input} placeholder="Target (e.g. Read books)" placeholderTextColor={C.sub} value={title} onChangeText={setTitle} />
              <TextInput
                style={[ui.inputBox, { width: 70, textAlign: 'center' }]}
                placeholder="Total"
                placeholderTextColor={C.sub}
                keyboardType="numeric"
                value={total}
                onChangeText={setTotal}
                onSubmitEditing={addGoal}
              />
              <Pressable style={ui.addBtn} onPress={addGoal}>
                <Ionicons name="add" size={26} color={C.onAccent} />
              </Pressable>
            </View>

            {goals.length === 0 && <Text style={ui.empty}>No targets yet. Add your first one.</Text>}
            {goals.map((item) => {
              const p = Math.round((item.current / item.total) * 100);
              const finished = item.current >= item.total;
              return (
                <View key={item.id} style={[ui.card, { marginTop: 0, marginBottom: 12 }]}>
                  <View style={ui.rowBetween}>
                    <Text style={[ui.cardLabel, { flex: 1 }]}>{item.title}</Text>
                    {finished && <Ionicons name="trophy" size={20} color={C.accent} style={{ marginRight: 10 }} />}
                    <Pressable onPress={() => removeGoal(item)} style={{ padding: 6 }}>
                      <Ionicons name="trash-outline" size={20} color={C.sub} />
                    </Pressable>
                  </View>
                  <View style={ui.barBg}>
                    <View style={[ui.barFill, { width: `${p}%` }]} />
                  </View>
                  <View style={ui.rowBetween}>
                    <Text style={ui.sub}>
                      {item.current} / {item.total} ({p}%)
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Pressable onPress={() => change(item.id, -1)} style={btn}>
                        <Ionicons name="remove" size={20} color={C.text} />
                      </Pressable>
                      <Pressable onPress={() => change(item.id, 1)} style={[btn, { backgroundColor: C.accent }]}>
                        <Ionicons name="add" size={20} color={C.onAccent} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        ) : (
          <>
            <View style={ui.inputRow}>
              <TextInput
                style={ui.input}
                placeholder="Future target..."
                placeholderTextColor={C.sub}
                value={fTitle}
                onChangeText={setFTitle}
                onSubmitEditing={addFuture}
              />
              <Pressable style={ui.addBtn} onPress={addFuture}>
                <Ionicons name="add" size={26} color={C.onAccent} />
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: -6 }}>
              <Chip label="Tomorrow" active={fDate === tomorrow} onPress={() => setFDate(tomorrow)} />
              <Chip label="Next week" active={fDate === nextWeek} onPress={() => setFDate(nextWeek)} />
              <Chip
                label={customDate ? prettyDay(fDate) : 'Pick date'}
                icon="calendar-outline"
                active={customDate}
                onPress={() => pickDate(parseDate(fDate), (d) => setFDate(localDate(d)))}
              />
              <Chip
                label={`Remind ${fmt12(fh, fm)}`}
                icon="notifications-outline"
                active
                onPress={() => pickTime(fh, fm, (h, m) => setFTime(hhmm(h, m)))}
              />
            </View>
            <Text style={[ui.sub, { marginTop: 0, marginBottom: 4 }]}>
              Reminder: {prettyDay(fDate)} at {fmt12(fh, fm)}
            </Text>

            {sorted.length === 0 && <Text style={ui.empty}>No future targets yet. Pick a date and add one.</Text>}
            {futDates.map((d) => (
              <View key={d}>
                <Text style={ui.section}>{prettyDay(d).toUpperCase()}</Text>
                {sorted
                  .filter((f) => f.date === d)
                  .map((f) => {
                    const due = !f.done && f.date <= today;
                    const color = f.done ? C.accent : due ? C.danger : C.sub;
                    const [h, m] = f.time.split(':').map(Number);
                    return (
                      <View key={f.id} style={[ui.task, { borderLeftWidth: 4, borderLeftColor: color, paddingVertical: 4, paddingLeft: 14, paddingRight: 4 }]}>
                        <Pressable onPress={() => toggleFuture(f)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
                          <Ionicons name={f.done ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={color} />
                          <View style={{ flex: 1 }}>
                            <Text style={[ui.taskText, f.done && ui.taskDone]}>{f.title}</Text>
                            <Text style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>🔔 {fmt12(h, m)}</Text>
                          </View>
                        </Pressable>
                        <Pressable onPress={() => removeFuture(f)} style={{ padding: 12 }}>
                          <Ionicons name="trash-outline" size={20} color={C.sub} />
                        </Pressable>
                      </View>
                    );
                  })}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}