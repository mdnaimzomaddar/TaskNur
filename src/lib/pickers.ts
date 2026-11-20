import { Platform } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

const two = (n: number) => String(n).padStart(2, '0');

// তারিখ বাছাই (আজকের আগের তারিখ বাছা যাবে না)
export function pickDate(current: Date, onPick: (d: Date) => void) {
  if (Platform.OS === 'web') {
    const ans = window.prompt('Enter date as YYYY-MM-DD', `${current.getFullYear()}-${two(current.getMonth() + 1)}-${two(current.getDate())}`);
    if (!ans) return;
    const m = ans.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!m) {
      window.alert('Please use the format YYYY-MM-DD, for example 2026-12-25');
      return;
    }
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (!isNaN(d.getTime())) onPick(d);
    return;
  }
  if (Platform.OS !== 'android') return;
  const min = new Date();
  min.setHours(0, 0, 0, 0);
  DateTimePickerAndroid.open({
    value: current,
    mode: 'date',
    minimumDate: min,
    onChange: (e, d) => {
      if (e.type === 'set' && d) onPick(d);
    },
  });
}

// সময় বাছাই (AM/PM সহ ১২ ঘণ্টার ঘড়ি)
export function pickTime(hour: number, minute: number, onPick: (h: number, m: number) => void) {
  if (Platform.OS === 'web') {
    const ans = window.prompt('Enter time as HH:MM (24-hour, e.g. 21:30)', `${two(hour)}:${two(minute)}`);
    if (!ans) return;
    const m = ans.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) {
      window.alert('Please use 24-hour time like 09:30 or 21:30');
      return;
    }
    onPick(Number(m[1]), Number(m[2]));
    return;
  }
  if (Platform.OS !== 'android') return;
  const v = new Date();
  v.setHours(hour, minute, 0, 0);
  DateTimePickerAndroid.open({
    value: v,
    mode: 'time',
    is24Hour: false,
    onChange: (e, d) => {
      if (e.type === 'set' && d) onPick(d.getHours(), d.getMinutes());
    },
  });
}