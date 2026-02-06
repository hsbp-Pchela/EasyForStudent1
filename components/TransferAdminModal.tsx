'use client';

import { useState } from 'react';

interface TransferAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  currentMembers: string[];
  currentUserPhone: string;
}

export default function TransferAdminModal({ 
  isOpen, 
  onClose, 
  groupId, 
  currentMembers, 
  currentUserPhone 
}: TransferAdminModalProps) {
  const [selectedMember, setSelectedMember] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Исключаем текущего админа из списка
  const availableMembers = currentMembers.filter(member => member !== currentUserPhone);

  const handleTransfer = async () => {
    if (!selectedMember) {
      alert('Выберите участника');
      return;
    }

    setIsTransferring(true);
    
    try {
      const response = await fetch('/api/groups/transfer-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newAdminPhone: selectedMember,
          groupId: groupId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Права администратора успешно переданы!');
        onClose();
        // Можно обновить страницу или состояние
        window.location.reload();
      } else {
        alert(`❌ Ошибка: ${data.error}`);
      }
    } catch (error) {
      console.error('Ошибка передачи прав:', error);
      alert('❌ Ошибка соединения с сервером');
    } finally {
      setIsTransferring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          👑 Передача прав администратора
        </h2>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Вы собираетесь передать права администратора группы другому участнику. 
            После передачи вы потеряете возможность редактировать расписание и управлять группой.
          </p>
          
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Выберите нового администратора:
          </label>
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">-- Выберите участника --</option>
            {availableMembers.map(member => (
              <option key={member} value={member}>
                {member}
              </option>
            ))}
          </select>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={isTransferring}
            className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-400"
          >
            Отмена
          </button>
          <button
            onClick={handleTransfer}
            disabled={!selectedMember || isTransferring}
            className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400"
          >
            {isTransferring ? 'Передача...' : 'Передать права'}
          </button>
        </div>
      </div>
    </div>
  );
}