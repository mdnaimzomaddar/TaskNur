import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHANNEL = 'tasknur-reminders';
const SUPPORTED = Platform.OS === 'android';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

export async function ensurePermission(): Promise<boolean> {
  if (!SUPPORTED) return true;
  try {
    await ensureChannel();
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

// প্রতিদিন নির্দিষ্ট সময়ে
export async function scheduleDaily(id: string, body: string, hour: number, minute: number) {
  if (!SUPPORTED) return;
  await Notifications.scheduleNotificationAsync({
    identifier: 'rem-' + id,
    content: { title: 'TaskNur', body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL,
    },
  });
}

// নির্দিষ্ট তারিখ ও সময়ে একবার
export async function scheduleOnce(id: string, body: string, when: Date) {
  if (!SUPPORTED) return;
  await Notifications.scheduleNotificationAsync({
    identifier: 'task-' + id,
    content: { title: 'Task reminder', body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
      channelId: CHANNEL,
    },
  });
}

// Future target এর রিমাইন্ডার
export async function scheduleFuture(id: string, body: string, when: Date) {
  if (!SUPPORTED) return;
  await Notifications.scheduleNotificationAsync({
    identifier: 'fut-' + id,
    content: { title: 'Target reminder', body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
      channelId: CHANNEL,
    },
  });
}

export async function cancelNotif(identifier: string) {
  if (!SUPPORTED) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {}
}

// ৫ সেকেন্ড পরে পরীক্ষামূলক নোটিফিকেশন
export async function sendTest(): Promise<boolean> {
  if (!SUPPORTED) return false;
  try {
    if (!(await ensurePermission())) return false;
    await Notifications.scheduleNotificationAsync({
      content: { title: 'TaskNur', body: 'Test notification works!', sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        channelId: CHANNEL,
      },
    });
    return true;
  } catch {
    return false;
  }
}

export const whenOf = (date: string, time: string) => {
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, mi, 0, 0);
};

// অ্যাপ খুললে সব রিমাইন্ডার নতুন করে সেট করা হয়, যাতে ফোন বন্ধ-চালু বা আপডেটে হারিয়ে না যায়
export async function rescheduleAll() {
  if (!SUPPORTED) return;
  try {
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return;
    await ensureChannel();
    await Notifications.cancelAllScheduledNotificationsAsync();

    const [r, t, f] = await Promise.all([AsyncStorage.getItem('reminders'), AsyncStorage.getItem('tasks'), AsyncStorage.getItem('futures')]);
    const futures: any[] = f ? JSON.parse(f) : [];
    const reminders: any[] = r ? JSON.parse(r) : [];
    const tasks: any[] = t ? JSON.parse(t) : [];
    const now = Date.now();

    for (const x of reminders) {
      if (x.enabled) await scheduleDaily(x.id, x.title, x.hour, x.minute);
    }
    for (const x of futures) {
      if (!x.done && x.time) {
        const when = whenOf(x.date, x.time);
        if (when.getTime() > now) await scheduleFuture(x.id, x.title, when);
      }
    }
    for (const x of tasks) {
      if (!x.done && x.time) {
        const when = whenOf(x.date, x.time);
        if (when.getTime() > now) await scheduleOnce(x.id, x.title, when);
      }
    }
  } catch {}
}