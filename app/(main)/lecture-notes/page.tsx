// app/(main)/lecture-notes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AttachToScheduleModal from '@/components/AttachToScheduleModal';

const styles = `
  .edit-input {
    min-width: 150px;
  }
  
  @media (max-width: 640px) {
    .edit-input {
      min-width: 100px;
    }
  }
`;

interface LectureNote {
  id: string;
  title: string;
  content: string;
  schedule_event_id: string | null;
  event_title?: string;
  event_day?: string;
  audio_transcript: string;
  slides_text: string;
  file_name: string;
  image_count: number;
  created_at: string;
}

export default function LectureNotesPage() {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<LectureNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<LectureNote | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [noteToAttach, setNoteToAttach] = useState<LectureNote | null>(null);
  const [tempSelectedNote, setTempSelectedNote] = useState<LectureNote | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const response = await fetch('/api/lecture-notes');
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки конспектов:', error);
    } finally {
      setIsLoading(false);
    }
  };

   const updateNoteTitle = async (noteId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      alert('Название не может быть пустым');
      return;
    }

    try {
      console.log('🔄 Обновляем название конспекта:', { noteId, newTitle });
      
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
        setNotes(prev => prev.map(note => 
          note.id === noteId ? { ...note, title: newTitle } : note
        ));
        
        // Обновляем selectedNote если он открыт
        if (selectedNote?.id === noteId) {
          setSelectedNote(prev => prev ? { ...prev, title: newTitle } : null);
        }
        
        // Сбрасываем состояния редактирования
        setIsEditingTitle(false);
        setEditingNoteId(null);
      } else {
        console.error('❌ Ошибка обновления:', data);
        alert(`❌ Ошибка: ${data.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Ошибка обновления:', error);
      alert('❌ Ошибка обновления названия');
    }
  };

  const handleEditInCard = (note: LectureNote, e: React.MouseEvent) => {
    e.stopPropagation(); // Останавливаем всплытие чтобы не открывалось модальное окно
    setEditingNoteId(note.id);
    setEditingTitleValue(note.title);
  };

  const saveEditInCard = async (noteId: string) => {
    await updateNoteTitle(noteId, editingTitleValue);
  };

  const cancelEditInCard = () => {
    setEditingNoteId(null);
    setEditingTitleValue('');
  };

  const handleOpenAttachModal = (note: LectureNote, e: React.MouseEvent) => {
  e.stopPropagation();
  // Если конспект открыт в модальном окне, сохраняем его
  if (selectedNote && selectedNote.id === note.id) {
    setTempSelectedNote(selectedNote);
    setSelectedNote(null);
  }
  setNoteToAttach(note);
  setShowAttachModal(true);
};

const handleAttachToSchedule = async (eventId: string | null) => {
  if (!noteToAttach) return;
  
  try {
    const response = await fetch(`/api/lecture-notes/${noteToAttach.id}/attach`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scheduleEventId: eventId
      }),
    });

    if (response.ok) {
      // Обновляем список конспектов
      await loadNotes();
      
      // Обновляем selectedNote если он открыт
      if (selectedNote?.id === noteToAttach.id) {
        setSelectedNote(prev => prev ? { 
          ...prev, 
          schedule_event_id: eventId,
          event_title: eventId ? "Обновление..." : undefined,
          event_day: eventId ? selectedNote.event_day : undefined
        } : null);
      }
      
      // Показываем сообщение
      if (eventId) {
        alert('✅ Конспект успешно прикреплен к занятию!');
      } else {
        alert('✅ Конспект откреплен от занятия!');
      }

       // После прикрепления снова открываем конспект если он был открыт до этого
      if (tempSelectedNote) {
        // Обновляем конспект с новыми данными
        const updatedNote = { 
          ...tempSelectedNote, 
          schedule_event_id: eventId 
        };
        setSelectedNote(updatedNote);
        setTempSelectedNote(null);
      }
    } else {
      const error = await response.json();
      alert(`❌ Ошибка: ${error.error || 'Неизвестная ошибка'}`);
    }
     if (tempSelectedNote) {
        setSelectedNote(tempSelectedNote);
        setTempSelectedNote(null);
      }
  } catch (error) {
    console.error('Ошибка прикрепления:', error);
    alert('❌ Ошибка прикрепления конспекта');
  } finally {
    setShowAttachModal(false);
    setNoteToAttach(null);
  }
};


  const getDayName = (day: string) => {
    const days: { [key: string]: string } = {
      monday: 'Понедельник',
      tuesday: 'Вторник',
      wednesday: 'Среда',
      thursday: 'Четверг',
      friday: 'Пятница',
      saturday: 'Суббота'
    };
    return days[day] || day;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка конспектов...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              📚 Библиотека конспектов
            </h1>
            <p className="text-lg text-gray-600">
              {session?.user?.groupName ? `Группа: ${session.user.groupName}` : 'Все ваши учебные конспекты'}
            </p>
          </div>

          {notes.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">📝</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Конспектов пока нет
              </h2>
              <p className="text-gray-600 mb-6">
                Создайте свой первый конспект из аудио лекции или изображений
              </p>
              <a
                href="/"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
              >
                🎓 Создать конспект
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notes.map(note => (
                <div
                  key={note.id}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer group"
                  onClick={() => {
                    if (editingNoteId !== note.id) {
                      setSelectedNote(note);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    {/* Заголовок с редактированием */}
                    {editingNoteId === note.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editingTitleValue}
                          onChange={(e) => setEditingTitleValue(e.target.value)}
                          className="font-bold text-lg text-gray-900 border-b-2 border-blue-500 focus:outline-none flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveEditInCard(note.id);
                            }
                            if (e.key === 'Escape') {
                              cancelEditInCard();
                            }
                          }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            saveEditInCard(note.id);
                          }}
                          className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700"
                          title="Сохранить"
                        >
                          ✓
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelEditInCard();
                          }}
                          className="bg-gray-600 text-white px-2 py-1 rounded text-sm hover:bg-gray-700"
                          title="Отмена"
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <h3 className="font-bold text-lg text-gray-900 line-clamp-2 flex-1">
                          {note.title}
                        </h3>
                        <button
                          onClick={(e) => handleEditInCard(note, e)}
                          className="text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Редактировать название"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                    
                    {/* Бейдж прикрепления */}
                    {note.schedule_event_id && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2">
                        📎 Прикреплен
                      </span>
                    )}

                    <button
                      onClick={(e) => handleOpenAttachModal(note, e)}
                      className="text-purple-500 hover:text-purple-700 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      title={note.schedule_event_id ? "Изменить прикрепление" : "Прикрепить к занятию"}
                    >
                      {note.schedule_event_id ? '📎' : '📌'}
                    </button>
                    
                    {/* Кнопка удаления */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Удалить этот конспект?')) {
                          fetch(`/api/lecture-notes/${note.id}`, { 
                            method: 'DELETE' 
                          })
                          .then(() => loadNotes());
                        }
                      }}
                      className="text-red-500 hover:text-red-700 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Удалить конспект"
                    >
                      🗑️
                    </button>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {note.content.replace(/\*\*/g, '').substring(0, 150)}...
                  </p>
                  {note.event_title && (
                    <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800">
                        <span>📅</span>
                        <span className="text-sm font-medium">
                          Прикреплен к: <span className="font-semibold">{note.event_title}</span> ({getDayName(note.event_day!)})
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2 text-xs text-gray-500">
                    {note.event_title && (
                      <div className="flex items-center gap-1">
                        <span>📅</span>
                        <span>{note.event_title} ({getDayName(note.event_day!)})</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span>📁</span>
                      <span>{note.file_name}</span>
                    </div>
                    {note.image_count > 0 && (
                      <div className="flex items-center gap-1">
                        <span>🖼️</span>
                        <span>{note.image_count} слайдов</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span>⏰</span>
                      <span>{new Date(note.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}{showAttachModal && noteToAttach && (
        <AttachToScheduleModal
          isOpen={showAttachModal}
          onClose={() => {
            setShowAttachModal(false);
            setNoteToAttach(null);
             if (tempSelectedNote) {
              setSelectedNote(tempSelectedNote);
              setTempSelectedNote(null);
            }
          }}
          onAttach={handleAttachToSchedule}
          noteId={noteToAttach.id}
          currentEventId={noteToAttach.schedule_event_id}
        />
      )}
        </div>
      </div>

      {/* Модальное окно просмотра конспекта */}
      {selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                   <div className="flex items-center gap-2">
                    {isEditingTitle ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="text-xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateNoteTitle(selectedNote.id, editedTitle);
                            }
                            if (e.key === 'Escape') {
                              setIsEditingTitle(false);
                              setEditedTitle(selectedNote.title);
                            }
                          }}
                        />
                        <button
                          onClick={() => updateNoteTitle(selectedNote.id, editedTitle)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingTitle(false);
                            setEditedTitle(selectedNote.title);
                          }}
                          className="bg-gray-600 text-white px-3 py-1 rounded text-sm"
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-xl font-bold text-gray-900">{selectedNote.title}</h2>
                        <button
                          onClick={() => {
                            setIsEditingTitle(true);
                            setEditedTitle(selectedNote.title);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          title="Редактировать название"
                        >
                          ✏️
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 flex-wrap">
                    {selectedNote.event_title && (
                      <span>📅 {selectedNote.event_title} ({getDayName(selectedNote.event_day!)})</span>
                    )}
                    <span>📁 {selectedNote.file_name}</span>
                    {selectedNote.image_count > 0 && (
                      <span>🖼️ {selectedNote.image_count} слайдов</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl ml-4"
                >
                  ×
                </button>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditingTitle(true);
                    setEditedTitle(selectedNote.title);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  ✏️ Редактировать
                </button>
                <button
                  onClick={() => {
                    // Сохраняем конспект во временное состояние
                    setTempSelectedNote(selectedNote);
                    // Закрываем модальное окно конспекта
                    setSelectedNote(null);
                    // Открываем модальное окно прикрепления
                    setNoteToAttach(selectedNote);
                    setShowAttachModal(true);
                  }}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  {selectedNote.schedule_event_id ? '📎 Изменить прикрепление' : '📌 Прикрепить к занятию'}
                </button>
                <button
                  onClick={() => {
                    // Создаем текстовый файл для скачивания
                    const content = `${selectedNote.title}\n\n${selectedNote.content}`;
                    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${selectedNote.title.replace(/[^a-zа-яё0-9]/gi, '_')}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  📥 Скачать TXT
                </button>
                
                <button
                  onClick={() => {
                    if (confirm('Удалить этот конспект? Это действие нельзя отменить.')) {
                      fetch(`/api/lecture-notes/${selectedNote.id}`, { 
                        method: 'DELETE' 
                      })
                      .then(response => {
                        if (response.ok) {
                          setSelectedNote(null);
                          loadNotes();
                        } else {
                          alert('❌ Ошибка удаления конспекта');
                        }
                      })
                      .catch(error => {
                        console.error('Ошибка удаления:', error);
                        alert('❌ Ошибка удаления конспекта');
                      });
                    }
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  🗑️ Удалить
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-gray-800 font-sans">
                  {selectedNote.content}
                </pre>
              </div>

              {(selectedNote.audio_transcript || selectedNote.slides_text) && (
                <div className="mt-8 space-y-6">
                  {selectedNote.audio_transcript && selectedNote.audio_transcript !== 'Нет транскрипции' && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">🎤 Исходная транскрипция:</h3>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700">
                          {selectedNote.audio_transcript.substring(0, 500)}...
                        </pre>
                      </div>
                    </div>
                  )}

                  {selectedNote.slides_text && selectedNote.slides_text !== 'Нет распознанного текста с слайдов' && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">📸 Текст со слайдов:</h3>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700">
                          {selectedNote.slides_text.substring(0, 500)}...
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
}