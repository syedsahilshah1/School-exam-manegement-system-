const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let mainWindow;

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        title: "School Exam Management System"
    });

    const isDev = !app.isPackaged;
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('db-query', async (event, query, params) => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'SchoolExamDB',
    });

    try {
        const [rows] = await connection.execute(query, params);
        await connection.end();
        return { success: true, data: rows };
    } catch (error) {
        await connection.end();
        return { success: false, error: error.message };
    }
});

ipcMain.handle('auth-login', async (event, email, password) => {
    const envEmail = process.env.ADMIN_EMAIL || 'admin@school.com';
    const envPass = process.env.ADMIN_PASS || 'admin123';

    if (email === envEmail && password === envPass) {
        return {
            success: true,
            user: { Id: 1, Name: 'Super Admin', Email: envEmail, Role: 'SuperAdmin' }
        };
    }

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'SchoolExamDB',
    });

    try {
        const [rows] = await connection.execute('SELECT * FROM Users WHERE Email = ?', [email]);
        await connection.end();

        if (rows.length > 0) {
            const user = rows[0];
            const isValid = await bcrypt.compare(password, user.PasswordHash);
            if (isValid) {
                return { success: true, user };
            }
        }
        return { success: false, error: 'Invalid credentials' };
    } catch (error) {
        if (connection) await connection.end();
        return { success: false, error: error.message };
    }
});

ipcMain.handle('hash-password', async (event, password) => {
    return await bcrypt.hash(password, 10);
});
