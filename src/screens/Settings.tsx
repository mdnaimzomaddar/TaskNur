import type { ReactNode } from 'react';
import { useState } from 'react';
import { View, Text, Pressable, Switch, ScrollView, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../lib/shared';
import { sendTest } from '../lib/notify';

function Row({
  icon,
  title,
  sub,
  onPress,
  right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub?: string;
  onPress?: () => void;
  right?: ReactNode;
}) {
  const { C, ui } = useApp();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[ui.card, { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 14 }]}
    >
      <Ionicons name={icon} size={24} color={C.accent} />
      <View style={{ flex: 1 }}>
        <Text style={ui.cardLabel}>{title}</Text>
        {!!sub && <Text style={[ui.sub, { marginTop: 2 }]}>{sub}</Text>}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={20} color={C.sub} /> : null)}
    </Pressable>
  );
}

export default function Settings({ onOpen }: { onOpen: (p: 'reminders' | 'backup') => void }) {
  const { C, ui, settings, setSettings } = useApp();
  const [msg, setMsg] = useState('');

  const test = async () => {
    if (Platform.OS !== 'android') {
      setMsg('Notifications only work in the phone app, not in the browser.');
      return;
    }
    const ok = await sendTest();
    setMsg(
      ok
        ? 'A test notification will appear in about 5 seconds. You can close the app or lock the screen while you wait.'
        : 'Notifications are blocked. Tap "Phone notification settings" below and allow them.'
    );
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
      <Text style={ui.title}>Settings</Text>
      <Text style={ui.sub}>Make TaskNur work your way</Text>

      <Text style={ui.section}>APPEARANCE</Text>
      <View style={[ui.card, { marginTop: 0, flexDirection: 'row', gap: 10 }]}>
        {(['dark', 'light'] as const).map((m) => {
          const active = settings.theme === m;
          return (
            <Pressable
              key={m}
              onPress={() => setSettings({ theme: m })}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: active ? C.accent : C.border,
              }}
            >
              <Ionicons name={m === 'dark' ? 'moon' : 'sunny'} size={18} color={active ? C.onAccent : C.text} />
              <Text style={{ color: active ? C.onAccent : C.text, fontWeight: '700' }}>{m === 'dark' ? 'Dark' : 'Light'}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={ui.section}>TABS</Text>
      <Row
        icon="moon-outline"
        title="Prayer tab"
        sub="Daily prayer checklist. Turn on if you need it."
        right={
          <Switch
            value={settings.prayerEnabled}
            onValueChange={(v) => setSettings({ prayerEnabled: v })}
            trackColor={{ false: C.border, true: C.accentDim }}
            thumbColor={settings.prayerEnabled ? C.accent : C.sub}
          />
        }
      />

      <Row
        icon="book-outline"
        title="Study tab"
        sub="General study and learning list. Turn off if you don't need it."
        right={
          <Switch
            value={settings.studyEnabled}
            onValueChange={(v) => setSettings({ studyEnabled: v })}
            trackColor={{ false: C.border, true: C.accentDim }}
            thumbColor={settings.studyEnabled ? C.accent : C.sub}
          />
        }
      />

      <Text style={ui.section}>NOTIFICATIONS</Text>
      <Row icon="alarm-outline" title="Daily reminders" sub="Repeat every day at a set time" onPress={() => onOpen('reminders')} />
      <Row icon="notifications-outline" title="Send test notification" sub="Appears after 5 seconds" onPress={test} />
      {!!msg && <Text style={[ui.sub, { marginTop: 10 }]}>{msg}</Text>}
      <Row icon="settings-outline" title="Phone notification settings" sub="Allow notifications, autostart and battery" onPress={() => {
          if (Platform.OS === 'android') Linking.openSettings();
        }} />
      <Text style={[ui.sub, { marginTop: 10 }]}>
        If the test works but reminders come late or never: on Xiaomi/Redmi open Settings, Apps, TaskNur, then turn on Autostart and set Battery saver to No restrictions.
      </Text>

      <Text style={ui.section}>HISTORY</Text>
      <View style={[ui.card, { marginTop: 0 }]}>
        <Text style={ui.cardLabel}>Keep history for</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
          {[
            { d: 30, l: '30 days' },
            { d: 90, l: '90 days' },
            { d: 365, l: '1 year' },
            { d: 0, l: 'Forever' },
          ].map((o) => {
            const active = settings.keepDays === o.d;
            return (
              <Pressable
                key={o.d}
                onPress={() => setSettings({ keepDays: o.d })}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 20,
                  marginRight: 8,
                  marginBottom: 8,
                  backgroundColor: active ? C.accent : C.border,
                }}
              >
                <Text style={{ color: active ? C.onAccent : C.text, fontWeight: '600', fontSize: 13 }}>{o.l}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={ui.sub}>
          Tasks and checklist records older than this are deleted automatically the next time you open the app. Export a backup first if you want to keep a copy.
        </Text>
      </View>

      <Text style={ui.section}>DATA</Text>
      <Row icon="cloud-upload-outline" title="Backup and restore" sub="Save your data or move it to a new phone" onPress={() => onOpen('backup')} />
    </ScrollView>
  );
}