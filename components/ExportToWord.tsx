// components/ExportToWord.tsx
'use client';

import { useState } from 'react';

interface ExportToWordProps {
  content: string;
  fileName: string;
}

export default function ExportToWord({ content, fileName }: ExportToWordProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateWordTemplate = async () => {
    if (!content) {
      alert('Нет контента для экспорта');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Очищаем контент
      const cleanContent = content
        .replace(/[🎓📚📋💡📊🎯🎤📝🖼️📸🔊✅⚠️❌📄📝📓🎨🔗⏰📤📝🎉💥]/g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#/g, '')
        .replace(/---/g, '—')
        .trim();

      // Создаем SVG сетку как фоновое изображение
      const gridSVG = `
        <svg width="21cm" height="29.7cm" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#e0e0e0" stroke-width="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
      `;

      const gridBase64 = btoa(unescape(encodeURIComponent(gridSVG)));

      // Создаем HTML для Word документа
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Тетрадный конспект</title>
          <style>
            @page {
              size: A4;
              margin: 1.5cm;
            }
            body {
              margin: 0;
              padding: 1.5cm;
              font-family: 'Times New Roman', serif;
              font-size: 14pt;
              line-height: 1.5;
              background-image: url('data:image/svg+xml;base64,${gridBase64}');
              background-repeat: repeat;
            }
            .container {
              position: relative;
              z-index: 1;
            }
            .header {
              text-align: center;
              font-size: 16pt;
              font-weight: bold;
              margin-bottom: 20px;
            }
            .date {
              text-align: center;
              font-size: 12pt;
              color: #666;
              margin-bottom: 25px;
              font-style: italic;
            }
            .instructions {
              background: rgba(248, 249, 250, 0.9);
              border: 1px solid #dee2e6;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
              font-size: 11pt;
            }
            .content {
              white-space: pre-wrap;
              line-height: 1.6;
              min-height: 20cm;
            }
            .footer {
              margin-top: 30px;
              font-size: 10pt;
              color: #999;
              text-align: center;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">КОНСПЕКТ ЛЕКЦИИ</div>
            <div class="date">Создан: ${new Date().toLocaleDateString('ru-RU')}</div>
            
            <div class="instructions">
              <strong>💡 ИНСТРУКЦИЯ:</strong><br>
              1. УДАЛИТЕ этот блок с инструкцией (выделите и нажмите Delete)<br>
              2. ВСТАВЬТЕ свой текст конспекта в любое место<br>
              3. Фоновая сетка останется на месте<br>
              4. Настройте шрифт, размер и форматирование<br>
              5. Сохраните и распечатайте
            </div>
            
            <div class="content">
${cleanContent.split('\n').map(line => `              ${line}`).join('\n')}
            </div>
            
            <div class="footer">
              Тетрадный шаблон • Сгенерировано автоматически
            </div>
          </div>
        </body>
        </html>
      `;

      // Создаем Blob и скачиваем
      const blob = new Blob([htmlContent], { 
        type: 'application/msword' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName.replace(/[^a-zа-яё0-9]/gi, '_')}_тетрадь.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Ошибка создания Word документа:', error);
      alert('Ошибка при создании документа: ' + error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    const cleanContent = content
      .replace(/[🎓📚📋💡📊🎯🎤📝🖼️📸🔊✅⚠️❌📄📝📓🎨🔗⏰📤📝🎉💥]/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#/g, '');

    try {
      await navigator.clipboard.writeText(cleanContent);
      alert('✅ Текст скопирован в буфер обмена!');
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = cleanContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('✅ Текст скопирован в буфер обмена!');
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg mt-6 border border-gray-200">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        📘 Экспорт конспекта
      </h3>
      
      <div className="space-y-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-green-800 font-semibold">🎯 Тетрадный шаблон Word</p>
          <p className="text-green-600 text-sm mt-2">
            Создадим Word документ с фоновой сеткой. Сетка не мешает редактированию текста.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={copyToClipboard}
            disabled={!content}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 flex items-center justify-center font-semibold"
          >
            📋 Скопировать текст
          </button>

          <button
            onClick={generateWordTemplate}
            disabled={isGenerating || !content}
            className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 flex items-center justify-center font-semibold"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Создаём шаблон...
              </>
            ) : (
              <>
                <span className="mr-2">📄</span>
                Скачать Word шаблон
              </>
            )}
          </button>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-yellow-800 font-medium">💡 Преимущества этого подхода:</p>
          <ul className="text-yellow-700 text-sm mt-2 space-y-1 list-disc list-inside">
            <li>Сетка как фон - не мешает редактированию</li>
            <li>Можно вставлять текст в любое место</li>
            <li>Можно менять шрифты и форматирование</li>
            <li>Сетка остается на месте при печати</li>
            <li>Работает в любом Word-совместимом редакторе</li>
          </ul>
        </div>

        {!content && (
          <p className="text-red-500 text-sm text-center">
            Нет контента для экспорта. Сначала создайте конспект.
          </p>
        )}
      </div>
    </div>
  );
}