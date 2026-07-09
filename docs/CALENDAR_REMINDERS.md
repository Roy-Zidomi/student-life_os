# Calendar Reminders

Student Life OS mendukung dua jenis pengingat jadwal:

- Telegram reminder otomatis untuk event kalender.
- Link iCalendar (`.ics`) agar jadwal bisa di-subscribe dari kalender HP.

## Fitur

### Telegram Reminder

Endpoint cron akan mengirim pesan Telegram untuk event yang mulai:

- sekitar H-1,
- sekitar 1 jam sebelum event.

Reminder hanya dikirim ke user yang sudah menghubungkan Telegram melalui:

```text
Settings > Telegram Bot
```

Sistem menyimpan log di `EventReminderLog`, sehingga event yang sama tidak akan dikirim berkali-kali untuk tipe reminder yang sama.

### Kalender HP

User bisa membuat link kalender di:

```text
Settings > Kalender HP
```

Link tersebut bisa dipakai untuk subscribe jadwal di:

- Google Calendar,
- Apple Calendar,
- aplikasi kalender lain yang mendukung iCalendar feed.

Event di feed `.ics` membawa alarm bawaan:

- 1 hari sebelum event,
- 1 jam sebelum event.

## Environment Variables

Tambahkan env berikut di Vercel:

```env
CRON_SECRET=secret_random_panjang
```

Gunakan nilai random yang sulit ditebak. Jangan samakan dengan token Telegram.

## Migrasi Database

Jalankan migrasi baru:

```powershell
npx.cmd prisma migrate deploy
```

Jika database production sudah dibaseline manual seperti sebelumnya, jalankan SQL file ini di Supabase SQL Editor:

```text
prisma/migrations/20260709103000_add_calendar_reminders/migration.sql
```

Setelah SQL sukses, tandai migration sebagai applied:

```powershell
npx.cmd prisma migrate resolve --applied 20260709103000_add_calendar_reminders
```

Cek status:

```powershell
npx.cmd prisma migrate status
```

## Endpoint Cron

Endpoint reminder:

```text
GET /api/cron/event-reminders
```

Authorization bisa lewat header:

```text
Authorization: Bearer CRON_SECRET
```

Atau lewat query string:

```text
https://domain-anda.vercel.app/api/cron/event-reminders?secret=CRON_SECRET
```

## Menjalankan Scheduler

Panggil endpoint cron setiap 10 menit agar reminder H-1 dan H-1 jam tidak meleset.

Contoh memakai layanan external cron:

```text
https://student-life-os-lime.vercel.app/api/cron/event-reminders?secret=CRON_SECRET_ANDA
```

Schedule:

```text
*/10 * * * *
```

Jika menggunakan Vercel Cron, ikuti dokumentasi resmi Vercel untuk menambahkan cron job di `vercel.json`. Pastikan request cron bisa menyertakan secret atau gunakan scheduler eksternal yang mendukung header/query secret.

## Cara Subscribe Kalender Di HP

1. Buka Student Life OS.
2. Masuk ke:

```text
Settings > Kalender HP
```

3. Klik `Buat Link Kalender`.
4. Klik `Salin Link`.

### Google Calendar

1. Buka Google Calendar versi web.
2. Pilih `Other calendars`.
3. Pilih `From URL`.
4. Paste link kalender.
5. Klik `Add calendar`.

### Apple Calendar / iPhone

1. Buka Settings iPhone.
2. Pilih Calendar.
3. Pilih Accounts.
4. Add Account.
5. Other.
6. Add Subscribed Calendar.
7. Paste link kalender.

## Keamanan

- Link kalender bersifat private token. Siapa pun yang punya link bisa membaca jadwal.
- Jika link bocor, buka `Settings > Kalender HP`, lalu klik `Reset Link`.
- Klik `Matikan Link` untuk menonaktifkan feed kalender sepenuhnya.
- Endpoint cron dilindungi `CRON_SECRET`.
