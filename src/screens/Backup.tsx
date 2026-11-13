import { useState } from 'react';
import { View, Text, TextInput, Pressable, Share, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { C, ui } from '../lib/shared';

const KEYS = ['tasks', 'prayer_items', 'prayer_done', 'study_items', 'study_done', 'goals', 'reminders'];

export default function Backup({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('');

  const exportData = async () => {
    const pairs = await AsyncStorage.multiGet(KEYS);
    const data: Record<string, string> = {};
    pairs.forEach(([k, v]) => {
      if (v !== null) data[k] = v;
    });
    const payload = JSON.stringify({ app: 'TaskNur', version: 1, exportedAt: new Date().toISOString(), data });
    await Share.share({ message: payload });
  };

  const restore = () => {
    let parsed: any;
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      Alert.alert('Invalid backup', 'The pasted text is not a valid TaskNur backup.');
      return;
    }
    if (parsed?.app !== 'TaskNur' || typeof parsed.data !== 'object' || !parsed.data) {
      Alert.alert('Invalid backup', 'This does not look like a TaskNur backup.');
      return;
    }

    const entries: [string, string][] = [];
    for (const k of KEYS) {
      let v = parsed.data[k];
      if (typeof v !== 'string') continue;
      try {
        const obj = JSON.parse(v);
        if (k === 'reminders' && Array.isArray(obj)) {
          // নোটিফিকেশন নতুন করে চালু করতে হবে, তাই বন্ধ অবস্থায় ফেরত আসবে
          v = JSON.stringify(obj.map((r) => ({ ...r, enabled: false, notifId: undefined })));
        }
      } catch {
        continue;
      }
      entries.push([k, v]);
    }
    if (!entries.length) {
      Alert.alert('Nothing to restore', 'No usable data found in the backup.');
      return;
    }

    Alert.alert('Replace current data?', 'Your current tasks, goals and lists will be replaced by the backup.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        style: 'destructive',
        onPress: async () => {
          await Notifications.cancelAllScheduledNotificationsAsync();
          await AsyncStorage.multiSet(entries);
          setText('');
          Alert.alert('Restored', 'Close the app completely and open it again. Reminders come back switched off, so turn them on again.');
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.rowBetween}>
        <Text style={ui.title}>Backup</Text>
        <Pressable onPress={onClose} hitSlop={10}>
          <Ionicons name="close" size={28} color={C.text} />
        </Pressable>
      </View>
      <Text style={ui.sub}>Keep your data safe or move it to a new phone</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={ui.card}>
          <Text style={ui.cardLabel}>1. Export</Text>
          <Text style={[ui.sub, { marginBottom: 14 }]}>
            Creates a backup text. Save it in WhatsApp (Message yourself), Notes or email.
          </Text>
          <Pressable onPress={exportData} style={[ui.addBtn, { width: '100%', flexDirection: 'row', gap: 8 }]}>
            <Ionicons name="share-outline" size={22} color="#0F1115" />
            <Text style={{ color: '#0F1115', fontWeight: '700', fontSize: 16 }}>Export backup</Text>
          </Pressable>
        </View>

        <View style={ui.card}>
          <Text style={ui.cardLabel}>2. Restore</Text>
          <Text style={[ui.sub, { marginBottom: 14 }]}>
            Paste the backup text you saved earlier, then tap Restore.
          </Text>
          <TextInput
            style={[ui.input, { flex: 0, height: 130, paddingTop: 12, textAlignVertical: 'top' }]}
            placeholder="Paste backup here..."
            placeholderTextColor={C.sub}
            multiline
            value={text}
            onChangeText={setText}
          />
          <Pressable
            onPress={restore}
            style={[ui.addBtn, { width: '100%', marginTop: 12, backgroundColor: C.border, flexDirection: 'row', gap: 8 }]}
          >
            <Ionicons name="download-outline" size={22} color={C.text} />
            <Text style={{ color: C.text, fontWeight: '700', fontSize: 16 }}>Restore</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}