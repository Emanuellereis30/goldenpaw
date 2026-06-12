import {
  completeReminder,
  createReminder,
  CreateReminderInput,
  deleteReminder,
  filterRemindersByStatus,
  getUserReminders,
  Reminder,
  requestNotificationPermissions,
  updateReminder,
} from '@/app/services/ReminderService';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Timestamp } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RemindersScreenProps {
  isLoggedIn: boolean;
  onNavigateToLogin: () => void;
}

type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'daily', label: 'Diariamente' },
  { value: 'weekly', label: 'Semanalmente' },
  { value: 'monthly', label: 'Mensalmente' },
  { value: 'yearly', label: 'Anualmente' },
];

const REMINDER_TYPES = [
  { value: 'appointment', label: 'Consulta' },
  { value: 'vaccination', label: 'Vacinação' },
  { value: 'medication', label: 'Medicamento' },
  { value: 'grooming', label: 'Banho/Tosa' },
  { value: 'feeding', label: 'Alimentação' },
  { value: 'other', label: 'Outro' },
];

export default function RemindersScreen({
  isLoggedIn,
  onNavigateToLogin,
}: RemindersScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<'future' | 'past'>('future');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRecurrenceMenu, setShowRecurrenceMenu] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'other',
    title: '',
    description: '',
    scheduledAt: new Date(),
    recurrence: 'none' as RecurrenceType,
    petId: '',
    status: 'active' as 'active' | 'inactive',
  });

  // Load reminders on mount or when login status changes
  useEffect(() => {
    if (isLoggedIn) {
      loadReminders();
      requestNotificationPermissions();
    }
  }, [isLoggedIn]);

  const loadReminders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserReminders();
      setReminders(data);
    } catch (error) {
      console.error('Erro ao carregar lembretes:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus lembretes.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        scheduledAt: new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          formData.scheduledAt.getHours(),
          formData.scheduledAt.getMinutes()
        ),
      }));
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setFormData(prev => ({
        ...prev,
        scheduledAt: new Date(
          formData.scheduledAt.getFullYear(),
          formData.scheduledAt.getMonth(),
          formData.scheduledAt.getDate(),
          selectedTime.getHours(),
          selectedTime.getMinutes()
        ),
      }));
    }
  };

  const handleSaveReminder = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Erro', 'O título do lembrete é obrigatório.');
      return;
    }

    setLoading(true);
    try {
      if (editingReminder) {
        await updateReminder(editingReminder.id, {
          ...formData,
          scheduledAt: formData.scheduledAt,
        });
        Alert.alert('Sucesso', 'Lembrete atualizado com sucesso!');
      } else {
        await createReminder(formData as CreateReminderInput);
        Alert.alert('Sucesso', 'Lembrete criado com sucesso!');
      }

      // Reload reminders
      await loadReminders();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar lembrete:', error);
      Alert.alert('Erro', 'Não foi possível salvar o lembrete.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditReminder = (reminder: Reminder) => {
    const scheduledAt = reminder.scheduledAt instanceof Timestamp
      ? reminder.scheduledAt.toDate()
      : reminder.scheduledAt;

    setFormData({
      type: reminder.type,
      title: reminder.title,
      description: reminder.description,
      scheduledAt,
      recurrence: reminder.recurrence,
      petId: reminder.petId || '',
      status: reminder.status,
    });
    setEditingReminder(reminder);
    setShowFormModal(true);
  };

  const handleCompleteReminder = async (reminderId: string) => {
    setLoading(true);
    try {
      await completeReminder(reminderId);
      Alert.alert('Sucesso', 'Lembrete marcado como concluído!');
      await loadReminders();
    } catch (error) {
      console.error('Erro ao completar lembrete:', error);
      Alert.alert('Erro', 'Não foi possível completar o lembrete.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReminder = (reminderId: string) => {
    Alert.alert(
      'Excluir lembrete',
      'Tem certeza que deseja excluir este lembrete?',
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Excluir',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteReminder(reminderId);
              Alert.alert('Sucesso', 'Lembrete excluído!');
              await loadReminders();
            } catch (error) {
              console.error('Erro ao deletar lembrete:', error);
              Alert.alert('Erro', 'Não foi possível excluir o lembrete.');
            } finally {
              setLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleCloseModal = () => {
    setShowFormModal(false);
    setEditingReminder(null);
    setFormData({
      type: 'other',
      title: '',
      description: '',
      scheduledAt: new Date(),
      recurrence: 'none',
      petId: '',
      status: 'active',
    });
  };

  const filteredReminders = filterRemindersByStatus(reminders, filterTab);

  const getReminderTypeLabel = (typeValue: string) => {
    return REMINDER_TYPES.find(t => t.value === typeValue)?.label || typeValue;
  };

  const getRecurrenceLabel = (recurrence: string) => {
    return RECURRENCE_OPTIONS.find(r => r.value === recurrence)?.label || recurrence;
  };

  if (!isLoggedIn) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.background, paddingTop: insets.top + 20 },
        ]}
      >
        <View style={styles.centerContent}>
          <Ionicons
            name="time-outline"
            size={64}
            color={theme.primary}
            style={{ marginBottom: 20 }}
          />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Faça login para ver seus lembretes
          </Text>
          <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
            Crie lembretes para nunca esquecer dos compromissos com seus pets.
          </Text>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: theme.primary }]}
            onPress={onNavigateToLogin}
          >
            <Text style={styles.loginButtonText}>Ir para Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingTop: insets.top + 10 },
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Lembretes</Text>
        <TouchableOpacity
          style={[styles.newButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowFormModal(true)}
        >
          <Ionicons name="add" size={22} color="#FFF" />
          <Text style={styles.newButtonText}>Novo</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: theme.border }]}>
        {(['future', 'past'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              {
                borderBottomColor:
                  filterTab === tab ? theme.primary : 'transparent',
                borderBottomWidth: filterTab === tab ? 3 : 0,
              },
            ]}
            onPress={() => setFilterTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: filterTab === tab ? theme.primary : theme.textSecondary,
                  fontWeight: filterTab === tab ? '700' : '500',
                },
              ]}
            >
              {tab === 'future' ? 'Futuros' : 'Passados'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading && filterTab === 'future' && reminders.length === 0 ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : filteredReminders.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons
            name="calendar-outline"
            size={48}
            color={theme.textSecondary}
            style={{ marginBottom: 12 }}
          />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            {filterTab === 'future' ? 'Nenhum lembrete' : 'Sem histórico'}
          </Text>
          <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
            {filterTab === 'future'
              ? 'Crie um novo lembrete pressionando "Novo"'
              : 'Lembretes passados aparecerão aqui'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {filteredReminders.map((reminder) => {
            const scheduledAt = reminder.scheduledAt instanceof Timestamp
              ? reminder.scheduledAt.toDate()
              : reminder.scheduledAt;

            const formattedDate = scheduledAt.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });

            const formattedTime = scheduledAt.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <View
                key={reminder.id}
                style={[
                  styles.reminderCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    opacity: reminder.completed ? 0.6 : 1,
                  },
                ]}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleSection}>
                      <Text
                        style={[
                          styles.reminderTitle,
                          {
                            color: theme.text,
                            textDecorationLine: reminder.completed
                              ? 'line-through'
                              : 'none',
                          },
                        ]}
                      >
                        {reminder.title}
                      </Text>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>
                          {getReminderTypeLabel(reminder.type)}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            reminder.status === 'active'
                              ? theme.primary + '20'
                              : theme.textSecondary + '20',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color:
                              reminder.status === 'active'
                                ? theme.primary
                                : theme.textSecondary,
                          },
                        ]}
                      >
                        {reminder.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Text>
                    </View>
                  </View>

                  {reminder.description && (
                    <Text
                      style={[styles.reminderDescription, { color: theme.textSecondary }]}
                      numberOfLines={2}
                    >
                      {reminder.description}
                    </Text>
                  )}

                  <View style={styles.metaInfo}>
                    <View style={styles.metaItem}>
                      <Ionicons
                        name="calendar"
                        size={14}
                        color={theme.primary}
                      />
                      <Text style={[styles.metaText, { color: theme.text }]}>
                        {formattedDate}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons
                        name="time"
                        size={14}
                        color={theme.primary}
                      />
                      <Text style={[styles.metaText, { color: theme.text }]}>
                        {formattedTime}
                      </Text>
                    </View>
                    {reminder.recurrence !== 'none' && (
                      <View style={styles.metaItem}>
                        <Ionicons
                          name="repeat"
                          size={14}
                          color={theme.primary}
                        />
                        <Text style={[styles.metaText, { color: theme.text }]}>
                          {getRecurrenceLabel(reminder.recurrence)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.cardActions}>
                  {!reminder.completed && filterTab === 'future' && (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: theme.primary + '20' },
                      ]}
                      onPress={() => handleCompleteReminder(reminder.id)}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color={theme.primary}
                      />
                      <Text style={[styles.actionButtonText, { color: theme.primary }]}>
                        Concluir
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: theme.primary + '20' },
                    ]}
                    onPress={() => handleEditReminder(reminder)}
                  >
                    <Ionicons
                      name="create-outline"
                      size={18}
                      color={theme.primary}
                    />
                    <Text style={[styles.actionButtonText, { color: theme.primary }]}>
                      Editar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: '#EF4444' + '20' },
                    ]}
                    onPress={() => handleDeleteReminder(reminder.id)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color="#EF4444"
                    />
                    <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
                      Excluir
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Form Modal */}
      <Modal
        visible={showFormModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.background, paddingTop: insets.top },
          ]}
        >
          {/* Modal Header */}
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: theme.border },
            ]}
          >
            <TouchableOpacity onPress={handleCloseModal}>
              <Ionicons name="close" size={24} color={theme.primary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingReminder ? 'Editar Lembrete' : 'Novo Lembrete'}
            </Text>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSaveReminder}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Modal Content */}
          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={{ paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Type Field */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Tipo</Text>
              <TouchableOpacity
                style={[
                  styles.formSelect,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => setShowTypeMenu(!showTypeMenu)}
              >
                <Text style={{ color: theme.text }}>
                  {getReminderTypeLabel(formData.type)}
                </Text>
                <Ionicons
                  name={showTypeMenu ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.primary}
                />
              </TouchableOpacity>
              {showTypeMenu && (
                <View
                  style={[
                    styles.dropdownMenu,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  {REMINDER_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.menuItem,
                        { borderBottomColor: theme.border },
                      ]}
                      onPress={() => {
                        setFormData(prev => ({ ...prev, type: type.value }));
                        setShowTypeMenu(false);
                      }}
                    >
                      <Text style={{ color: theme.text }}>{type.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Title Field */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>
                Título *
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
                ]}
                placeholder="Ex: Consulta do Veterinário"
                placeholderTextColor={theme.textSecondary}
                value={formData.title}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, title: text }))
                }
              />
            </View>

            {/* Description Field */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>
                Descrição
              </Text>
              <TextInput
                style={[
                  styles.formTextarea,
                  { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
                ]}
                placeholder="Adicione detalhes sobre o lembrete..."
                placeholderTextColor={theme.textSecondary}
                value={formData.description}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, description: text }))
                }
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Date Field */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>
                Data *
              </Text>
              {Platform.OS === 'web' ? (
                <TextInput
                  style={[
                    styles.formInput,
                    { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
                  ]}
                  inputMode="numeric"
                  value={formData.scheduledAt.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const date = new Date(e.nativeEvent.text);
                    setFormData(prev => ({
                      ...prev,
                      scheduledAt: new Date(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate(),
                        prev.scheduledAt.getHours(),
                        prev.scheduledAt.getMinutes()
                      ),
                    }));
                  }}
                />
              ) : (
                <>
                  <TouchableOpacity
                    style={[
                      styles.formInput,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={{ color: theme.text }}>
                      {formData.scheduledAt.toLocaleDateString('pt-BR')}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={formData.scheduledAt}
                      mode="date"
                      display="default"
                      onChange={handleDateChange}
                    />
                  )}
                </>
              )}
            </View>

            {/* Time Field */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>
                Hora *
              </Text>
              {Platform.OS === 'web' ? (
                <TextInput
                  style={[
                    styles.formInput,
                    { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
                  ]}
                  inputMode="numeric"
                  value={formData.scheduledAt.toTimeString().substring(0, 5)}
                  onChange={(e) => {
                    const [hours, minutes] = e.nativeEvent.text.split(':');
                    setFormData(prev => ({
                      ...prev,
                      scheduledAt: new Date(
                        prev.scheduledAt.getFullYear(),
                        prev.scheduledAt.getMonth(),
                        prev.scheduledAt.getDate(),
                        parseInt(hours),
                        parseInt(minutes)
                      ),
                    }));
                  }}
                />
              ) : (
                <>
                  <TouchableOpacity
                    style={[
                      styles.formInput,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={{ color: theme.text }}>
                      {formData.scheduledAt.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </TouchableOpacity>
                  {showTimePicker && (
                    <DateTimePicker
                      value={formData.scheduledAt}
                      mode="time"
                      display="default"
                      onChange={handleTimeChange}
                    />
                  )}
                </>
              )}
            </View>

            {/* Recurrence Field */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>
                Recorrência
              </Text>
              <TouchableOpacity
                style={[
                  styles.formSelect,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => setShowRecurrenceMenu(!showRecurrenceMenu)}
              >
                <Text style={{ color: theme.text }}>
                  {getRecurrenceLabel(formData.recurrence)}
                </Text>
                <Ionicons
                  name={showRecurrenceMenu ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.primary}
                />
              </TouchableOpacity>
              {showRecurrenceMenu && (
                <View
                  style={[
                    styles.dropdownMenu,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  {RECURRENCE_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.menuItem,
                        { borderBottomColor: theme.border },
                      ]}
                      onPress={() => {
                        setFormData(prev => ({ ...prev, recurrence: option.value }));
                        setShowRecurrenceMenu(false);
                      }}
                    >
                      <Text style={{ color: theme.text }}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Status Field */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>
                Status
              </Text>
              <View style={styles.statusToggle}>
                <TouchableOpacity
                  style={[
                    styles.statusToggleButton,
                    {
                      backgroundColor:
                        formData.status === 'active'
                          ? theme.primary
                          : theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() =>
                    setFormData(prev => ({ ...prev, status: 'active' }))
                  }
                >
                  <Text
                    style={[
                      styles.statusToggleText,
                      {
                        color:
                          formData.status === 'active' ? '#FFF' : theme.text,
                      },
                    ]}
                  >
                    Ativo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusToggleButton,
                    {
                      backgroundColor:
                        formData.status === 'inactive'
                          ? '#EF4444'
                          : theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() =>
                    setFormData(prev => ({ ...prev, status: 'inactive' }))
                  }
                >
                  <Text
                    style={[
                      styles.statusToggleText,
                      {
                        color:
                          formData.status === 'inactive' ? '#FFF' : theme.text,
                      },
                    ]}
                  >
                    Inativo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  newButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  reminderCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  cardTitleSection: {
    flex: 1,
    gap: 8,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#3B82F6' + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reminderDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  loginButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 44,
    justifyContent: 'center',
  },
  formSelect: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  formTextarea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  dropdownMenu: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statusToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  statusToggleButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statusToggleText: {
    fontWeight: '600',
    fontSize: 14,
  },
});