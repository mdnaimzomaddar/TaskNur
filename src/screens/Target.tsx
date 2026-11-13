import { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, ui, useStored } from '../lib/shared';

type Goal = { id: string; title: string; current: number; total: number };

export default function Target() {
  const [goals, setGoals] = useStored<Goal[]>('goals', []);
  const [title, setTitle] = useState('');
  const [total, setTotal] = useState('');

  const add = () => {
    const t = title.trim();
    const n = parseInt(total, 10);
    if (!t || !n || n < 1) return;
    setGoals([...goals, { id: Date.now().toString(), title: t, current: 0, total: n }]);
    setTitle('');
    setTotal('');
  };
  const change = (id: string, delta: number) =>
    setGoals(goals.map((g) => (g.id === id ? { ...g, current: Math.max(0, Math.min(g.total, g.current + delta)) } : g)));
  const remove = (id: string) => setGoals(goals.filter((g) => g.id !== id));

  return (
    <View style={{ flex: 1 }}>
      <Text style={ui.title}>Target</Text>
      <Text style={ui.sub}>Set goals and track your progress</Text>

      <View style={ui.inputRow}>
        <TextInput
          style={ui.input}
          placeholder="Goal (e.g. Read books)"
          placeholderTextColor={C.sub}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[ui.input, { flex: 0, width: 70, textAlign: 'center' }]}
          placeholder="Total"
          placeholderTextColor={C.sub}
          keyboardType="numeric"
          value={total}
          onChangeText={setTotal}
          onSubmitEditing={add}
        />
        <Pressable style={ui.addBtn} onPress={add}>
          <Ionicons name="add" size={26} color="#0F1115" />
        </Pressable>
      </View>

      <FlatList
        data={goals}
        keyExtractor={(g) => g.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={ui.empty}>No goals yet. Add your first target.</Text>}
        renderItem={({ item }) => {
          const p = Math.round((item.current / item.total) * 100);
          const finished = item.current >= item.total;
          return (
            <View style={[ui.card, { marginTop: 0, marginBottom: 12 }]}>
              <View style={ui.rowBetween}>
                <Text style={[ui.cardLabel, { flex: 1 }]}>{item.title}</Text>
                {finished && <Ionicons name="trophy" size={20} color={C.accent} style={{ marginRight: 10 }} />}
                <Pressable onPress={() => remove(item.id)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={20} color={C.sub} />
                </Pressable>
              </View>
              <View style={ui.barBg}>
                <View style={[ui.barFill, { width: `${p}%` }]} />
              </View>
              <View style={ui.rowBetween}>
                <Text style={ui.sub}>{item.current} / {item.total}  ({p}%)</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable onPress={() => change(item.id, -1)} style={btn}>
                    <Ionicons name="remove" size={20} color={C.text} />
                  </Pressable>
                  <Pressable onPress={() => change(item.id, 1)} style={[btn, { backgroundColor: C.accent }]}>
                    <Ionicons name="add" size={20} color="#0F1115" />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const btn = {
  width: 38,
  height: 38,
  borderRadius: 10,
  backgroundColor: C.border,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};