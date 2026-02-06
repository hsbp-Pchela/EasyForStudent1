// app/main/schedule/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import NoteViewModal from '@/components/NoteViewModal';




interface ScheduleEvent {
  id: string;
  title: string;
  day: string;
  timeSlot: string;
  timeStart: string;
  timeEnd: string;
  location: string;
  teacher: string;
  type: 'lecture' | 'practice' | 'lab' | 'exam';
  weekNumber?: number;
}

interface LectureNote {
  id: string;
  title: string;
  content: string;
  schedule_event_id: string | null;
  event_title?: string;
  event_day?: string;
  created_at: string;
}

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const timeSlots = [
  '8:30-10:00', '10:10-11:40', '11:50-13:20', 
  '13:40-15:10', '15:20-16:50', '17:00-18:30'
];

const eventTypes = [
  { value: 'lecture', label: 'Лекция' },
  { value: 'practice', label: 'Практика' },
  { value: 'lab', label: 'Лабораторная' }
] as const;

const parseTimeSlot = (timeSlot: string) => {
  const [start, end] = timeSlot.split('-');
  return {
    timeStart: start,
    timeEnd: end
  };
};



export default function SchedulePage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [editing, setEditing] = useState(false);
  const [selectedDay, setSelectedDay] = useState('monday');
  const [newEvent, setNewEvent] = useState({
    title: '', 
    timeSlot: timeSlots[0], 
    location: '', 
    teacher: '', 
    type: 'lecture' as 'lecture' | 'practice' | 'lab'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [validationError, setValidationError] = useState('');
  const [lectureNotes, setLectureNotes] = useState<LectureNote[]>([]);
  const [selectedNoteForView, setSelectedNoteForView] = useState<LectureNote | null>(null);

  const [currentWeek, setCurrentWeek] = useState(1); // 1 или 2
  const [weekStats, setWeekStats] = useState({
    week1Count: 0,
    week2Count: 0,
    maxPerWeek: 20 // Новый лимит
  });


  
  useEffect(() => {
    console.log('🔍 Schedule Session:', {
      groupId: session?.user?.groupId,
      groupName: session?.user?.groupName,
      hasGroup: !!session?.user?.groupId
    });
  }, [session]);

  useEffect(() => {
    loadSchedule();
  },[currentWeek]);

  useEffect(() => {
  loadLectureNotes();
}, []);



const loadLectureNotes = async () => {
  try {
    console.log('📚 Загружаем конспекты...');
    const response = await fetch('/api/lecture-notes');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Загружено конспектов:', data.notes?.length);
      
      // Загружаем ВСЕ занятия (обе недели) для проверки
      const allEventsResponse = await fetch('/api/schedule/all');
      let allEvents: ScheduleEvent[] = [];
      
      if (allEventsResponse.ok) {
        const allEventsData = await allEventsResponse.json();
        allEvents = allEventsData.events || [];
        console.log('✅ Загружено всех занятий для проверки:', allEvents.length);
      }
      
      // Проверяем какие занятия существуют (из всех недель)
      const existingEventIds = new Set(allEvents.map(e => e.id.toString()));
      
      const validNotes = (data.notes || []).filter((note: any) => {
        // Если конспект не прикреплен - показываем
        if (!note.schedule_event_id) return true;
        
        // Если прикреплен, проверяем существует ли занятие в любой неделе
        const eventExists = existingEventIds.has(note.schedule_event_id.toString());
        
        if (!eventExists) {
          console.warn(`⚠️ Конспект "${note.title}" прикреплен к несуществующему занятию ID: ${note.schedule_event_id}`);
          // Пропускаем такие конспекты
          return false;
        }
        
        return eventExists;
      });
      
      console.log(`✅ Отфильтровано конспектов: ${validNotes.length}/${data.notes?.length}`);
      setLectureNotes(validNotes);
    } else {
      console.error('❌ Ошибка загрузки конспектов:', response.status);
    }
  } catch (error) {
    console.error('Ошибка загрузки конспектов:', error);
  }
};



  const getDayLectureNotes = (day: string) => {
    return lectureNotes.filter(note => note.event_day === day);
  };

  const loadSchedule = async () => {
  try {
    console.log(`📅 Загружаем расписание (неделя ${currentWeek})...`);
    const response = await fetch(`/api/schedule?week=${currentWeek}`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Загружено расписание:', {
        eventsCount: data.events?.length,
        currentWeek: data.currentWeek,
        week1Count: data.week1Count,
        week2Count: data.week2Count
      });
      
      setEvents(data.events || []);
      setWeekStats({
        week1Count: data.week1Count || 0,
        week2Count: data.week2Count || 0,
        maxPerWeek: 20
      });
    } else {
      console.error('❌ Ошибка загрузки расписания:', response.status);
    }
  } catch (error) {
    console.error('Ошибка загрузки расписания:', error);
  } finally {
    setIsLoading(false);
  }
};

  const saveSchedule = async (updatedEvents: ScheduleEvent[]) => {
  try {
    // Добавляем weekNumber к каждому событию если его нет
    const eventsWithWeek = updatedEvents.map(event => ({
      ...event,
      weekNumber: event.weekNumber || currentWeek
    }));

    console.log(`💾 Сохраняем ${eventsWithWeek.length} занятий для недели ${currentWeek}`);
    
    const response = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        events: eventsWithWeek,
        week: currentWeek
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Ошибка API:', errorData);
      throw new Error(errorData.error || 'Ошибка сохранения');
    }

    const data = await response.json();
    console.log('✅ Расписание сохранено:', data);
    
    // После сохранения перезагружаем данные
    await loadSchedule();
    
  } catch (error) {
    console.error('❌ Ошибка сохранения расписания:', error);
    alert(`❌ Ошибка сохранения расписания: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
  }
};

   const deleteNote = async (noteId: string) => {
    if (!confirm('Удалить этот конспект? Это действие нельзя отменить.')) return;
    
    try {
      const response = await fetch(`/api/lecture-notes/${noteId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Обновляем список конспектов
        loadLectureNotes();
        alert('✅ Конспект удален');
      } else {
        alert('❌ Ошибка удаления конспекта');
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('❌ Ошибка удаления конспекта');
    }
  };

    const updateNoteTitle = async (noteId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      alert('Название не может быть пустым');
      return;
    }

    try {
      console.log('🔄 Обновляем название конспекта из расписания:', { noteId, newTitle });
      
      const response = await fetch(`/api/lecture-notes/${noteId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Название обновлено:', data);
        
        // Обновляем локальное состояние
        const updatedNotes = lectureNotes.map(note => 
          note.id === noteId ? { ...note, title: newTitle } : note
        );
        setLectureNotes(updatedNotes);
        
        // Обновляем selectedNoteForView если он открыт
        if (selectedNoteForView?.id === noteId) {
          setSelectedNoteForView(prev => prev ? { ...prev, title: newTitle } : null);
        }
      } else {
        console.error('❌ Ошибка обновления:', data);
        alert(`❌ Ошибка: ${data.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Ошибка обновления:', error);
      alert('❌ Ошибка обновления названия');
    }
  };

  const validateEvent = (eventData: { title: string; timeSlot: string; day: string }): string => {
  const dayEvents = events.filter(e => e.day === eventData.day);
  const weekEvents = events.filter(e => e.weekNumber === currentWeek); // Используем currentWeek

  const timeSlotOccupied = dayEvents.some(e => e.timeSlot === eventData.timeSlot);
  if (timeSlotOccupied) {
    return `❌ Время ${eventData.timeSlot} уже занято в этот день`;
  }

  if (dayEvents.length >= 5) {
    return '❌ Нельзя добавить более 5 предметов в один день';
  }

  // Используем weekStats вместо фиксированного значения
  const currentWeekEventsCount = currentWeek === 1 ? weekStats.week1Count : weekStats.week2Count;
  if (currentWeekEventsCount >= weekStats.maxPerWeek) {
    return `❌ Нельзя добавить более ${weekStats.maxPerWeek} предметов в ${currentWeek}-ю неделю`;
  }

  if (!eventData.title.trim()) {
    return '❌ Введите название предмета';
  }

  return '';
};

  const addEvent = () => {
  setValidationError('');
  const error = validateEvent({
    title: newEvent.title,
    timeSlot: newEvent.timeSlot,
    day: selectedDay
  });

  if (error) {
    setValidationError(error);
    return;
  }

  const { timeStart, timeEnd } = parseTimeSlot(newEvent.timeSlot);
  
  const event: ScheduleEvent = {
    id: Date.now().toString(),
    ...newEvent,
    day: selectedDay,
    timeStart,
    timeEnd,
    weekNumber: currentWeek // ← ДОБАВЬ ТЕКУЩУЮ НЕДЕЛЮ
  };

  const updated = [...events, event];
  setEvents(updated);
  saveSchedule(updated);
  
  setNewEvent({ 
    title: '', 
    timeSlot: timeSlots[0], 
    location: '', 
    teacher: '', 
    type: 'lecture' 
  });
};

  const deleteEvent = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    saveSchedule(updated);
    setValidationError('');
  };

  const dayEvents = events.filter(e => e.day === selectedDay);
  const weekEventsCount = events.length;

  const getDayStats = (day: string) => {
    const dayEventsCount = events.filter(e => e.day === day).length;
    return `${dayEventsCount}/5`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка расписания...</p>
          </div>
        </div>
      </div>
    );
  }

  // ИСПРАВЛЕННАЯ ЛОГИКА: показываем интерфейс расписания если ЕСТЬ ГРУППА в сессии
  if (!session?.user?.groupId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="py-8 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h1 className="text-2xl font-bold mb-4">📅 Расписание</h1>
              <p className="text-gray-600 mb-6">
                У вас нет группы
              </p>
              <div className="space-y-4">
                <a href="/groups" className="block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                  📋 Перейти к управлению группой
                </a>
                <p className="text-sm text-gray-500">
                  Создайте группу или вступите в существующую чтобы использовать расписание
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
 console.log('🔍 Расписание рендерится:', {
    selectedDay,
    dayEventsCount: dayEvents.length,
    dayEvents: dayEvents.map(e => ({
      id: e.id,
      idType: typeof e.id,
      title: e.title,
      day: e.day,
      timeSlot: e.timeSlot
    })),
    lectureNotesCount: lectureNotes.length,
    lectureNotes: lectureNotes.map(n => ({
      id: n.id,
      title: n.title,
      schedule_event_id: n.schedule_event_id,
      schedule_event_id_type: typeof n.schedule_event_id,
      event_title: n.event_title,
      event_day: n.event_day
    })),
    // Проверяем совпадения ID
    matches: dayEvents.map(event => {
      const matchingNotes = lectureNotes.filter(note => 
        note.schedule_event_id?.toString() === event.id.toString()
      );
      return {
        eventId: event.id,
        eventTitle: event.title,
        matchingNotesCount: matchingNotes.length,
        matchingNoteIds: matchingNotes.map(n => n.id)
      };
    })
  });
  // ЕСЛИ ЕСТЬ ГРУППА - показываем интерфейс расписания (даже если оно пустое)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Заголовок с информацией о группе */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">📅 Расписание группы</h1>
              <p className="text-lg text-gray-600">
                {session.user.groupName}
              </p>
              <p className="text-sm text-gray-500">
                👥 Добавьте занятия в расписание
                {session.user.isGroupAdmin && ' • 👑 Вы администратор'}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Переключатель недель */}
              <div className="bg-white rounded-lg shadow-sm border p-1">
                <div className="flex">
                  <button
                    onClick={() => setCurrentWeek(1)}
                    className={`px-4 py-2 rounded-md font-medium transition-all ${
                      currentWeek === 1 
                        ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    1-я неделя
                    {weekStats.week1Count > 0 && (
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                        weekStats.week2Count >= weekStats.maxPerWeek 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {weekStats.week2Count}/{weekStats.maxPerWeek} {/* ← Исправлено */}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setCurrentWeek(2)}
                    className={`px-4 py-2 rounded-md font-medium transition-all ${
                      currentWeek === 2 
                        ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    2-я неделя
                    {weekStats.week2Count > 0 && (
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                        weekStats.week2Count >= weekStats.maxPerWeek 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {weekStats.week1Count}/{weekStats.maxPerWeek}
                      </span>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Статистика текущей недели */}
              <div className="text-right">
                <div className="bg-white rounded-lg shadow-sm px-4 py-2 border">
                  <div className="text-sm text-gray-600">
                    Предметов ({currentWeek}-я неделя)
                  </div>
                  <div className="text-lg font-bold">
                    <span className={
                      (currentWeek === 1 ? weekStats.week1Count : weekStats.week2Count) >= weekStats.maxPerWeek 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }>
                      {currentWeek === 1 ? weekStats.week1Count : weekStats.week2Count}/{weekStats.maxPerWeek} {/* ← 20 */}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Основной контент */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Левая колонка - Дни недели */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">📋 Дни недели</h2>
              <div className="space-y-2">
                {days.map((day, i) => (
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDay(day);
                      setValidationError('');
                    }}
                    className={`w-full p-3 text-left rounded-lg transition-colors ${
                      selectedDay === day 
                        ? 'bg-blue-100 text-blue-700 font-semibold border-2 border-blue-300' 
                        : 'hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{dayNames[i]}</span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        events.filter(e => e.day === day).length >= 5 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {getDayStats(day)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">Ограничения ({currentWeek}-я неделя):</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Макс. 1 предмет в одно время</li>
                  <li>• Макс. 5 предметов в день</li>
                  <li>• Макс. {weekStats.maxPerWeek} предметов в неделю</li>
                  <li>• Расписание сохраняется отдельно для каждой недели</li>
                </ul>
                <div className="mt-3 text-xs text-yellow-800">
                  <div className="flex justify-between">
                    <span>1-я неделя:</span>
                    <span className={`font-medium ${
                      weekStats.week1Count >= weekStats.maxPerWeek ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {weekStats.week1Count}/{weekStats.maxPerWeek} занятий
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>2-я неделя:</span>
                    <span className={`font-medium ${
                      weekStats.week2Count >= weekStats.maxPerWeek ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {weekStats.week2Count}/{weekStats.maxPerWeek} занятий
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Правая колонка - Расписание */}
            <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold">🗓️ {dayNames[days.indexOf(selectedDay)]}</h2>
                  <p className="text-sm text-gray-600">{currentWeek}-я неделя</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col text-right">
                    <div className="text-sm text-gray-600">
                      {currentWeek}-я неделя
                    </div>
                    <div className="text-sm text-gray-600">
                      Предметов сегодня: <span className="font-semibold">{dayEvents.length}/5</span>
                    </div>
                  </div>
                  {session.user.isGroupAdmin && (
                    <button
                      onClick={() => setEditing(!editing)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      {editing ? '👀 Режим просмотра' : '✏️ Редактировать'}
                    </button>
                  )}
                  {editing && (
                    <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
                      Режим редактирования
                    </span>
                  )}
                </div>
              </div>

              {validationError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {validationError}
                </div>
              )}

              {editing && session.user.isGroupAdmin && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-blue-800 mb-3">➕ Добавить новое занятие</h3>
                  
                  {dayEvents.length >= 4 && (
                    <div className="mb-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
                      ⚠️ Внимание: сегодня уже {dayEvents.length} из 5 предметов
                    </div>
                  )}
                  {(currentWeek === 1 ? weekStats.week1Count : weekStats.week2Count) >= weekStats.maxPerWeek - 2 && (
                    <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
                      ⚠️ Внимание: на {currentWeek}-й неделе уже {
                        currentWeek === 1 ? weekStats.week1Count : weekStats.week2Count
                      } из {weekStats.maxPerWeek} предметов
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Название предмета *"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                      className="p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                    <select
                      value={newEvent.timeSlot}
                      onChange={(e) => setNewEvent({...newEvent, timeSlot: e.target.value})}
                      className="p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    >
                      {timeSlots.map(slot => {
                        const isOccupied = dayEvents.some(e => e.timeSlot === slot);
                        return (
                          <option 
                            key={slot} 
                            value={slot}
                            disabled={isOccupied}
                            className={isOccupied ? 'text-gray-400' : ''}
                          >
                            {slot} {isOccupied ? '(занято)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    <input
                      type="text"
                      placeholder="Преподаватель"
                      value={newEvent.teacher}
                      onChange={(e) => setNewEvent({...newEvent, teacher: e.target.value})}
                      className="p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Аудитория"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                      className="p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                    <select
                      value={newEvent.type}
                      onChange={(e) => setNewEvent({...newEvent, type: e.target.value as 'lecture' | 'practice' | 'lab'})}
                      className="p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    >
                      {eventTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={addEvent}
                    className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors font-medium"
                  >
                    Добавить занятие
                  </button>
                </div>
              )}

              <div className="space-y-3">
  {dayEvents.length === 0 ? (
    <div className="text-center py-8 text-gray-500">
      <p className="text-lg">📭 На этот день занятий нет</p>
      {editing && session.user.isGroupAdmin && (
        <p className="text-sm mt-2">Добавьте занятия используя форму выше</p>
      )}
      {!editing && session.user.isGroupAdmin && (
        <button
          onClick={() => setEditing(true)}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          ✏️ Добавить занятия
        </button>
      )}
    </div>
  ) : (
    dayEvents.map(event => {
      const eventNotes = lectureNotes.filter(note => 
  note.schedule_event_id?.toString() === event.id.toString()
);
      
      return (
        <div
          key={event.id}
          className="p-4 border-2 border-gray-200 rounded-xl hover:shadow-md transition-all"
        >
          <div className="flex justify-between items-start">
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
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {event.location}
                </span>
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {event.timeSlot}
                </span>
                {eventNotes.length > 0 && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                    📎 {eventNotes.length}
                  </span>
                )}
              </div>
              <h4 className="font-bold text-lg mb-1">{event.title}</h4>
              <p className="text-sm text-gray-600 mb-1">👨‍🏫 {event.teacher}</p>
              <p className="text-xs text-gray-500">
                Время: {event.timeStart} - {event.timeEnd}
              </p>
                            {/* Показываем прикрепленные конспекты */}
                            {eventNotes.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-gray-200">
                                <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                  📚 Прикрепленные конспекты ({eventNotes.length})
                                </h5>
                                <div className="space-y-2">
                                  {eventNotes.map(note => (
                                    <div 
                                      key={note.id}
                                      className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                                    >
                                      <h6 className="font-medium text-blue-900 mb-1">
                                        {note.title}
                                      </h6>
                                      <p className="text-sm text-blue-700 line-clamp-2">
                                        {note.content.replace(/\*\*/g, '').substring(0, 100)}...
                                      </p>
                                      <div className="flex gap-2 mt-2">
                                        <button
                                          onClick={() => setSelectedNoteForView(note)}
                                          className="text-xs text-blue-600 hover:text-blue-800"
                                        >
                                          📖 Читать полностью
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const newTitle = prompt('Введите новое название:', note.title);
                                            if (newTitle && newTitle !== note.title) {
                                              updateNoteTitle(note.id, newTitle);
                                            }
                                          }}
                                          className="text-xs text-green-600 hover:text-green-800"
                                          title="Редактировать название"
                                        >
                                          ✏️
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNote(note.id);
                                          }}
                                          className="text-xs text-red-600 hover:text-red-800"
                                          title="Удалить конспект"
                                        >
                                          🗑️ Удалить
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          {editing && session.user.isGroupAdmin && (
                            <button
                              onClick={() => deleteEvent(event.id)}
                              className="text-red-500 hover:text-red-700 ml-4"
                            >
                              Удалить
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
        {selectedNoteForView && (
        <NoteViewModal
          isOpen={!!selectedNoteForView}
          onClose={() => setSelectedNoteForView(null)}
          note={selectedNoteForView}
          onUpdateTitle={updateNoteTitle}
        />
      )}
    </div>
  );
}