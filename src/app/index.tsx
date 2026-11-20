import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, StatusBar, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider, useApp } from '../lib/shared';
import { rescheduleAll } from '../lib/notify';
import Today from '../screens/Today';
import Weekly from '../screens/Weekly';
import Checklist from '../screens/Checklist';
import Prayer from '../screens/Prayer';
import Target from '../screens/Target';
import Reminders from '../screens/Reminders';
import Backup from '../screens/Backup';
import Settings from '../screens/Settings';

type TabKey = 'today' | 'weekly' | 'prayer' | 'study' | 'target';
type Panel = null | 'reminders' | 'backup';

const ALL_TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'today', label: 'Today', icon: 'checkmark-circle-outline' },
  { key: 'weekly', label: 'Weekly', icon: 'bar-chart-outline' },
  { key: 'prayer', label: 'Prayer', icon: 'moon-outline' },
  { key: 'study', label: 'Study', icon: 'book-outline' },
  { key: 'target', label: 'Target', icon: 'flag-outline' },
];

function App() {
  const { C, settings } = useApp();
  const [tab, setTab] = useState<TabKey>('today');
  const [showSettings, setShowSettings] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);

  const tabs = ALL_TABS.filter((t) => (t.key !== 'prayer' || settings.prayerEnabled) && (t.key !== 'study' || settings.studyEnabled));

  const s = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: C.bg },
        content: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
        header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 44 },
        brand: { color: C.accent, fontSize: 16, fontWeight: '700' },
        tabBar: { flexDirection: 'row', backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border, paddingVertical: 8 },
        tabItem: { flex: 1, alignItems: 'center', gap: 2 },
        tabLabel: { color: C.sub, fontSize: 11 },
      }),
    [C]
  );

  // অ্যাপ খুললে সব রিমাইন্ডার নতুন করে সেট হবে
  useEffect(() => {
    rescheduleAll();
  }, []);

  // ব্যাক বাটন: ভেতরের পেজ, তারপর Settings, তারপর Today, তারপর অ্যাপ বন্ধ
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (panel) {
        setPanel(null);
        return true;
      }
      if (showSettings) {
        setShowSettings(false);
        return true;
      }
      if (tab !== 'today') {
        setTab('today');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [panel, showSettings, tab]);

  const toggleSettings = () => {
    setPanel(null);
    setShowSettings((v) => !v);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle={settings.theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
      <View style={s.content}>
        <View style={s.header}>
          <Text style={s.brand}>TaskNur</Text>
          <Pressable onPress={toggleSettings} style={{ padding: 8 }}>
            <Ionicons name={showSettings ? 'close' : 'settings-outline'} size={26} color={showSettings ? C.accent : C.text} />
          </Pressable>
        </View>

        {showSettings ? (
          <>
            {panel === null && <Settings onOpen={setPanel} />}
            {panel === 'reminders' && <Reminders onClose={() => setPanel(null)} />}
            {panel === 'backup' && <Backup onClose={() => setPanel(null)} />}
          </>
        ) : (
          <>
            {tab === 'today' && <Today />}
            {tab === 'weekly' && <Weekly />}
            {tab === 'prayer' && <Prayer />}
            {tab === 'study' && (
              <Checklist
                title="Study"
                subtitle="Books, courses and learning activities"
                storageKey="study"
                defaults={[]}
                placeholder="e.g. Read 20 pages"
              />
            )}
            {tab === 'target' && <Target />}
          </>
        )}
      </View>

      <View style={s.tabBar}>
        {tabs.map((t) => {
          const active = !showSettings && tab === t.key;
          return (
            <Pressable
              key={t.key}
              style={s.tabItem}
              onPress={() => {
                setPanel(null);
                setShowSettings(false);
                setTab(t.key);
              }}
            >
              <Ionicons name={t.icon} size={22} color={active ? C.accent : C.sub} />
              <Text style={[s.tabLabel, active && { color: C.accent }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function Root() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}