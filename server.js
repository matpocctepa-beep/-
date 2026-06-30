const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();

// Разрешаем запросы с любых сайтов (для вашей админки)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Настройка, куда сохранять файл
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, __dirname); },
  filename: (req, file, cb) => { cb(null, 'Kot-vps.apk'); }
});
const upload = multer({ storage: storage });

// Маршрут для загрузки нового АРК
app.post('/upload-apk', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('Файл не загружен');
  
  // Обновляем статистику
  const data = JSON.parse(fs.readFileSync('stats.json', 'utf8'));
  data.downloads = 0;
  fs.writeFileSync('stats.json', JSON.stringify(data, null, 2));
  
  res.send('АРК успешно заменен!');
});

// Маршрут для получения статистики
app.get('/get-stats', (req, res) => {
  const data = JSON.parse(fs.readFileSync('stats.json', 'utf8'));
  res.json(data);
});

// Маршрут для сброса статистики
app.post('/reset-stats', (req, res) => {
  const data = JSON.parse(fs.readFileSync('stats.json', 'utf8'));
  data.android = 0;
  data.ios = 0;
  data.windows = 0;
  data.mac = 0;
  data.downloads = 0;
  fs.writeFileSync('stats.json', JSON.stringify(data, null, 2));
  res.send('Статистика сброшена!');
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  // Создаём файл статистики, если его нет
  if (!fs.existsSync('stats.json')) {
    const initData = { android: 0, ios: 0, windows: 0, mac: 0, downloads: 0 };
    fs.writeFileSync('stats.json', JSON.stringify(initData, null, 2));
  }
});
