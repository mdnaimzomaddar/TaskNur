import { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Switch } from 'react-native';
import { showAlert, confirmAction } from '../lib/dialog';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useStored, fmt12 } from '../lib/shared';
import { ensurePermission, scheduleDaily, cancelNotif } from '../lib/notify';
import { pickTime } from '../lib/pickers';

type Reminder = { id: string; title: string; hour: number; minute: number; enabled: boolean };

export default function Reminders({ onClose }: { onClose: () => void }) {
  const { C, ui } = useApp();
  const [list, setList] = useStored<Reminder[]>('reminders', []);
  const [title, setTitle] = useState('');
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);

  const sorted = [...list].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));

  const add = async () => {
    const t = title.trim();
    if (!t) {
      showAlert('Enter a title', 'Write what you want to be reminded about.');
      return;
    }
    if (!(await ensurePermission())) {
      showAlert('Permission needed', 'Please allow notifications in phone settings.');
      return;
    }
    const r: Reminder = { id: Date.now().toString(), title: t, hour, minute, enabled: true };
    await scheduleDaily(r.id, r.title, r.hour, r.minute);
    setList((prev) => [...prev, r]);
    setTitle('');
  };

  const toggle = async (r: Reminder) => {
    if (r.enabled) {
      await cancelNotif('rem-' + r.id);
    } else {
      if (!(await ensurePermission())) {
        showAlert('Permission needed', 'Please allow notifications in phone settings.');
        return;
      }
      await scheduleDaily(r.id, r.title, r.hour, r.minute);
    }
    setList((prev) => prev.map((x) => (x.id === r.id ? { ...x, enabled: !r.enabled } : x)));
  };

  const editTime = (r: Reminder) =>
    pickTime(r.hour, r.minute, async (h, m) => {
      setList((prev) => prev.map((x) => (x.id === r.id ? { ...x, hour: h, minute: m } : x)));
      if (r.enabled) await scheduleDaily(r.id, r.title, h, m);
    });

  const remove = (r: Reminder) =>
    confirmAction('Delete reminder?', r.title, 'Delete', async () => {
      await cancelNotif('rem-' + r.id);
      setList((prev) => prev.filter((x) => x.id !== r.id));
    });

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.rowBetween}>
        <Text style={ui.title}>Daily reminders</Text>
        <Pressable onPress={onClose} style={{ padding: 6 }}>
          <Ionicons name="close" size={28} color={C.text} />
        </Pressable>
      </View>
      <Text style={ui.sub}>A notification every day at the time you choose</Text>

      <View style={{ marginTop: 18, gap: 10 }}>
        <TextInput
          style={ui.inputBox}
          placeholder="Reminder (e.g. Read book)"
          placeholderTextColor={C.sub}
          value={title}
          onChangeText={setTitle}
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={() => pickTime(hour, minute, (h, m) => { setHour(h); setMinute(m); })}
            style={[ui.input, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}
          >
            <Ionicons name="time-outline" size={22} color={C.accent} />
            <Text style={{ color: C.text, fontSize: 18, fontWeight: '600' }}>{fmt12(hour, minute)}</Text>
            <Text style={{ color: C.sub, marginLeft: 'auto' }}>tap to change</Text>
          </Pressable>
          <Pressable style={ui.addBtn} onPress={add}>
            <Ionicons name="add" size={26} color={C.onAccent} />
          </Pressable>
        </View>
      </View>

      <FlatList
        style={{ marginTop: 18 }}
        data={sorted}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={ui.empty}>No reminders yet. Add your first one.</Text>}
        renderItem={({ item }) => (
          <View style={ui.task}>
            <Pressable onPress={() => editTime(item)} style={{ flex: 1 }}>
              <Text style={[ui.taskText, !item.enabled && ui.taskDone]}>{item.title}</Text>
              <Text style={{ color: item.enabled ? C.accent : C.sub, marginTop: 2, fontWeight: '600' }}>
                {fmt12(item.hour, item.minute)} · every day
              </Text>
            </Pressable>
            <Switch
              value={item.enabled}
              onValueChange={() => toggle(item)}
              trackColor={{ false: C.border, true: C.accentDim }}
              thumbColor={item.enabled ? C.accent : C.sub}
            />
            <Pressable onPress={() => remove(item)} style={{ padding: 6 }}>
              <Ionicons name="trash-outline" size={20} color={C.sub} />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}