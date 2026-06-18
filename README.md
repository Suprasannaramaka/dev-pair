### Dev-Pair – Real-Time 1-on-1 Mentorship Platform:
Built a full-stack real-time mentorship platform enabling mentors and students to collaborate through shared code editing, live messaging, and WebRTC-based video communication. Implemented authentication, session management, collaborative coding workflows, and low-latency real-time interactions using Next.js, TypeScript, Socket.io, Supabase, and PostgreSQL.

### Overview
Dev-Pair is a full-stack real-time mentorship platform designed to facilitate live coding sessions between mentors and students.
The platform provides:
* Secure authentication
* Private mentorship sessions
* Real-time collaborative code editing
* Session-based messaging
* Peer-to-peer video communication
* Modern responsive UI

The goal is to create a seamless remote learning experience where mentors and students can communicate, write code together, and collaborate in real time.
{/*Core-View */}
### Features & Design Preview :-
🎨 **Figma Design Link:** You can explore the interactive [Dev-Pair Design System & Prototypes on Figma]
(https://www.figma.com/design/0VKhkN0Uzq1ywFZCv9uxwU/Dev-Pair?node-id=1-18&t=OECu76ppcf71ACjs-0)

### Authentication & Authorization :-
* Secure authentication using Supabase Auth
* Protected routes
* Session management
* Role-based access (Mentor / Student)

### Session Management:-
Mentors can:
* Create mentorship sessions
* Generate private invite links
* Start and end sessions

Students can:
* Join sessions using invite links
* Access shared workspace

### Real-Time Collaborative Editor :-
{/* */}
* Monaco Editor integration
* Language selection
* Live code synchronization
* Shared coding environment
* Low-latency updates using WebSockets

### Real-Time Chat :-
* Session-specific messaging
* Message persistence
* Timestamps
* System-generated events

### Video Communication :-

* Peer-to-peer video calls using WebRTC
* Camera toggle
* Microphone toggle
* Low-latency communication

## Tech Stack:-
### Frontend:
* Next.js 16
* React 19
* TypeScript
* Tailwind CSS
* Monaco Editor
* shadcn/ui
### Backend:
* Node.js
* Express.js
* Socket.io

### Real-Time Technologies:-
* Socket.io
* WebRTC

### Database:-
* PostgreSQL
* Supabase

### Deployment:-
Frontend:
* Vercel

Backend:
* Railway / Render

---

## System Architecture:-

                                    User Browser
                                       ↓
                                  Next.js Frontend
                                        ↓
                                   Socket.io Server
                                         ↓
                                  PostgreSQL / Supabase
                                           ↓
                                  Real-Time Services:
                                 * Collaborative Editor
                                       * Chat
                                    * Video Signaling 


---

## Database Schema:-

### profiles:-
id
email
role
created_at

### sessions:
id
mentor_id
student_id
status
created_at
ended_at

### messages:
id
session_id
sender_id
message
created_at

### code_snapshots:
id
session_id
code
language
created_at

---

## Application Flow:
 ### Mentor Flow  :-

                                      Login
                                        ↓
                                  Create Session
                                       ↓
                                Generate Invite Link
                                        ↓
                                   Wait For Student
                                         ↓
                                   Collaborate
                                         ↓
                                    End Session

### Student Flow :-

                                      Login
                                       ↓
                                 Open Invite Link
                                        ↓
                                   Join Session
                                        ↓
                                   Collaborate
                                        ↓
                                  Leave Session
