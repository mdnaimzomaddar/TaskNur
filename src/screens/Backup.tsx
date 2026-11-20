import { useState } from 'react';
import { View, Text, TextInput, Pressable, Share, ScrollView } from 'react-native';
import { showAlert, confirmAction } from '../lib/dialog';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../lib/shared';
import { rescheduleAll } from '../lib/notify';

const KEYS = ['tasks', 'prayer_items', 'prayer_done', 'islamic_items', 'islamic_done', 'study_items', 'study_done', 'goals', 'futures', 'reminders', 'settings'];

export default function Backup({ onClose }: { onClose: () => void }) {
  const { C, ui } = useApp();
  const [text, setText] = useState('');

  const exportData = async () => {
    const pairs = await AsyncStorage.multiGet(KEYS);
    const data: Record<string, string> = {};
    pairs.forEach(([k, v]) => {
      if (v !== null) data[k] = v;
    });
    const payload = JSON.stringify({ app: 'TaskNur', version: 2, exportedAt: new Date().toISOString(), data });
    await Share.share({ message: payload });
  };

  const restore = () => {
    let parsed: any;
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      showAlert('Invalid backup', 'The pasted text is not a valid TaskNur backup.');
      return;
    }
    if (parsed?.app !== 'TaskNur' || typeof parsed.data !== 'object' || !parsed.data) {
      showAlert('Invalid backup', 'This does not look like a TaskNur backup.');
      return;
    }
    const entries: [string, string][] = [];
    for (const k of KEYS) {
      const v = parsed.data[k];
      if (typeof v !== 'string') continue;
      try {
        JSON.parse(v);
      } catch {
        continue;
      }
      entries.push([k, v]);
    }
    if (!entries.length) {
      showAlert('Nothing to restore', 'No usable data found in the backup.');
      return;
    }
    confirmAction('Replace current data?', 'Your current tasks, goals and lists will be replaced by the backup.', 'Restore', async () => {
      await AsyncStorage.multiSet(entries);
      await rescheduleAll();
      setText('');
      showAlert('Restored', 'Close the app completely and open it again to apply everything.');
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.rowBetween}>
        <Text style={ui.title}>Backup</Text>
        <Pressable onPress={onClose} style={{ padding: 6 }}>
          <Ionicons name="close" size={28} color={C.text} />
        </Pressable>
      </View>
      <Text style={ui.sub}>Keep your data safe or move it to a new phone</Text>

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={ui.card}>
          <Text style={ui.cardLabel}>1. Export</Text>
          <Text style={[ui.sub, { marginBottom: 14 }]}>Creates a backup text. Save it in WhatsApp (message yourself), Notes or email.</Text>
          <Pressable onPress={exportData} style={[ui.addBtn, { width: '100%', flexDirection: 'row', gap: 8 }]}>
            <Ionicons name="share-outline" size={22} color={C.onAccent} />
            <Text style={{ color: C.onAccent, fontWeight: '700', fontSize: 16 }}>Export backup</Text>
          </Pressable>
        </View>

        <View style={ui.card}>
          <Text style={ui.cardLabel}>2. Restore</Text>
          <Text style={[ui.sub, { marginBottom: 14 }]}>Paste the backup text you saved earlier, then tap Restore.</Text>
          <TextInput
            style={[ui.inputBox, { height: 130, paddingTop: 12, textAlignVertical: 'top' }]}
            placeholder="Paste backup here..."
            placeholderTextColor={C.sub}
            multiline
            value={text}
            onChangeText={setText}
          />
          <Pressable onPress={restore} style={[ui.addBtn, { width: '100%', marginTop: 12, backgroundColor: C.border, flexDirection: 'row', gap: 8 }]}>
            <Ionicons name="download-outline" size={22} color={C.text} />
            <Text style={{ color: C.text, fontWeight: '700', fontSize: 16 }}>Restore</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}