# School Examination Paper Management System (Electron Version)

A modern desktop application built with **Electron**, **React**, and **MySQL** for managing school exam papers.

## 🚀 Features
- **Electron Desktop Shell**: Seamless OS integration.
- **MySQL Database**: Robust, multi-user storage.
- **Role-Based Access**: Specialized dashboards for Admin, Teacher, and Accountant.
- **Standardized Templates**: Automated exam paper formatting.
- **PDF Generation**: High-quality export with `jspdf`.

## 🛠 Tech Stack
- **Runtime**: Node.js
- **Framework**: Electron + React
- **Database**: MySQL
- **Styling**: Tailwind CSS
- **PDF**: jsPDF

## 📦 Getting Started
1. **Ensure Node.js is installed**.
2. **Setup MySQL**: Run `database_setup.sql`.
3. **Install Dependencies**: `npm install`.
4. **Configure Environment**: Create `.env` with DB credentials.
5. **Run**: `npm start`.

---

## 📂 Project Structure (Updated)
- `src/` - React frontend code.
- `main.js` - Electron main process logic.
- `preload.js` - Secure bridge between Electron and React.
- `database_setup.sql` - Database schema for MySQL.
- `docs/` - Technical guides and breakdowns.
