import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Checklist from "../screens/Checklist";
import Target from "../screens/Target";
import Weekly from "../screens/Weekly";
import Reminders from "../screens/Reminders";
import { localDate, calcStreaks } from "../lib/shared";
import Backup from "../screens/Backup";



const C = {
  bg: "#0F1115",
  card: "#1A1D24",
  border: "#272B35",
  text: "#F2F4F8",
  sub: "#8A91A0",
  accent: "#3DDC97",
};

type Task = { id: string; title: string; done: boolean; date: string };
type TabKey = "today" | "weekly" | "prayer" | "study" | "target";

const TABS: {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "today", label: "Today", icon: "checkmark-circle-outline" },
  { key: "weekly", label: "Weekly", icon: "bar-chart-outline" },
  { key: "prayer", label: "Prayer", icon: "moon-outline" },
  { key: "study", label: "Study", icon: "book-outline" },
  { key: "target", label: "Target", icon: "flag-outline" },
];

const todayStr = () => localDate();

function TodayScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("tasks")
      .then((v) => v && setTasks(JSON.parse(v)))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks, loaded]);

  const today = todayStr();
  const list = tasks.filter((t) => t.date === today);
  const doneCount = list.filter((t) => t.done).length;
  const percent = list.length ? Math.round((doneCount / list.length) * 100) : 0;

  const addTask = () => {
    const title = text.trim();
    if (!title) return;
    setTasks([
      ...tasks,
      { id: Date.now().toString(), title, done: false, date: today },
    ]);
    setText("");
  };
  const toggle = (id: string) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id: string) => setTasks(tasks.filter((t) => t.id !== id));

  return (
    <View style={{ flex: 1 }}>
      <Text style={s.title}>Today</Text>
      <Text style={s.sub}>{new Date().toDateString()}</Text>
      <Text style={[s.sub, { color: C.accent }]}>🔥 {calcStreaks(tasks).current} day streak</Text>

      <View style={s.card}>
        <View style={s.rowBetween}>
          <Text style={s.cardLabel}>Daily progress</Text>
          <Text style={[s.cardLabel, { color: C.accent }]}>{percent}%</Text>
        </View>
        <View style={s.barBg}>
          <View style={[s.barFill, { width: `${percent}%` }]} />
        </View>
        <Text style={s.sub}>
          {doneCount} of {list.length} tasks done
        </Text>
      </View>

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Add a new task..."
          placeholderTextColor={C.sub}
          value={text}
          onChangeText={setText}
          onSubmitEditing={addTask}
        />
        <Pressable style={s.addBtn} onPress={addTask}>
          <Ionicons name="add" size={26} color="#0F1115" />
        </Pressable>
      </View>

      <FlatList
        data={list}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={[s.sub, { textAlign: "center", marginTop: 30 }]}>
            No tasks yet. Add your first one.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable style={s.task} onPress={() => toggle(item.id)}>
            <Ionicons
              name={item.done ? "checkmark-circle" : "ellipse-outline"}
              size={26}
              color={item.done ? C.accent : C.sub}
            />
            <Text style={[s.taskText, item.done && s.taskDone]}>
              {item.title}
            </Text>
            <View style={{ position: 'absolute', right: 14, top: 20, zIndex: 10, flexDirection: 'row' }}>
              <Pressable onPress={() => setShowBackup(true)} style={{ padding: 6 }}>
                <Ionicons name="cloud-upload-outline" size={26} color={C.text} />
              </Pressable>
              <Pressable onPress={() => setShowRem(true)} style={{ padding: 6 }}>
                <Ionicons name="notifications-outline" size={26} color={C.text} />
              </Pressable>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

// function ComingSoon({ name }: { name: string }) {
//   return (
//     <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
//       <Text style={s.title}>{name}</Text>
//       <Text style={s.sub}>Coming in the next step</Text>
//     </View>
//   );
// }

export default function App() {
  const [tab, setTab] = useState<TabKey>("today");
  const [showRem, setShowRem] = useState(false);
  const [showBackup, setShowBackup] = useState(false);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={s.content}>
        <View
          style={{
            position: "absolute",
            right: 14,
            top: 20,
            zIndex: 10,
            flexDirection: "row",
          }}
        >
          <Pressable onPress={() => setShowBackup(true)} style={{ padding: 6 }}>
            <Ionicons name="cloud-upload-outline" size={26} color={C.text} />
          </Pressable>
          <Pressable onPress={() => setShowRem(true)} style={{ padding: 6 }}>
            <Ionicons name="notifications-outline" size={26} color={C.text} />
          </Pressable>
        </View>

        {tab === "today" && <TodayScreen />}
        {tab === "weekly" && <Weekly />}
        {tab === "prayer" && (
          <Checklist
            title="Prayer"
            subtitle="Daily prayers, nafl and zikr"
            storageKey="prayer"
            defaults={["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]}
            placeholder="Add nafl / zikr..."
          />
        )}
        {tab === "study" && (
          <Checklist
            title="Study"
            subtitle="Quran, books and learning activities"
            storageKey="study"
            defaults={[]}
            placeholder="e.g. Quran 1 page"
          />
        )}
        {tab === "target" && <Target />}
      </View>

      <View style={s.tabBar}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            style={s.tabItem}
            onPress={() => setTab(t.key)}
          >
            <Ionicons
              name={t.icon}
              size={22}
              color={tab === t.key ? C.accent : C.sub}
            />
            <Text style={[s.tabLabel, tab === t.key && { color: C.accent }]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Modal
        visible={showRem}
        animationType="slide"
        onRequestClose={() => setShowRem(false)}
      >
        <SafeAreaView style={s.safe}>
          <View style={s.content}>
            <Reminders onClose={() => setShowRem(false)} />
          </View>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showBackup}
        animationType="slide"
        onRequestClose={() => setShowBackup(false)}
      >
        <SafeAreaView style={s.safe}>
          <View style={s.content}>
            <Backup onClose={() => setShowBackup(false)} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  title: { color: C.text, fontSize: 30, fontWeight: "700" },
  sub: { color: C.sub, fontSize: 14, marginTop: 4 },
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  cardLabel: { color: C.text, fontSize: 15, fontWeight: "600" },
  barBg: {
    height: 10,
    backgroundColor: C.border,
    borderRadius: 6,
    marginVertical: 12,
    overflow: "hidden",
  },
  barFill: { height: 10, backgroundColor: C.accent, borderRadius: 6 },
  inputRow: { flexDirection: "row", gap: 10, marginVertical: 16 },
  input: {
    flex: 1,
    backgroundColor: C.card,
    color: C.text,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: C.border,
  },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  task: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.card,
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  taskText: { flex: 1, color: C.text, fontSize: 16 },
  taskDone: { color: C.sub, textDecorationLine: "line-through" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingVertical: 8,
  },
  tabItem: { flex: 1, alignItems: "center", gap: 2 },
  tabLabel: { color: C.sub, fontSize: 11 },
});
