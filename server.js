const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => { 
    cb(null, __dirname);
  },
  filename: (req, file, cb) => { 
    cb(null, 'Kot-vps.apk');
  }
});
const upload = multer({ storage: storage });

app.post('/upload-apk', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('Файл не загружен');
  
  try {
    const data = JSON.parse(fs.readFileSync('stats.json', 'utf8'));
    data.downloads = 0;
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('ru-RU') + ', ' + now.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'});
    const sizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
    
    if (!data.history) data.history = [];
    
    data.history.unshift({
      name: req.file.originalname,
      size: sizeMB + ' МБ',
      date: dateStr,
      isCurrent: true
    });
    
    data.history.forEach((item, index) => {
      if (index > 0) item.isCurrent = false;
    });

    fs.writeFileSync('stats.json', JSON.stringify(data, null, 2));
    res.send('АРК успешно заменен! История обновлена.');
  } catch (error) {
    console.error('Ошибка при записи:', error);
    res.status(500).send('Ошибка сервера при сохранении файла.');
  }
});

app.get('/get-stats', (req, res) => {
  if (!fs.existsSync('stats.json')) {
    const initData = { android: 0, ios: 0, windows: 0, mac: 0, downloads: 0, history: [] };
    fs.writeFileSync('stats.json', JSON.stringify(initData, null, 2));
  }
  const data = JSON.parse(fs.readFileSync('stats.json', 'utf8'));
  res.json(data);
});

app.post('/reset-stats', (req, res) => {
  const data = JSON.parse(fs.readFileSync('stats.json', 'utf8'));
  data.android = 0;
  data.ios = 0;
  data.windows = 0;
  data.mac = 0;
  data.downloads = 0;
  data.history = []; 
  fs.writeFileSync('stats.json', JSON.stringify(data, null, 2));
  res.send('Статистика сброшена! История очищена.');
});

app.get('/Kot-vps.apk', (req, res) => {
    const filePath = path.join(__dirname, 'Kot-vps.apk');
    if (fs.existsSync(filePath)) {
        res.download(filePath, 'Kot-vps.apk', (err) => {
            if (err) console.log('Ошибка при скачивании:', err);
        });
    } else {
        res.status(404).send('Файл не найден. Загрузите APK через админ-панель.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  if (!fs.existsSync('stats.json')) {
    const initData = { android: 0, ios: 0, windows: 0, mac: 0, downloads: 0, history: [] };
    fs.writeFileSync('stats.json', JSON.stringify(initData, null, 2));
  }
});
