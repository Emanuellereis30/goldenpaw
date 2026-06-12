import * as Notifications from 'expo-notifications';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Platform } from 'react-native';
import { auth, db } from '../../firebaseConfig';

export interface Reminder {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  scheduledAt: Timestamp | Date;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  petId?: string;
  status: 'active' | 'inactive';
  completed: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  notificationId?: string;
}

export interface CreateReminderInput {
  type: string;
  title: string;
  description: string;
  scheduledAt: Date;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  petId?: string;
  status: 'active' | 'inactive';
}

// Configurar comportamento de notificação (mobile) - com supressão de tipo para compatibilidade
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }) as any,
  });
}

// ========== FUNÇÕES AUXILIARES PARA NOTIFICAÇÕES ==========

async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('goldenpaw_lembretes', {
      name: 'Lembretes Golden Paw',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      enableLights: true,
    });
  }
}

export async function requestNotificationPermissions() {
  if (Platform.OS === 'web') return true;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Erro ao solicitar permissões de notificação:', error);
    return false;
  }
}

/**
 * Agendar notificação local (corrigido para Android e com logs)
 */
async function scheduleNotification(reminder: Reminder): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  await ensureAndroidChannel();

  try {
    // Garantir que scheduledAt seja um objeto Date válido
    let scheduledAtDate: Date;
    if (reminder.scheduledAt instanceof Timestamp) {
      scheduledAtDate = reminder.scheduledAt.toDate();
    } else if (reminder.scheduledAt instanceof Date) {
      scheduledAtDate = reminder.scheduledAt;
    } else {
      scheduledAtDate = new Date(reminder.scheduledAt as any);
    }

    const now = new Date();
    if (scheduledAtDate <= now) {
      console.warn('Data de agendamento já passou');
      return null;
    }

    const hour = scheduledAtDate.getHours();
    const minute = scheduledAtDate.getMinutes();
    console.log(`🔔 Agendando notificação para ${hour}:${minute} (recurrence: ${reminder.recurrence})`);

    let trigger: Notifications.NotificationTriggerInput;

    switch (reminder.recurrence) {
      case 'daily':
        trigger = {
          hour,
          minute,
          repeats: true,
          channelId: 'goldenpaw_lembretes',
        };
        break;
      case 'weekly':
        let weekday = scheduledAtDate.getDay();
        if (weekday === 0) weekday = 7;
        trigger = {
          weekday,
          hour,
          minute,
          repeats: true,
          channelId: 'goldenpaw_lembretes',
        };
        break;
      case 'monthly':
        trigger = {
          day: scheduledAtDate.getDate(),
          hour,
          minute,
          repeats: true,
          channelId: 'goldenpaw_lembretes',
        };
        break;
      case 'yearly':
        trigger = {
          month: scheduledAtDate.getMonth() + 1,
          day: scheduledAtDate.getDate(),
          hour,
          minute,
          repeats: true,
          channelId: 'goldenpaw_lembretes',
        };
        break;
      default: // 'none'
        trigger = {
          date: scheduledAtDate,
          channelId: 'goldenpaw_lembretes',
          type: Notifications.SchedulableTriggerInputTypes.DATE,
        };
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.description,
        data: { reminderId: reminder.id, petId: reminder.petId || '' },
        sound: 'default',
        badge: 1,
      },
      trigger,
    });

    console.log(`✅ Notificação agendada com ID: ${notificationId}`);
    return notificationId as string;
  } catch (error) {
    console.error('Erro ao agendar notificação:', error);
    return null;
  }
}

export async function cancelNotification(notificationId: string): Promise<void> {
  if (Platform.OS === 'web' || !notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Erro ao cancelar notificação:', error);
  }
}

// ========== FUNÇÕES CRUD DO FIRESTORE ==========

export async function createReminder(input: CreateReminderInput): Promise<Reminder> {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const now = new Date();
  const reminderData = {
    userId: user.uid,
    type: input.type,
    title: input.title,
    description: input.description,
    scheduledAt: Timestamp.fromDate(input.scheduledAt),
    recurrence: input.recurrence,
    petId: input.petId ?? null,
    status: input.status,
    completed: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'reminders'), reminderData);

  const reminder: Reminder = {
    id: docRef.id,
    userId: user.uid,
    type: input.type,
    title: input.title,
    description: input.description,
    scheduledAt: input.scheduledAt,
    recurrence: input.recurrence,
    petId: input.petId,
    status: input.status,
    completed: false,
    createdAt: now,
    updatedAt: now,
    notificationId: undefined,
  };

  if (input.status === 'active') {
    const notificationId = await scheduleNotification(reminder);
    if (notificationId) {
      await updateDoc(doc(db, 'reminders', docRef.id), { notificationId });
      reminder.notificationId = notificationId;
    }
  }

  return reminder;
}

