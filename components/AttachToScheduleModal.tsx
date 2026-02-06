// components/AttachToScheduleModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ScheduleEvent {
  id: string;
  title: string;
  day: string;
  timeSlot: string;
  location: string;
  teacher: string;
  type: string;
  weekNumber?: number;
}

interface AttachToScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttach: (eventId: string | null) => void;
  noteId?: string;
  currentEventId?: string | null;
}

const dayNames: { [key: string]: string } = {
  monday: 'Понедельник',
  tuesday: 'Вторник', 
  wednesday: 'Среда',
  thursday: 'Четверг',
  friday: 'Пятница',
  saturday: 'Суббота'
};

export default function AttachToScheduleModal({
  isOpen,
  onClose,
  onAttach,
  noteId,
  currentEventId
}: AttachToScheduleModalProps) {
  const { data: session } = useSession();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSchedule, setHasSchedule] = useState(false);
  const [hasGroup, setHasGroup] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(currentEventId || null);
  const [selectedDay, setSelectedDay] = useState<string>('monday');
  const [eventLimits, setEventLimits] = useState<{[key: string]: {count: number, canAttach: boolean}}>({});
  const [isAttaching, setIsAttaching] = useState(false);

  console.log('🎯 AttachToScheduleModal компонент вызван с параметрами:', {
    isOpen,
    noteId,
    currentEventId,
    hasGroup: !!session?.user?.groupId,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log('🔍 useEffect сработал, isOpen:', isOpen);
    if (isOpen) {
      if (session?.user?.groupId) {
        setHasGroup(true);
        console.log('📅 Загружаем расписание для группы:', session.user.groupId);
        loadSchedule();
      } else {
        console.log('⚠️ У пользователя нет группы');
        setHasGroup(false);
        setHasSchedule(false);
        setIsLoading(false);
      }
    }
  }, [isOpen, session]);

  const loadSchedule = async () => {
    try {
      const response = await fetch('/api/schedule/all');
      if (response.ok) {
        const data = await response.json();
        const scheduleEvents = data.events || [];
        setEvents(scheduleEvents);
        setHasSchedule(scheduleEvents.length > 0);
        console.log(`📅 Загружено ${scheduleEvents.length} занятий для прикрепления`);
      } else {
        console.warn('⚠️ Ошибка загрузки расписания');
        setHasSchedule(false);
      }
    } catch (error) {
      console.error('Ошибка загрузки расписания:', error);
      setHasSchedule(false);
    } finally {
      setIsLoading(false);
    }
  };

  // При загрузке если нет расписания, показываем сообщение
  useEffect(() => {
    if (!isLoading && !hasSchedule) {
      console.log('📋 Нет расписания, показываем информационное сообщение');
    }
  }, [isLoading, hasSchedule]);

  const checkEventLimit = async (eventId: string) => {
    try {
      const response = await fetch(`/api/lecture-notes/check-limit?eventId=${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setEventLimits(prev => ({
          ...prev,
          [eventId]: { count: data.count, canAttach: data.canAttach }
        }));
        return data.canAttach;
      }
    } catch (error) {
      console.error('Ошибка проверки лимита:', error);
    }
    return true;
  };

  const handleEventSelect = async (eventId: string) => {
    setSelectedEventId(eventId);
    
    if (eventId && noteId) {
      await checkEventLimit(eventId);
    }
  };

  const handleSaveWithoutSchedule = () => {
    console.log('💾 Сохраняем конспект без привязки к расписанию');
    onAttach(null); // Передаем null как ID события
  };

  const handleAttach = async () => {
    if (selectedEventId && eventLimits[selectedEventId]?.canAttach === false) {
      alert('❌ К этому занятию уже прикреплено максимальное количество конспектов (2)');
      return;
    }
    
    setIsAttaching(true);
    console.log('🔄 Начинаем привязку конспекта:', {
      noteId,
      selectedEventId
    });
    
    try {
      if (noteId && selectedEventId) {
        console.log('📡 Отправляем запрос к API привязки...');
        const response = await fetch(`/api/lecture-notes/${noteId}/attach`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scheduleEventId: selectedEventId
          }),
        });

        console.log('📊 Ответ от API привязки:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Привязка успешна:', result);
          onAttach(selectedEventId);
        } else {
          const error = await response.json();
          console.error('❌ Ошибка привязки:', error);
          alert('❌ Ошибка при привязке конспекта');
        }
      } else {
        console.log('💾 Сохраняем конспект без привязки');
        onAttach(null);
      }
    } catch (error) {
      console.error('❌ Ошибка привязки конспекта:', error);
      alert('Ошибка при привязке конспекта');
    } finally {
      setIsAttaching(false);
    }
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayEvents = events.filter(event => event.day === selectedDay);

  if (!isOpen) return null;

  // СТРАНИЦА БЕЗ РАСПИСАНИЯ
  if (!isLoading && !hasSchedule) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              📝 Сохранить конспект
            </h2>
            <p className="text-gray-600 mt-1">
              {!hasGroup 
                ? "У вас пока нет группы" 
                : "У вас пока нет расписания"}
            </p>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-2xl">
                  {!hasGroup ? "👥" : "📅"}
                </span>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2">
                {!hasGroup 
                  ? "Создайте группу для совместной работы" 
                  : "Создайте расписание для привязки конспектов"}
              </h3>
              
              <p className="text-gray-600 text-sm mb-6">
                {!hasGroup 
                  ? "Конспект будет сохранен в вашем личном кабинете. Создайте группу чтобы делиться конспектами с одногруппниками."
                  : "Конспект будет сохранен в разделе 'Конспекты'. Добавьте расписание чтобы привязывать конспекты к занятиям."}
              </p>
            </div>

            <div className="space-y-4">
              {/* Кнопки действий */}
              <button
                onClick={handleSaveWithoutSchedule}
                disabled={isAttaching}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isAttaching ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Сохранение...</span>
                  </div>
                ) : (
                  '💾 Сохранить конспект'
                )}
              </button>

              {!hasGroup && (
                <a
                  href="/create-group"
                  className="block w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 text-center transition-all"
                >
                  👥 Создать группу
                </a>
              )}

              {hasGroup && (
                <a
                  href="/schedule"
                  className="block w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-600 hover:to-pink-700 text-center transition-all"
                >
                  📅 Перейти к расписанию
                </a>
              )}

              <button
                onClick={onClose}
                className="w-full text-gray-600 hover:text-gray-900 font-medium py-2"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ОБЫЧНАЯ СТРАНИЦА С РАСПИСАНИЕМ
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            📅 Прикрепить конспект к занятию
          </h2>
          <p className="text-gray-600 mt-1">
            {hasSchedule 
              ? "Выберите занятие из расписания чтобы прикрепить конспект"
              : "Загружаем расписание..."}
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Загрузка расписания...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">📅</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Расписание пустое
              </h3>
              <p className="text-gray-600 mb-4">
                Добавьте занятия в расписание чтобы прикреплять к ним конспекты
              </p>
              <a 
                href="/schedule" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-block"
              >
                📅 Перейти к расписанию
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Выбор дня недели */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">📋 Выберите день:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {days.map(day => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`p-3 text-center rounded-lg border-2 transition-colors ${
                        selectedDay === day
                          ? 'bg-blue-100 border-blue-500 text-blue-700 font-semibold'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {dayNames[day]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Занятия выбранного дня */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  🗓️ Занятия в {dayNames[selectedDay].toLowerCase()}:
                </h3>
                
                {dayEvents.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">На этот день занятий нет</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dayEvents.map(event => (
                      <label
                        key={event.id}
                        className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedEventId === event.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="scheduleEvent"
                          value={event.id}
                          checked={selectedEventId === event.id}
                          onChange={() => handleEventSelect(event.id)}
                          className="mt-1 mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${
                              event.type === 'lecture' 
                                ? 'bg-blue-100 text-blue-700' 
                                : event.type === 'practice' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {event.type === 'lecture' ? 'Лекция' : event.type === 'practice' ? 'Практика' : 'Лаб. работа'}
                            </span>
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              {event.timeSlot}
                            </span>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              {event.weekNumber || 1}-я неделя
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {event.teacher && `👨‍🏫 ${event.teacher}`}
                            {event.location && ` • 📍 ${event.location}`}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Опция без привязки */}
              <div className="border-t pt-4">
                <label className="flex items-start p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-gray-300">
                  <input
                    type="radio"
                    name="scheduleEvent"
                    value=""
                    checked={selectedEventId === null}
                    onChange={() => setSelectedEventId(null)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">Не прикреплять к занятию</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Конспект будет сохранен в разделе "Мои конспекты"
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            Отмена
          </button>
          <button
            onClick={handleAttach}
            disabled={isLoading || isAttaching}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {isAttaching ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {selectedEventId ? 'Прикрепление...' : 'Сохранение...'}
              </div>
            ) : selectedEventId ? '📎 Прикрепить' : '💾 Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}