# Telegram Bot - Student Life OS

Dokumen ini menjelaskan cara setup, deploy, dan menggunakan bot Telegram Student Life OS.

## Fitur MVP

- Link akun Telegram ke akun Student Life OS.
- Menu tombol dan menu angka.
- Ringkasan hari ini: jadwal, deadline, jam belajar, habit.
- Tugas: lihat tugas aktif dan tambah tugas cepat.
- Keuangan: lihat ringkasan, riwayat, tambah pengeluaran, tambah pemasukan.
- Habit: lihat habit hari ini dan toggle selesai/batal.
- Belajar: lihat ringkasan sesi belajar dan catat sesi baru.
- IPK: lihat ringkasan IPK dan IPS per semester.

## Environment Variables

Tambahkan variable berikut di Vercel dan `.env` lokal:

```env
TELEGRAM_BOT_TOKEN=token_dari_botfather
TELEGRAM_WEBHOOK_SECRET=secret_random_panjang
```

Project juga tetap membutuhkan env yang sudah ada:

```env
DATABASE_URL=postgres_connection_pooler_supabase
DIRECT_URL=postgres_direct_connection_supabase
```

Gunakan nilai `TELEGRAM_WEBHOOK_SECRET` yang sulit ditebak, misalnya string random 32 karakter atau lebih.

## Membuat Bot Di BotFather

1. Buka Telegram, cari `@BotFather`.
2. Kirim:

```text
/newbot
```

3. Ikuti instruksi BotFather untuk membuat nama dan username bot.
4. Simpan token yang diberikan sebagai `TELEGRAM_BOT_TOKEN`.

Opsional, set command list:

```text
/setcommands
```

Isi:

```text
start - Mulai bot
menu - Buka menu utama
link - Hubungkan akun Student Life OS
```

## Migrasi Database Supabase

Bot membutuhkan tiga tabel baru:

- `TelegramAccount`
- `TelegramLinkCode`
- `TelegramBotSession`

Jalankan migrasi:

```bash
npx prisma migrate deploy
```

Jika menjalankan dari Windows PowerShell dan `npm/npx` diblokir execution policy, gunakan:

```powershell
npx.cmd prisma migrate deploy
```

Alternatif manual: buka Supabase SQL Editor, lalu jalankan isi file:

```text
prisma/migrations/20260709090000_add_telegram_bot/migration.sql
```

Setelah schema berubah, generate Prisma Client:

```bash
npx prisma generate
```

atau:

```powershell
npx.cmd prisma generate
```

## Deploy Ke Vercel

1. Pastikan env berikut sudah ada di Vercel:

```text
DATABASE_URL
DIRECT_URL
CLERK_*
GOOGLE_GENERATIVE_AI_API_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
```

2. Deploy ulang aplikasi.
3. Pastikan route webhook tersedia:

```text
https://domain-anda.vercel.app/api/telegram/webhook
```

## Set Webhook Telegram

Ganti `DOMAIN_ANDA`, `TOKEN_ANDA`, dan `SECRET_ANDA`.

PowerShell:

```powershell
$body = @{
  url = "https://DOMAIN_ANDA.vercel.app/api/telegram/webhook"
  secret_token = "SECRET_ANDA"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "https://api.telegram.org/botTOKEN_ANDA/setWebhook" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

Bash/curl:

```bash
curl -X POST "https://api.telegram.org/botTOKEN_ANDA/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://DOMAIN_ANDA.vercel.app/api/telegram/webhook",
    "secret_token": "SECRET_ANDA"
  }'
```

Cek status webhook:

```bash
curl "https://api.telegram.org/botTOKEN_ANDA/getWebhookInfo"
```

## Cara Menghubungkan Akun

1. Login ke web Student Life OS.
2. Buka:

```text
Settings > Telegram Bot
```

3. Klik `Buat Kode Link`.
4. Salin command yang muncul, contohnya:

```text
/link 123456
```

5. Buka bot Telegram.
6. Kirim command tersebut.
7. Jika berhasil, bot akan menampilkan menu utama.

Kode link berlaku 10 menit dan hanya bisa dipakai sekali.

## Cara Menggunakan Bot

Menu utama:

```text
1. Hari Ini
2. Tugas
3. Keuangan
4. Habit
5. Belajar
6. IPK
```

User bisa memilih tombol atau mengetik angka.

### Keuangan

Pilih `Keuangan`, lalu pilih:

- `+ Pengeluaran`
- `+ Pemasukan`
- `Riwayat`

Flow tambah pengeluaran:

```text
Bot: Nominal pengeluaran berapa?
User: 15000
Bot: Deskripsinya apa?
User: Sarapan
Bot: Pilih kategori
User: Makanan
```

Command cepat juga tersedia:

```text
pengeluaran 15000 sarapan
```

Transaksi akan langsung masuk ke database Supabase dan muncul di halaman Keuangan web.

### Tugas

Pilih `Tugas`, lalu:

- lihat tugas aktif,
- klik `+ Tugas Baru`,
- kirim judul tugas.

Tugas baru disimpan dengan status `TODO` dan priority `MEDIUM`.

### Habit

Pilih `Habit`, lalu klik tombol habit untuk menandai selesai atau membatalkan status selesai hari ini.

### Belajar

Pilih `Belajar`, lalu klik `+ Catat Sesi Belajar`.

Flow:

```text
Bot: Subjek/mata kuliah yang dipelajari?
User: Kalkulus
Bot: Berapa menit durasinya?
User: 25
```

### IPK

Pilih `IPK` untuk melihat:

- IPK kumulatif,
- total SKS,
- jumlah mata kuliah bernilai,
- IPS per semester.

## Keamanan

- Webhook memvalidasi header `X-Telegram-Bot-Api-Secret-Token`.
- Bot tidak memberi akses data sebelum akun Telegram di-link.
- Link code sekali pakai dan kedaluwarsa setelah 10 menit.
- Semua query tetap dibatasi oleh `userId` milik akun Student Life OS.

## Troubleshooting

### Bot tidak merespon

Cek webhook:

```bash
curl "https://api.telegram.org/botTOKEN_ANDA/getWebhookInfo"
```

Pastikan:

- URL webhook benar.
- `TELEGRAM_BOT_TOKEN` benar.
- `TELEGRAM_WEBHOOK_SECRET` di Vercel sama dengan `secret_token` saat set webhook.
- Aplikasi sudah redeploy setelah env ditambahkan.

### Link code gagal

Kemungkinan:

- kode sudah kedaluwarsa,
- kode sudah pernah dipakai,
- user membuat kode baru sehingga kode lama dibatalkan.

Buat kode baru dari Settings.

### Data tidak muncul di web

Pastikan bot dan web memakai database Supabase yang sama:

```text
DATABASE_URL
DIRECT_URL
```

Pastikan migrasi Telegram sudah diterapkan ke Supabase.

### Prisma Client error setelah schema berubah

Jalankan:

```bash
npx prisma generate
```

atau:

```powershell
npx.cmd prisma generate
```
