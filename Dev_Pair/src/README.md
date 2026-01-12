# Mentorship Platform with WebRTC

A complete mentorship platform featuring real-time video conferencing using WebRTC, chat, file sharing, and session management.

## Features

- 🔐 **Authentication** - User registration, login, and profile management
- 🎥 **WebRTC Video Conferencing** - Real-time video/audio communication
- 💬 **Real-time Chat** - In-session messaging with Socket.IO
- 📁 **File Sharing** - Upload and share files during sessions
- 📊 **Session Management** - Create, join, and manage mentorship sessions
- 👥 **User Management** - Mentor and student profiles
- 📱 **Responsive Design** - Mobile-friendly interface
- 🔒 **Security** - JWT authentication, rate limiting, CORS

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (via Supabase)
- **Real-time**: Socket.IO, WebRTC
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **Deployment**: Docker-ready

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mentorship-platform