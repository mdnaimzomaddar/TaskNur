import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useApp } from '../lib/shared';
import Checklist from './Checklist';

export default function Prayer() {
  const { C } = useApp();
  const [mode, setMode] = useState<'prayers' | 'islamic'>('prayers');

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        {(
          [
            { key: 'prayers', label: 'Prayers' },
            { key: 'islamic', label: 'Islamic study' },
          ] as const
        ).map((m) => {
          const active = mode === m.key;
          return (
            <Pressable
              key={m.key}
              onPress={() => setMode(m.key)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: active ? C.accent : C.card,
                borderWidth: 1,
                borderColor: active ? C.accent : C.border,
              }}
            >
              <Text style={{ color: active ? C.onAccent : C.text, fontWeight: '700' }}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {mode === 'prayers' ? (
        <Checklist
          key="prayers"
          title="Prayer"
          subtitle="Daily prayers, nafl and zikr"
          storageKey="prayer"
          defaults={['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']}
          placeholder="Add nafl / zikr..."
        />
      ) : (
        <Checklist
          key="islamic"
          title="Islamic study"
          subtitle="Quran, hadith and Islamic books"
          storageKey="islamic"
          defaults={[]}
          placeholder="e.g. Quran 1 page"
        />
      )}
    </View>
  );
}