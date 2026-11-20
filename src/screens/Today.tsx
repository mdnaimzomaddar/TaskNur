import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useStored, localDate, addDays, prettyDay, fmt12, calcStreaks } from '../lib/shared';
import { scheduleOnce, cancelNotif, whenOf } from '../lib/notify';
import { confirmAction } from '../lib/dialog';

type Task = { id: string; title: string; done: boolean; date: string; time?: string };

function TaskRow({
  t,
  showDate,
  onToggle,
  onDelete,
}: {
  t: Task;
  showDate?: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { C, ui } = useApp();
  const color = t.done ? C.accent : C.danger;
  const meta: string[] = [];
  if (showDate) meta.push(prettyDay(t.date));
  if (t.time) {
    const [h, m] = t.time.split(':').map(Number);
    meta.push('🔔 ' + fmt12(h, m));
  }
  return (
    <View style={[ui.task, { borderLeftWidth: 4, borderLeftColor: color, paddingVertical: 4, paddingLeft: 14, paddingRight: 4 }]}>
      <Pressable onPress={onToggle} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
        <Ionicons name={t.done ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={color} />
        <View style={{ flex: 1 }}>
          <Text style={[ui.taskText, t.done && ui.taskDone]}>{t.title}</Text>
          {meta.length > 0 && <Text style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{meta.join('   ')}</Text>}
        </View>
      </Pressable>
      <Pressable onPress={onDelete} style={{ padding: 12 }}>
        <Ionicons name="trash-outline" size={20} color={C.sub} />
      </Pressable>
    </View>
  );
}

export default function Today() {
  const { C, ui } = useApp();
  const [tasks, setTasks] = useStored<Task[]>('tasks', []);
  const [text, setText] = useState('');

  const today = localDate();
  const todayList = tasks.filter((t) => t.date === today);
  const yesterday = localDate(addDays(-1));
  const overdue = tasks.filter((t) => t.date === yesterday && !t.done); // এক দিন পরে হোম থেকে সরে যায়, ইতিহাসে থাকে
  const upcoming = tasks.filter((t) => t.date > today); // আগে তৈরি করা ভবিষ্যৎ টাস্ক হারিয়ে না যাওয়ার জন্য
  const upDates = Array.from(new Set(upcoming.map((t) => t.date))).sort();

  const doneCount = todayList.filter((t) => t.done).length;
  const percent = todayList.length ? Math.round((doneCount / todayList.length) * 100) : 0;
  const streak = calcStreaks(tasks).current;

  const add = () => {
    const title = text.trim();
    if (!title) return;
    setTasks((prev) => [...prev, { id: Date.now().toString(), title, done: false, date: today }]);
    setText('');
  };

  const toggle = (t: Task) => {
    const next = !t.done;
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: next } : x)));
    if (next) {
      cancelNotif('task-' + t.id);
    } else if (t.time) {
      const when = whenOf(t.date, t.time);
      if (when.getTime() > Date.now()) scheduleOnce(t.id, t.title, when);
    }
  };

  const remove = (t: Task) =>
    confirmAction('Delete task?', t.title, 'Delete', () => {
      cancelNotif('task-' + t.id);
      setTasks((prev) => prev.filter((x) => x.id !== t.id));
    });

  return (
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
      <Text style={ui.title}>Today</Text>
      <Text style={ui.sub}>{new Date().toDateString()}</Text>
      <Text style={[ui.sub, { color: C.accent, fontWeight: '600' }]}>🔥 {streak} day streak</Text>

      <View style={ui.card}>
        <View style={ui.rowBetween}>
          <Text style={ui.cardLabel}>Daily progress</Text>
          <Text style={[ui.cardLabel, { color: C.accent }]}>{percent}%</Text>
        </View>
        <View style={ui.barBg}>
          <View style={[ui.barFill, { width: `${percent}%` }]} />
        </View>
        <Text style={ui.sub}>
          {doneCount} of {todayList.length} tasks done
        </Text>
      </View>

      <View style={ui.inputRow}>
        <TextInput
          style={ui.input}
          placeholder="Add a new task..."
          placeholderTextColor={C.sub}
          value={text}
          onChangeText={setText}
          onSubmitEditing={add}
        />
        <Pressable style={ui.addBtn} onPress={add}>
          <Ionicons name="add" size={26} color={C.onAccent} />
        </Pressable>
      </View>

      {overdue.length > 0 && (
        <>
          <Text style={[ui.section, { color: C.danger }]}>MISSED YESTERDAY</Text>
          {overdue.map((t) => (
            <TaskRow key={t.id} t={t} showDate onToggle={() => toggle(t)} onDelete={() => remove(t)} />
          ))}
        </>
      )}

      <Text style={ui.section}>TODAY</Text>
      {todayList.length === 0 && <Text style={[ui.empty, { marginTop: 10, marginBottom: 10 }]}>No tasks for today. Add your first one.</Text>}
      {todayList.map((t) => (
        <TaskRow key={t.id} t={t} onToggle={() => toggle(t)} onDelete={() => remove(t)} />
      ))}

      {upDates.map((d) => (
        <View key={d}>
          <Text style={ui.section}>{prettyDay(d).toUpperCase()}</Text>
          {upcoming
            .filter((t) => t.date === d)
            .map((t) => (
              <TaskRow key={t.id} t={t} onToggle={() => toggle(t)} onDelete={() => remove(t)} />
            ))}
        </View>
      ))}
    </ScrollView>
  );
}