import { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, ui, localDate, useStored } from '../lib/shared';

type Item = { id: string; title: string };
type DoneMap = Record<string, string[]>;

type Props = {
  title: string;
  subtitle: string;
  storageKey: string;
  defaults: string[];
  placeholder: string;
};

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const BAR_H = 44;

export default function Checklist({ title, subtitle, storageKey, defaults, placeholder }: Props) {
  const [items, setItems] = useStored<Item[]>(
    storageKey + '_items',
    defaults.map((t, i) => ({ id: 'd' + i, title: t }))
  );
  const [done, setDone] = useStored<DoneMap>(storageKey + '_done', {});
  const [text, setText] = useState('');

  const today = localDate();
  const doneToday = done[today] ?? [];
  const count = items.filter((i) => doneToday.includes(i.id)).length;
  const percent = items.length ? Math.round((count / items.length) * 100) : 0;

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = localDate(d);
    const ids = done[key] ?? [];
    const c = items.filter((it) => ids.includes(it.id)).length;
    return { key, letter: LETTERS[d.getDay()], count: c, pct: items.length ? c / items.length : 0 };
  });
  const weekDone = week.reduce((a, w) => a + w.count, 0);

  const toggle = (id: string) => {
    const next = doneToday.includes(id) ? doneToday.filter((x) => x !== id) : [...doneToday, id];
    setDone({ ...done, [today]: next });
  };
  const add = () => {
    const t = text.trim();
    if (!t) return;
    setItems([...items, { id: Date.now().toString(), title: t }]);
    setText('');
  };
  const remove = (id: string) => setItems(items.filter((i) => i.id !== id));

  return (
    <View style={{ flex: 1 }}>
      <Text style={ui.title}>{title}</Text>
      <Text style={ui.sub}>{subtitle}</Text>

      <View style={ui.card}>
        <View style={ui.rowBetween}>
          <Text style={ui.cardLabel}>Today</Text>
          <Text style={[ui.cardLabel, { color: C.accent }]}>{percent}%</Text>
        </View>
        <View style={ui.barBg}>
          <View style={[ui.barFill, { width: `${percent}%` }]} />
        </View>
        <Text style={ui.sub}>{count} of {items.length} done</Text>
      </View>

      <View style={[ui.card, { marginTop: 12, paddingVertical: 12 }]}>
        <View style={ui.rowBetween}>
          <Text style={ui.cardLabel}>Last 7 days</Text>
          <Text style={ui.sub}>{weekDone} / {items.length * 7}</Text>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          {week.map((w) => (
            <View key={w.key} style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ width: 18, height: BAR_H, backgroundColor: C.border, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' }}>
                <View style={{ height: w.pct * BAR_H, backgroundColor: w.key === today ? C.accent : '#2A8F66', borderRadius: 6 }} />
              </View>
              <Text style={{ color: w.key === today ? C.accent : C.sub, fontSize: 11, marginTop: 4 }}>{w.letter}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={ui.inputRow}>
        <TextInput
          style={ui.input}
          placeholder={placeholder}
          placeholderTextColor={C.sub}
          value={text}
          onChangeText={setText}
          onSubmitEditing={add}
        />
        <Pressable style={ui.addBtn} onPress={add}>
          <Ionicons name="add" size={26} color="#0F1115" />
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={ui.empty}>Nothing here yet. Add your first item.</Text>}
        renderItem={({ item }) => {
          const isDone = doneToday.includes(item.id);
          return (
            <Pressable style={ui.task} onPress={() => toggle(item.id)}>
              <Ionicons
                name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                size={26}
                color={isDone ? C.accent : C.sub}
              />
              <Text style={[ui.taskText, isDone && ui.taskDone]}>{item.title}</Text>
              <Pressable onPress={() => remove(item.id)} hitSlop={10}>
                <Ionicons name="trash-outline" size={20} color={C.sub} />
              </Pressable>
            </Pressable>
          );
        }}
      />
    </View>
  );
}