export async function getUserReminders(): Promise<Reminder[]> {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const q = query(collection(db, 'reminders'), where('userId', '==', user.uid));
  const querySnapshot = await getDocs(q);
  const reminders: Reminder[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    reminders.push({
      id: doc.id,
      userId: data.userId,
      type: data.type,
      title: data.title,
      description: data.description,
      scheduledAt: data.scheduledAt,
      recurrence: data.recurrence,
      petId: data.petId === null ? undefined : data.petId,
      status: data.status,
      completed: data.completed,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      notificationId: data.notificationId,
    });
  });

  return reminders.sort((a, b) => {
    const dateA = a.scheduledAt instanceof Timestamp ? a.scheduledAt.toDate() : a.scheduledAt;
    const dateB = b.scheduledAt instanceof Timestamp ? b.scheduledAt.toDate() : b.scheduledAt;
    return dateA.getTime() - dateB.getTime();
  });
}

export async function updateReminder(reminderId: string, updates: Partial<Reminder>): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const docRef = doc(db, 'reminders', reminderId);
  const q = query(collection(db, 'reminders'), where('userId', '==', user.uid));
  const snapshot = await getDocs(q);
  let found = false;
  let oldNotificationId = '';

  for (const d of snapshot.docs) {
    if (d.id === reminderId) {
      found = true;
      oldNotificationId = d.data().notificationId;
      break;
    }
  }
  if (!found) throw new Error('Lembrete não encontrado ou acesso negado');

  if (oldNotificationId) await cancelNotification(oldNotificationId);

  const updateData: any = { ...updates, updatedAt: serverTimestamp() };
  if (updates.scheduledAt && updates.scheduledAt instanceof Date) {
    updateData.scheduledAt = Timestamp.fromDate(updates.scheduledAt);
  }
  if (updates.hasOwnProperty('petId')) {
    updateData.petId = updates.petId === undefined ? null : updates.petId;
  }
  await updateDoc(docRef, updateData);

  if (updates.status === 'active' && updates.scheduledAt) {
    const fullReminder: Reminder = {
      id: reminderId,
      userId: user.uid,
      type: updates.type || '',
      title: updates.title || '',
      description: updates.description || '',
      scheduledAt: updates.scheduledAt,
      recurrence: updates.recurrence || 'none',
      petId: updates.petId,
      status: 'active',
      completed: updates.completed || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const newNotificationId = await scheduleNotification(fullReminder);
    if (newNotificationId) await updateDoc(docRef, { notificationId: newNotificationId });
  }
}

export async function deleteReminder(reminderId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const q = query(collection(db, 'reminders'), where('userId', '==', user.uid));
  const snapshot = await getDocs(q);
  let found = false;
  let notificationId = '';
  for (const d of snapshot.docs) {
    if (d.id === reminderId) {
      found = true;
      notificationId = d.data().notificationId;
      break;
    }
  }
  if (!found) throw new Error('Lembrete não encontrado ou acesso negado');

  if (notificationId) await cancelNotification(notificationId);
  await deleteDoc(doc(db, 'reminders', reminderId));
}

export async function completeReminder(reminderId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const docRef = doc(db, 'reminders', reminderId);
  const q = query(collection(db, 'reminders'), where('userId', '==', user.uid));
  const snapshot = await getDocs(q);
  let found = false;
  for (const d of snapshot.docs) {
    if (d.id === reminderId) { found = true; break; }
  }
  if (!found) throw new Error('Lembrete não encontrado ou acesso negado');

  await updateDoc(docRef, {
    completed: true,
    updatedAt: serverTimestamp(),
  });
}

export function filterRemindersByStatus(
  reminders: Reminder[],
  filterType: 'future' | 'past'
): Reminder[] {
  const now = new Date();
  return reminders.filter((reminder) => {
    const scheduledAt = reminder.scheduledAt instanceof Timestamp
      ? reminder.scheduledAt.toDate()
      : reminder.scheduledAt;
    if (filterType === 'future') {
      return scheduledAt > now && !reminder.completed && reminder.status === 'active';
    } else {
      return (scheduledAt <= now || reminder.completed) && reminder.status === 'active';
    }
  });
}