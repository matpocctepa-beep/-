const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();

// Разрешаем запросы с любых доменов (для вашей админки)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Настройка хранения файлов (куда и как сохранять загруженный APK)
const storage = multer.diskStorage({
  destination: (req, file, cb) => { 
    cb(null, __dirname); // Сохраняем в корень сервера
  },
  filename: (req, file, cb) => { 
    cb(null, 'Kot-vps.apk'); // Всегда переименовываем в Kot-vps.apk
  }
});
const upload = multer({ storage: storage });

// 1. Маршрут для загрузки нового АРК (из админки) + СОХРАНЕНИЕ ИСТОРИИ
app.post('/upload-apk', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('Файл не загружен');
  
  // Читаем текущий файл статистики
  const data = JSON.parse(fs.readFileSync('stats.json', 'utf8'));
  
  // Сбрасываем счетчик скачиваний для нового файла
  data.downloads = 0;
  
  // Готовим данные для истории
  const now = new Date();
  const dateStr = now.toLocaleDateString('ru-RU') + ', ' + now.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'});
  const sizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
  
  // Если массив истории ещё не создан, создаём его
  if (!data.history) data.history = [];
  
  // Добавляем новую запись в начало списка
  data.history.unshift({
    name: req.file.originalname,
    size: sizeMB + ' МБ',
    date: dateStr,
    isCurrent: true
  });
  
  // Убираем статус "Текущий" у всех старых записей (кроме только что добавленной)
  data.history.forEach((item, index) => {
    if (index > 0) item.isCurrent = false;
  });

  // Сохраняем всё обратно в файл
  fs.writeFileSync('stats.json', JSON.stringify(data, null, 2));
  
  res.send('АРК успешно заменен! История обновлена.');
});

// 2. Маршрут для получения статистики и истории (для админки)
app.get('/get-stats', (req, res) => {
  // Если файла нет, создаём дефолтный
  if (!fs.existsSync('stats.json')) {
    const initData = { android: 0, ios: 0, windows: 0, mac: 0, downloads: 0, history: [] };
    fs.writeFileSync('stats.json', JSON.stringify(initData, null, 2));
  }
  
  const data = JSON.parse(fs.readFileSync('stats.json', 'utf8'));
  res.json(data);
});

// 3. Маршрут для сброса статистики
app.post('/reset-stats', (req, res) => {
  const data = JSON.parse(fs.readFileSync('stats.json', 'utf8'));
  data.android = 0;
  data.ios = 0;
  data.windows = 0;
  data.mac = 0;
  data.downloads = 0;
  // Сбрасываем также историю, если хотите. Оставляем для чистоты.
  data.history = []; 
  fs.writeFileSync('stats.json', JSON.stringify(data, null, 2));
  res.send('Статистика сброшена! История очищена.');
});

// 4. РАЗРЕШАЕМ ОТДАВАТЬ APK ФАЙЛ ПО ПРЯМОЙ ССЫЛКЕ
app.get('/Kot-vps.apk', (req, res) => {
    const filePath = path.join(__dirname, 'Kot-vps.apk');
    
    // Проверяем, существует ли файл перед отправкой
    if (fs.existsSync(filePath)) {
        res.download(filePath, 'Kot-vps.apk', (err) => {
            if (err) {
                console.log('Ошибка при скачивании:', err);
            }
        });
    } else {
        res.status(404).send('Файл не найден. Загрузите APK через админ-панель.');
    }
});

// 5. Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  
  // Создаём файл статистики при первом запуске, если его нет
  if (!fs.existsSync('stats.json')) {
    const initData = { 
        android: 0, 
        ios: 0, 
        windows: 0, 
        mac: 0, 
        downloads: 0,
        history: [] 
    };
    fs.writeFileSync('stats.json', JSON.stringify(initData, null, 2));
  }
});
