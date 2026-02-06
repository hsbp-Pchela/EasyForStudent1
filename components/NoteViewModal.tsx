// components/NoteViewModal.tsx
'use client';

import { useState, useEffect } from 'react';

interface NoteViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: {
    id: string;
    title: string;
    content: string;
    event_title?: string;
    event_day?: string;
    created_at: string;
  } | null;
  onUpdateTitle?: (noteId: string, newTitle: string) => Promise<void>;
}

export default function NoteViewModal({ 
  isOpen, 
  onClose, 
  note, 
  onUpdateTitle 
}: NoteViewModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  useEffect(() => {
    if (note) {
      setEditedTitle(note.title);
    }
  }, [note]);

  if (!isOpen || !note) return null;

  const handleDownload = () => {
    setIsDownloading(true);
    try {
      // Создаем текстовый файл
      const content = `${note.title}\n\n${note.content}`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.title.replace(/[^a-zа-яё0-9]/gi, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка скачивания:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) {
      alert('Название не может быть пустым');
      return;
    }

    if (onUpdateTitle) {
      await onUpdateTitle(note.id, editedTitle);
      setIsEditingTitle(false);
    } else {
      // Если нет функции обновления, просто закрываем редактирование
      setIsEditingTitle(false);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Заголовок */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveTitle();
                      }
                      if (e.key === 'Escape') {
                        setIsEditingTitle(false);
                        setEditedTitle(note.title);
                      }
                    }}
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700"
                    title="Сохранить"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingTitle(false);
                      setEditedTitle(note.title);
                    }}
                    className="bg-gray-600 text-white px-2 py-1 rounded text-sm hover:bg-gray-700"
                    title="Отмена"
                  >
                    ✗
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900 truncate">{note.title}</h2>
                  {onUpdateTitle && (
                    <button
                      onClick={() => setIsEditingTitle(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      title="Редактировать название"
                    >
                      ✏️
                    </button>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 flex-wrap">
                {note.event_title && (
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded flex items-center gap-1">
                    📅 {note.event_title} {note.event_day && `(${getDayName(note.event_day)})`}
                  </span>
                )}
                <span>Создан: {new Date(note.created_at).toLocaleDateString('ru-RU')}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl ml-4 flex-shrink-0"
            >
              ×
            </button>
          </div>
          
          {/* Кнопки действий */}
          <div className="flex gap-2">
            {onUpdateTitle && !isEditingTitle && (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                ✏️ Редактировать название
              </button>
            )}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {isDownloading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Скачивание...
                </div>
              ) : (
                '📥 Скачать как TXT'
              )}
            </button>
          </div>
        </div>
        
        {/* Контент с прокруткой */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap text-gray-800 font-sans bg-gray-50 p-4 rounded-lg">
              {note.content}
            </pre>
          </div>
        </div>

        {/* Нижняя панель с кнопкой закрытия */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}