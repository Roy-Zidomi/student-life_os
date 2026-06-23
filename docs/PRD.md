# Product Requirements Document (PRD)

# Student Life OS

Version 1.0

---

# 1. Product Overview

Student Life OS adalah platform produktivitas berbasis web yang dirancang khusus untuk mahasiswa agar dapat mengelola kehidupan akademik, produktivitas, dan keuangan dalam satu tempat.

Platform ini menggabungkan fungsi:

* Task Management
* Calendar
* Note Taking
* Study Tracker
* Habit Tracker
* Finance Tracker
* GPA Predictor
* Analytics
* AI Assistant

Tujuan utama adalah menghilangkan kebutuhan menggunakan banyak aplikasi berbeda dan memberikan pengalaman yang terintegrasi.

---

# 2. Problem Statement

Mahasiswa menggunakan banyak aplikasi yang terpisah:

| Kebutuhan     | Aplikasi        |
| ------------- | --------------- |
| To-do List    | Todoist         |
| Kalender      | Google Calendar |
| Catatan       | Notion          |
| Fokus Belajar | Forest          |
| Keuangan      | Money Lover     |
| Bantuan AI    | Gemini Ai       |

Hal ini menyebabkan:

* Informasi tersebar.
* Tidak ada analisis terpadu.
* Sulit mengetahui produktivitas secara keseluruhan.

---

# 3. Target User

Primary User:

Mahasiswa S1 usia 18-25 tahun.

Secondary User:

* Fresh graduate.
* Siswa SMA.
* Mahasiswa pascasarjana.

---

# 4. Product Goals

### Goal 1

Menyediakan pusat produktivitas mahasiswa dalam satu aplikasi.

### Goal 2

Membantu mahasiswa mengatur waktu belajar.

### Goal 3

Membantu memonitor pengeluaran.

### Goal 4

Memberikan insight berbasis AI.

### Goal 5

Menjadi platform yang dapat berkembang menjadi AI Student Assistant.

---

# 5. MVP Scope

Versi pertama mencakup:

### Authentication

* Register
* Login
* Logout

### Dashboard

* Today's Schedule
* Upcoming Tasks
* Study Hours
* Expense Summary

### Task Management

* CRUD Task
* Priority
* Deadline
* Status

### Calendar

* Event Management

### Notes

* CRUD Notes

### Pomodoro Study Tracker

* Start Session
* Stop Session
* Statistics

### Habit Tracker

* Daily Habit Tracking

### Finance Tracker

* Income
* Expense
* Categories

### GPA Predictor

* Semester GPA
* Cumulative GPA

### Analytics

* Productivity Statistics

---

# 6. Non-MVP Features

Future features:

* OCR Assignment Scanner
* AI Assistant
* Chat With Notes
* PDF Learning Assistant
* Flashcard Generator
* Exam Planner
* Notification System
* Mobile App
* Collaboration

---

# 7. Functional Requirements

## Authentication Module

User can:

* Register account.
* Login.
* Logout.
* Edit profile.

---

## Dashboard Module

Display:

Today's Events.

Upcoming Deadlines.

Study Hours This Week.

Monthly Expenses.

Habit Streak.

Task Completion Percentage.

---

## Task Module

Task attributes:

* title
* description
* priority
* deadline
* status

Status:

* Todo
* In Progress
* Done

Priority:

* Low
* Medium
* High

Operations:

* Create
* Read
* Update
* Delete

---

## Calendar Module

Event attributes:

* title
* location
* startDate
* endDate

Operations:

* Create Event
* Edit Event
* Delete Event

Views:

* Daily
* Weekly
* Monthly

---

## Notes Module

Attributes:

* title
* content

Operations:

* Create
* Edit
* Delete

---

## Study Session Module

Attributes:

* subject
* duration
* date

Operations:

* Start Session
* End Session

Statistics:

* Daily
* Weekly
* Monthly

---

## Habit Module

Attributes:

* name
* frequency

Operations:

* Create Habit
* Mark Completed
* View Streak

---

## Finance Module

Transaction Types:

Income

Expense

Categories:

* Food
* Transportation
* Education
* Entertainment
* Other

Operations:

* Add Transaction
* Edit Transaction
* Delete Transaction

---

## GPA Module

Course attributes:

* courseName
* credits
* grade

Outputs:

* IPS
* IPK

---

## Analytics Module

Display:

* Total Tasks Completed
* Study Hours
* Monthly Expenses
* Habit Streak
* GPA Trend

---

# 8. User Flow

Register

↓

Login

↓

Dashboard

↓

Task Management

↓

Calendar

↓

Study Tracking

↓

Analytics

↓

AI Insights

---

# 9. Database Entities

User

Task

Event

Note

StudySession

Habit

HabitLog

Transaction

Course

Grade

Notification

---

# 10. Success Metrics

Daily Active Users.

Weekly Study Hours.

Task Completion Rate.

Habit Streak Retention.

Monthly Active Users.

Average Session Duration.

---

# 11. Technical Stack

Frontend

* Next.js 15
* TypeScript
* Tailwind CSS
* Shadcn UI

Backend

* Route Handlers
* Server Actions

Database

* PostgreSQL

ORM

* Prisma

Authentication

* Clerk

Charts

* Recharts

AI

* Google Gemini

Deployment

* Vercel

Storage

* Cloudinary

---

# 12. Long-Term Vision

Student Life OS akan berkembang menjadi AI Operating System untuk mahasiswa yang mampu:

* memahami jadwal pengguna,
* memahami tugas pengguna,
* memahami kebiasaan belajar pengguna,
* memahami kondisi keuangan pengguna,

dan memberikan rekomendasi otomatis layaknya "personal academic assistant".

Inspirasi:

* Notion
* Todoist
* Google Calendar
* Forest
* Money Lover
* ChatGPT

Tujuan akhir:

Menjadi platform all-in-one berbasis AI yang membantu mahasiswa mengelola kehidupan akademik dan produktivitas secara lebih efektif.
