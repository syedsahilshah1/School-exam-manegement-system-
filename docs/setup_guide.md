# Electron + MySQL Setup Guide

This project is now configured for **Electron** (Node.js) and **MySQL**, which are lighter and more flexible than the previous .NET setup.

## 1. Prerequisites
- **Node.js** (Latest LTS version 추천)
- **VS Code** (Recommended Editor)
- **MySQL Server** (You can use XAMPP, WAMP, or a standalone MySQL installation)

## 2. Database Setup
1. Open your MySQL tool (like phpMyAdmin, MySQL Workbench, or Command Line).
2. Create a new database named `SchoolExamDB`.
3. Open and run the `database_setup.sql` script located in the root directory.

## 3. Project Initialization
Since we are using Electron and React:
1. Open terminal in this folder.
2. Run `npm install` to install all dependencies.
3. Create a `.env` file in the root and add your database credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=yourpassword
   DB_NAME=SchoolExamDB
   ```

## 4. Running the App
- **Development Mode**: Run `npm run dev` to start the interface.
- **Desktop Mode**: Run `npm start` to launch the Electron window.

## 5. Technology Stack (Updated)
- **Frontend**: React.js / HTML / Tailwind CSS
- **Backend / Desktop**: Node.js + Electron
- **Database**: MySQL (via `mysql2`)
- **PDF Generation**: `jspdf` & `jspdf-autotable`

---

## 💡 Why this is better?
- **Fast Development**: Everything is web-based (HTML/CSS/JS).
- **Lighter Footprint**: Does not require the heavy .NET runtime or Visual Studio.
- **Cross-Platform**: Can be easily ported to Linux or Mac if needed.
- **Modern UI**: You can use best-in-class UI libraries like Tailwind CSS or Framer Motion.
