# AcadLink - Student Academic Management System

AcadLink is a modern, unified portal designed to streamline academic management for students, faculty, and administrators. It provides a clean, responsive, and high-performance interface for tracking academic progress, managing assignments, and fostering institution-wide communication.

## 🚀 Key Features

- **Unified Dashboard**: Real-time overview of academic status, attendance, and recent activities.
- **Attendance Tracking**: Comprehensive attendance management with case-insensitive grouping and easy-to-read history.
- **Assignment Management**: Track, submit, and manage academic tasks seamlessly.
- **Mobile Optimized**: Fully responsive UI with a mobile-first sidebar (Drawer/Sheet) for a premium experience on all devices.
- **Role-Based Access**: Specialized interfaces for Students, Faculty, Parents, and Admins.
- **Achievements & Recognition**: Track academic milestones and awards.
- **Institution Community**: Integrated communication platform for academic discussions.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **UI Components**: Radix UI / Shadcn

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (via SQLAlchemy)
- **Authentication**: JWT-based Secure Auth

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- Bun or NPM
- Python 3.9+ (for backend)

### Frontend Installation

```bash
cd unified-access-portal-main
npm install
# or
bun install
```

### Running the App

```bash
npm run dev
# or
bun dev
```

### Backend Installation

```bash
cd app
pip install -r requirements.txt
python main.py
```

## 📱 Mobile Experience

AcadLink is built with a mobile-first philosophy. On smaller screens, the sidebar transitions into a slide-out drawer, and typography scales dynamically to ensure maximum usability on the go.

## 📄 License

This project is licensed under the MIT License.