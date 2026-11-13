import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useState } from "react";
import {
    Alert,
    FlatList,
    Platform,
    Pressable,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import { C, ui, useStored } from "../lib/shared";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type Reminder = {
  id: string;
  title: string;
  hour: number;
  minute: number;
  enabled: boolean;
  notifId?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

async function ensurePermission() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("reminders", {
      name: "Reminders",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

function schedule(r: Reminder) {
  return Notifications.scheduleNotificationAsync({
    content: { title: "TaskNur", body: r.title, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: r.hour,
      minute: r.minute,
      channelId: "reminders",
    },
  });
}

export default function Reminders({ onClose }: { onClose: () => void }) {
  const [list, setList] = useStored<Reminder[]>("reminders", []);
  const [title, setTitle] = useState("");
  const [hh, setHh] = useState("");
  const [mm, setMm] = useState("");

  const add = async () => {
    const t = title.trim();
    const h = parseInt(hh, 10);
    const m = parseInt(mm, 10);
    if (!t || isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      Alert.alert(
        "Check input",
        "Enter a title and a valid 24-hour time (HH 0-23, MM 0-59).",
      );
      return;
    }
    if (!(await ensurePermission())) {
      Alert.alert(
        "Permission needed",
        "Please allow notifications in phone settings.",
      );
      return;
    }
    const r: Reminder = {
      id: Date.now().toString(),
      title: t,
      hour: h,
      minute: m,
      enabled: true,
    };
    r.notifId = await schedule(r);
    setList([...list, r]);
    setTitle("");
    setHh("");
    setMm("");
  };

  const toggle = async (r: Reminder) => {
    if (r.enabled) {
      if (r.notifId)
        await Notifications.cancelScheduledNotificationAsync(r.notifId);
      setList(
        list.map((x) =>
          x.id === r.id ? { ...x, enabled: false, notifId: undefined } : x,
        ),
      );
    } else {
      if (!(await ensurePermission())) return;
      const nid = await schedule(r);
      setList(
        list.map((x) =>
          x.id === r.id ? { ...x, enabled: true, notifId: nid } : x,
        ),
      );
    }
  };

  const remove = async (r: Reminder) => {
    if (r.notifId)
      await Notifications.cancelScheduledNotificationAsync(r.notifId);
    setList(list.filter((x) => x.id !== r.id));
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.rowBetween}>
        <Text style={ui.title}>Reminders</Text>
        <Pressable onPress={onClose} hitSlop={10}>
          <Ionicons name="close" size={28} color={C.text} />
        </Pressable>
      </View>
      <Text style={ui.sub}>Daily notifications at the time you choose</Text>

      <View style={{ marginTop: 18, gap: 10 }}>
        <TextInput
          style={[ui.input, { flex: 0 }]}
          placeholder="Reminder (e.g. Read Quran)"
          placeholderTextColor={C.sub}
          value={title}
          onChangeText={setTitle}
        />
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <TextInput
            style={[ui.input, { flex: 0, width: 70, textAlign: "center" }]}
            placeholder="HH"
            placeholderTextColor={C.sub}
            keyboardType="numeric"
            maxLength={2}
            value={hh}
            onChangeText={setHh}
          />
          <Text style={{ color: C.text, fontSize: 22 }}>:</Text>
          <TextInput
            style={[ui.input, { flex: 0, width: 70, textAlign: "center" }]}
            placeholder="MM"
            placeholderTextColor={C.sub}
            keyboardType="numeric"
            maxLength={2}
            value={mm}
            onChangeText={setMm}
          />
          <Text style={[ui.sub, { flex: 1, marginTop: 0 }]}>24-hour time</Text>
          <Pressable style={ui.addBtn} onPress={add}>
            <Ionicons name="add" size={26} color="#0F1115" />
          </Pressable>
        </View>
      </View>

      <FlatList
        style={{ marginTop: 18 }}
        data={list}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={ui.empty}>No reminders yet. Add your first one.</Text>
        }
        renderItem={({ item }) => (
          <View style={ui.task}>
            <View style={{ flex: 1 }}>
              <Text style={[ui.taskText, !item.enabled && ui.taskDone]}>
                {item.title}
              </Text>
              <Text
                style={{ color: item.enabled ? C.accent : C.sub, marginTop: 2 }}
              >
                {pad(item.hour)}:{pad(item.minute)} every day
              </Text>
            </View>
            <Switch
              value={item.enabled}
              onValueChange={() => toggle(item)}
              trackColor={{ false: C.border, true: "#2A8F66" }}
              thumbColor={item.enabled ? C.accent : C.sub}
            />
            <Pressable onPress={() => remove(item)} hitSlop={10}>
              <Ionicons name="trash-outline" size={20} color={C.sub} />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}
