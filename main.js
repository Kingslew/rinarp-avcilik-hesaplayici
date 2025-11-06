const { app, BrowserWindow } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater'); // <-- OTOMATİK GÜNCELLEYİCİ EKLENDİ

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, 'logo.png'),
    webPreferences: {
      contextIsolation: true,
    }
  });

  // index.html dosyasını yükle
  mainWindow.loadFile('index.html');
  
  // Menü çubuğunu kaldır
  mainWindow.setMenu(null);

  // Geliştirici araçlarını açmak için bu satırı yorumdan çıkarabilirsiniz
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  // OTOMATİK GÜNCELLEME KONTROLÜ EKLENDİ
  // Uygulama açıldığında, yeni bir güncelleme olup olmadığını
  // package.json'da belirtilen adresten (GitHub) kontrol eder
  // ve bir güncelleme bulursa kullanıcıya bildirir.
  autoUpdater.checkForUpdatesAndNotify();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});