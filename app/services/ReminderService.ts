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

// Configurar comportamento de notificação
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Solicitar permissão para notificações no mobile
 */
export async function requestNotificationPermissions() {
  if (Platform.OS === 'web') {
    return true;
  }

  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Erro ao solicitar permissões de notificação:', error);
    return false;
  }
}

/**
 * Agendar notificação local
 */
async function scheduleNotification(reminder: Reminder): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null; // Notificações web não são suportadas
  }

  try {
    const scheduledAt = reminder.scheduledAt instanceof Timestamp
      ? reminder.scheduledAt.toDate()
      : reminder.scheduledAt;

    const now = new Date();
    const trigger = scheduledAt > now ? scheduledAt : null;

    if (!trigger) {
      console.warn('Data de agendamento já passou');
      return null;
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

    return notificationId as string;
  } catch (error) {
    console.error('Erro ao agendar notificação:', error);
    return null;
  }
}

/**
 * Cancelar notificação
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  if (Platform.OS === 'web' || !notificationId) {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Erro ao cancelar notificação:', error);
  }
}

/**
 * Criar um novo lembrete
 */
export async function createReminder(input: CreateReminderInput): Promise<Reminder> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const now = new Date();
    const reminderData = {
      userId: user.uid,
      type: input.type,
      title: input.title,
      description: input.description,
      scheduledAt: Timestamp.fromDate(input.scheduledAt),
      recurrence: input.recurrence,
      petId: input.petId || null,
      status: input.status,
      completed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'reminders'), reminderData);

    const reminder: Reminder = {
      id: docRef.id,
      ...reminderData,
      scheduledAt: input.scheduledAt,
      createdAt: now,
      updatedAt: now,
    };

    // Agendar notificação se no mobile
    if (input.status === 'active') {
      const notificationId = await scheduleNotification(reminder);
      if (notificationId) {
        await updateDoc(doc(db, 'reminders', docRef.id), { notificationId });
        reminder.notificationId = notificationId;
      }
    }

    return reminder;
  } catch (error) {
    console.error('Erro ao criar lembrete:', error);
    throw error;
  }
}

/**
 * Obter lembretes do usuário
 */
export async function getUserReminders(): Promise<Reminder[]> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const q = query(
      collection(db, 'reminders'),
      where('userId', '==', user.uid)
    );

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
        petId: data.petId,
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
  } catch (error) {
    console.error('Erro ao obter lembretes:', error);
    throw error;
  }
}

/**
 * Atualizar lembrete
 */
export async function updateReminder(
  reminderId: string,
  updates: Partial<Reminder>
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const docRef = doc(db, 'reminders', reminderId);
    const reminderDoc = await getDocs(query(collection(db, 'reminders'), where('userId', '==', user.uid)));
    
    let found = false;
    for (const remDoc of reminderDoc.docs) {
      if (remDoc.id === reminderId) {
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error('Lembrete não encontrado ou acesso negado');
    }

    // Cancelar notificação anterior se existir
    const currentReminder = (await getDocs(query(collection(db, 'reminders'), where('userId', '==', user.uid)))).docs
      .find(doc => doc.id === reminderId);
    
    if (currentReminder?.data().notificationId) {
      await cancelNotification(currentReminder.data().notificationId);
    }

    const updateData: any = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    if (updates.scheduledAt && updates.scheduledAt instanceof Date) {
      updateData.scheduledAt = Timestamp.fromDate(updates.scheduledAt);
    }

    await updateDoc(docRef, updateData);

    // Reagendar notificação se status ativo
    if (updates.status === 'active' && updates.scheduledAt) {
      const reminder: Reminder = {
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
      
      const notificationId = await scheduleNotification(reminder);
      if (notificationId) {
        await updateDoc(docRef, { notificationId });
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar lembrete:', error);
    throw error;
  }
}

/**
 * Deletar lembrete
 */
export async function deleteReminder(reminderId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const docRef = doc(db, 'reminders', reminderId);
    const reminderDoc = await getDocs(query(collection(db, 'reminders'), where('userId', '==', user.uid)));
    
    let found = false;
    let notificationId = '';
    
    for (const remDoc of reminderDoc.docs) {
      if (remDoc.id === reminderId) {
        found = true;
        notificationId = remDoc.data().notificationId;
        break;
      }
    }

    if (!found) {
      throw new Error('Lembrete não encontrado ou acesso negado');
    }

    // Cancelar notificação
    if (notificationId) {
      await cancelNotification(notificationId);
    }

    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erro ao deletar lembrete:', error);
    throw error;
  }
}

/**
 * Marcar lembrete como concluído
 */
export async function completeReminder(reminderId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const docRef = doc(db, 'reminders', reminderId);
    const reminderDoc = await getDocs(query(collection(db, 'reminders'), where('userId', '==', user.uid)));
    
    let found = false;
    for (const remDoc of reminderDoc.docs) {
      if (remDoc.id === reminderId) {
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error('Lembrete não encontrado ou acesso negado');
    }

    await updateDoc(docRef, {
      completed: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erro ao completar lembrete:', error);
    throw error;
  }
}

/**
 * Filtrar lembretes por status (futuros ou passados)
 */
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
      return scheduledAt > now && !reminder.completed;
    } else {
      return (scheduledAt <= now || reminder.completed) && reminder.status === 'active';
    }
  });
}
