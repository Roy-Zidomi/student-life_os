import { addDays, endOfDay, format, startOfDay, startOfMonth, endOfMonth } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { TransactionCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { GRADE_MAP } from "@/lib/constants";

type TelegramUser = {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

type TelegramMessage = {
  message_id: number;
  from?: TelegramUser;
  chat: {
    id: number;
    type: string;
  };
  text?: string;
};

type TelegramCallbackQuery = {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

type InlineKeyboardMarkup = {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
};

type TelegramSessionData = {
  amount?: number;
  description?: string;
  transactionType?: "INCOME" | "EXPENSE";
  subject?: string;
};

type SessionState =
  | "IDLE"
  | "ADD_EXPENSE_AMOUNT"
  | "ADD_EXPENSE_DESCRIPTION"
  | "ADD_EXPENSE_CATEGORY"
  | "ADD_INCOME_AMOUNT"
  | "ADD_INCOME_DESCRIPTION"
  | "ADD_INCOME_CATEGORY"
  | "ADD_TASK_TITLE"
  | "ADD_STUDY_SUBJECT"
  | "ADD_STUDY_DURATION";

const EXPENSE_CATEGORIES = [
  ["FOOD", "Makanan"],
  ["TRANSPORTATION", "Transportasi"],
  ["EDUCATION", "Pendidikan"],
  ["ENTERTAINMENT", "Hiburan"],
  ["HEALTH", "Kesehatan"],
  ["OTHER", "Lainnya"],
] as const;

const INCOME_CATEGORIES = [
  ["SCHOLARSHIP", "Beasiswa"],
  ["SALARY", "Gaji"],
  ["ALLOWANCE", "Uang Saku"],
  ["FREELANCE", "Freelance"],
  ["OTHER", "Lainnya"],
] as const;

const ALL_TRANSACTION_CATEGORIES = [
  ...EXPENSE_CATEGORIES.map(([value]) => value),
  ...INCOME_CATEGORIES.map(([value]) => value),
] as TransactionCategory[];

function getBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }
  return token;
}

async function telegramApi(method: string, payload: Record<string, unknown>) {
  const response = await fetch(`https://api.telegram.org/bot${getBotToken()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Telegram API ${method} failed: ${text}`);
  }
}

async function sendMessage(chatId: string, text: string, replyMarkup?: InlineKeyboardMarkup) {
  await telegramApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

async function answerCallbackQuery(callbackQueryId: string) {
  await telegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
  });
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function mainMenuKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "Hari Ini", callback_data: "menu:today" },
        { text: "Tugas", callback_data: "menu:tasks" },
      ],
      [
        { text: "Keuangan", callback_data: "menu:finance" },
        { text: "Habit", callback_data: "menu:habits" },
      ],
      [
        { text: "Belajar", callback_data: "menu:study" },
        { text: "IPK", callback_data: "menu:gpa" },
      ],
    ],
  };
}

function financeKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "+ Pengeluaran", callback_data: "finance:add_expense" },
        { text: "+ Pemasukan", callback_data: "finance:add_income" },
      ],
      [
        { text: "Riwayat", callback_data: "finance:history" },
        { text: "Menu Utama", callback_data: "menu:main" },
      ],
    ],
  };
}

function categoryKeyboard(type: "INCOME" | "EXPENSE"): InlineKeyboardMarkup {
  const categories = type === "EXPENSE" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  return {
    inline_keyboard: [
      ...categories.map(([value, label]) => [{ text: label, callback_data: `finance:category:${value}` }]),
      [{ text: "Batal", callback_data: "flow:cancel" }],
    ],
  };
}

function cancelKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [[{ text: "Batal", callback_data: "flow:cancel" }]],
  };
}

function parseAmount(text: string) {
  const normalized = text.replace(/[^\d]/g, "");
  if (!normalized) return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 1 || amount > 999_999_999_999) return null;
  return amount;
}

function parseTransactionCategory(value: string): TransactionCategory | null {
  return ALL_TRANSACTION_CATEGORIES.includes(value as TransactionCategory)
    ? (value as TransactionCategory)
    : null;
}

async function getLinkedAccount(telegramUserId: string) {
  return prisma.telegramAccount.findUnique({
    where: { telegramUserId },
    include: { user: true },
  });
}

async function setSession(
  telegramUserId: string,
  chatId: string,
  state: SessionState,
  data: TelegramSessionData = {}
) {
  await prisma.telegramBotSession.upsert({
    where: { telegramUserId },
    update: { chatId, state, data },
    create: { telegramUserId, chatId, state, data },
  });
}

async function clearSession(telegramUserId: string, chatId: string) {
  await setSession(telegramUserId, chatId, "IDLE", {});
}

async function getSession(telegramUserId: string) {
  return prisma.telegramBotSession.findUnique({ where: { telegramUserId } });
}

async function sendUnlinkedMessage(chatId: string) {
  await sendMessage(
    chatId,
    [
      "<b>Student Life OS Bot</b>",
      "",
      "Akun Telegram ini belum terhubung.",
      "Buka web Student Life OS, masuk ke Settings > Telegram Bot, lalu buat kode link.",
      "",
      "Setelah dapat kode, kirim:",
      "<code>/link KODE</code>",
    ].join("\n")
  );
}

async function linkAccount(chatId: string, telegramUser: TelegramUser, code: string) {
  const normalizedCode = code.trim().toUpperCase();
  const linkCode = await prisma.telegramLinkCode.findFirst({
    where: {
      code: normalizedCode,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!linkCode) {
    await sendMessage(
      chatId,
      "Kode link tidak valid atau sudah kedaluwarsa. Buat kode baru dari Settings web Student Life OS."
    );
    return;
  }

  const telegramUserId = String(telegramUser.id);

  await prisma.$transaction(async (tx) => {
    await tx.telegramAccount.deleteMany({
      where: {
        OR: [
          { userId: linkCode.userId },
          { telegramUserId },
          { chatId },
        ],
      },
    });

    await tx.telegramAccount.create({
      data: {
        userId: linkCode.userId,
        telegramUserId,
        chatId,
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        languageCode: telegramUser.language_code,
      },
    });

    await tx.telegramLinkCode.update({
      where: { id: linkCode.id },
      data: { usedAt: new Date() },
    });
  });

  await clearSession(telegramUserId, chatId);
  await sendMessage(
    chatId,
    `Berhasil terhubung ke akun Student Life OS milik <b>${escapeHtml(linkCode.user.name || "Mahasiswa")}</b>.`,
    mainMenuKeyboard()
  );
}

async function sendMainMenu(chatId: string, name?: string | null) {
  await sendMessage(
    chatId,
    [
      `<b>Student Life OS</b>${name ? ` untuk ${escapeHtml(name)}` : ""}`,
      "",
      "Pilih menu cepat di bawah ini, atau ketik:",
      "1. Hari Ini",
      "2. Tugas",
      "3. Keuangan",
      "4. Habit",
      "5. Belajar",
      "6. IPK",
    ].join("\n"),
    mainMenuKeyboard()
  );
}

async function sendTodaySummary(chatId: string, userId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [events, tasks, sessions, habits] = await Promise.all([
    prisma.event.findMany({
      where: {
        userId,
        OR: [
          { startDate: { gte: todayStart, lte: todayEnd } },
          { endDate: { gte: todayStart, lte: todayEnd } },
          { AND: [{ startDate: { lte: todayStart } }, { endDate: { gte: todayEnd } }] },
        ],
      },
      orderBy: { startDate: "asc" },
      take: 5,
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: { not: "DONE" },
        deadline: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { deadline: "asc" },
      take: 5,
    }),
    prisma.studySession.findMany({
      where: { userId, date: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.habit.findMany({
      where: { userId },
      include: { logs: { where: { date: todayStart } } },
      take: 20,
    }),
  ]);

  const studyMinutes = sessions.reduce((total, session) => total + session.duration, 0);
  const completedHabits = habits.filter((habit) => habit.logs.length > 0).length;

  const lines = [
    "<b>Ringkasan Hari Ini</b>",
    "",
    `<b>Jadwal:</b> ${events.length ? "" : "Tidak ada agenda hari ini."}`,
    ...events.map((event) => `- ${format(event.startDate, "HH:mm")} ${escapeHtml(event.title)}`),
    "",
    `<b>Deadline tugas:</b> ${tasks.length ? "" : "Tidak ada deadline hari ini."}`,
    ...tasks.map((task) => `- ${escapeHtml(task.title)}${task.deadline ? ` (${format(task.deadline, "HH:mm")})` : ""}`),
    "",
    `<b>Belajar:</b> ${Math.round(studyMinutes / 60 * 10) / 10} jam`,
    `<b>Habit:</b> ${completedHabits}/${habits.length} selesai`,
  ];

  await sendMessage(chatId, lines.join("\n"), mainMenuKeyboard());
}

async function sendTasks(chatId: string, userId: string) {
  const oneMonthLater = addDays(new Date(), 30);
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: { not: "DONE" },
      OR: [{ deadline: null }, { deadline: { lte: oneMonthLater } }],
    },
    orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
    take: 8,
  });

  const lines = [
    "<b>Tugas Aktif</b>",
    "",
    ...(tasks.length
      ? tasks.map((task, index) => {
          const deadline = task.deadline
            ? ` - ${format(task.deadline, "dd MMM yyyy HH:mm", { locale: localeId })}`
            : "";
          return `${index + 1}. ${escapeHtml(task.title)} [${task.priority}]${deadline}`;
        })
      : ["Belum ada tugas aktif."]),
  ];

  await sendMessage(chatId, lines.join("\n"), {
    inline_keyboard: [
      [{ text: "+ Tugas Baru", callback_data: "tasks:add" }],
      [{ text: "Menu Utama", callback_data: "menu:main" }],
    ],
  });
}

async function sendFinance(chatId: string, userId: string) {
  const now = new Date();
  const [user, monthTransactions, allTransactions] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { initialBalance: true } }),
    prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startOfMonth(now), lte: endOfMonth(now) },
      },
      take: 500,
    }),
    prisma.transaction.findMany({
      where: { userId },
      select: { amount: true, type: true },
      take: 500,
    }),
  ]);

  const totalIncome = monthTransactions
    .filter((transaction) => transaction.type === "INCOME")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const totalExpense = monthTransactions
    .filter((transaction) => transaction.type === "EXPENSE")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const allIncome = allTransactions
    .filter((transaction) => transaction.type === "INCOME")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const allExpense = allTransactions
    .filter((transaction) => transaction.type === "EXPENSE")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const balance = (user?.initialBalance ?? 0) + allIncome - allExpense;

  await sendMessage(
    chatId,
    [
      "<b>Keuangan Bulan Ini</b>",
      "",
      `Saldo saat ini: <b>${formatRupiah(balance)}</b>`,
      `Pemasukan: ${formatRupiah(totalIncome)}`,
      `Pengeluaran: ${formatRupiah(totalExpense)}`,
      "",
      "Pilih aksi:",
    ].join("\n"),
    financeKeyboard()
  );
}

async function sendFinanceHistory(chatId: string, userId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 8,
  });

  const lines = [
    "<b>Riwayat Transaksi Terakhir</b>",
    "",
    ...(transactions.length
      ? transactions.map((transaction) => {
          const sign = transaction.type === "INCOME" ? "+" : "-";
          return `${sign}${formatRupiah(transaction.amount)} - ${escapeHtml(transaction.description)} (${format(
            transaction.date,
            "dd MMM yyyy",
            { locale: localeId }
          )})`;
        })
      : ["Belum ada transaksi."]),
  ];

  await sendMessage(chatId, lines.join("\n"), financeKeyboard());
}

async function sendHabits(chatId: string, userId: string) {
  const today = startOfDay(new Date());
  const habits = await prisma.habit.findMany({
    where: { userId },
    include: { logs: { where: { date: today } } },
    orderBy: { createdAt: "asc" },
    take: 30,
  });

  const lines = [
    "<b>Habit Hari Ini</b>",
    "",
    ...(habits.length
      ? habits.map((habit, index) => {
          const done = habit.logs.length > 0 ? "Selesai" : "Belum";
          return `${index + 1}. ${escapeHtml(habit.name)} - ${done}`;
        })
      : ["Belum ada habit. Tambahkan dari web Student Life OS dulu."]),
  ];

  await sendMessage(chatId, lines.join("\n"), {
    inline_keyboard: [
      ...habits.map((habit) => [
        {
          text: `${habit.logs.length > 0 ? "Batalkan" : "Selesai"}: ${habit.name}`.slice(0, 60),
          callback_data: `habit:toggle:${habit.id}`,
        },
      ]),
      [{ text: "Menu Utama", callback_data: "menu:main" }],
    ],
  });
}

async function sendStudy(chatId: string, userId: string) {
  const now = new Date();
  const sessions = await prisma.studySession.findMany({
    where: {
      userId,
      date: { gte: startOfMonth(now), lte: endOfMonth(now) },
    },
    orderBy: { date: "desc" },
    take: 100,
  });

  const totalMinutes = sessions.reduce((total, session) => total + session.duration, 0);
  const recent = sessions.slice(0, 5).map((session) => (
    `- ${escapeHtml(session.subject)}: ${session.duration} menit (${format(session.date, "dd MMM", { locale: localeId })})`
  ));

  await sendMessage(
    chatId,
    [
      "<b>Belajar Bulan Ini</b>",
      "",
      `Total: <b>${Math.round(totalMinutes / 60 * 10) / 10} jam</b>`,
      `Sesi: ${sessions.length}`,
      "",
      recent.length ? "<b>Sesi terakhir:</b>" : "Belum ada sesi belajar bulan ini.",
      ...recent,
    ].join("\n"),
    {
      inline_keyboard: [
        [{ text: "+ Catat Sesi Belajar", callback_data: "study:add" }],
        [{ text: "Menu Utama", callback_data: "menu:main" }],
      ],
    }
  );
}

async function sendGpa(chatId: string, userId: string) {
  const courses = await prisma.course.findMany({
    where: { userId, gradePoint: { not: null } },
    orderBy: { semester: "asc" },
    take: 500,
  });

  const totalCredits = courses.reduce((total, course) => total + course.credits, 0);
  const totalPoints = courses.reduce((total, course) => total + course.credits * (course.gradePoint ?? 0), 0);
  const cumulativeGpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
  const semesterMap = new Map<number, { credits: number; points: number }>();

  courses.forEach((course) => {
    const current = semesterMap.get(course.semester) ?? { credits: 0, points: 0 };
    current.credits += course.credits;
    current.points += course.credits * (course.gradePoint ?? 0);
    semesterMap.set(course.semester, current);
  });

  const semesterLines = Array.from(semesterMap.entries()).map(([semester, data]) => {
    const gpa = data.credits > 0 ? data.points / data.credits : 0;
    return `- Semester ${semester}: ${gpa.toFixed(2)} (${data.credits} SKS)`;
  });

  await sendMessage(
    chatId,
    [
      "<b>Ringkasan IPK</b>",
      "",
      `IPK kumulatif: <b>${cumulativeGpa.toFixed(2)}</b>`,
      `Total SKS: ${totalCredits}`,
      `Mata kuliah bernilai: ${courses.length}`,
      "",
      ...(semesterLines.length ? semesterLines : ["Belum ada nilai mata kuliah."]),
      "",
      `Skala nilai aktif: ${Object.keys(GRADE_MAP).join(", ")}`,
    ].join("\n"),
    mainMenuKeyboard()
  );
}

async function handleTransactionSession(
  chatId: string,
  telegramUserId: string,
  state: SessionState,
  data: TelegramSessionData,
  text: string
) {
  if (state === "ADD_EXPENSE_AMOUNT" || state === "ADD_INCOME_AMOUNT") {
    const amount = parseAmount(text);
    if (!amount) {
      await sendMessage(chatId, "Nominal tidak valid. Contoh: 15000 atau Rp 15.000.", cancelKeyboard());
      return;
    }

    const nextState = state === "ADD_EXPENSE_AMOUNT" ? "ADD_EXPENSE_DESCRIPTION" : "ADD_INCOME_DESCRIPTION";
    await setSession(telegramUserId, chatId, nextState, {
      ...data,
      amount,
      transactionType: state === "ADD_EXPENSE_AMOUNT" ? "EXPENSE" : "INCOME",
    });
    await sendMessage(chatId, "Deskripsinya apa? Contoh: Sarapan, Uang saku, Bayar kos.", cancelKeyboard());
    return;
  }

  if (state === "ADD_EXPENSE_DESCRIPTION" || state === "ADD_INCOME_DESCRIPTION") {
    const description = text.trim().slice(0, 200);
    if (!description) {
      await sendMessage(chatId, "Deskripsi tidak boleh kosong.", cancelKeyboard());
      return;
    }

    const type = state === "ADD_EXPENSE_DESCRIPTION" ? "EXPENSE" : "INCOME";
    await setSession(telegramUserId, chatId, type === "EXPENSE" ? "ADD_EXPENSE_CATEGORY" : "ADD_INCOME_CATEGORY", {
      ...data,
      description,
      transactionType: type,
    });
    await sendMessage(chatId, "Pilih kategori:", categoryKeyboard(type));
  }
}

async function handleStudySession(chatId: string, telegramUserId: string, userId: string, state: SessionState, text: string) {
  if (state === "ADD_STUDY_SUBJECT") {
    const subject = text.trim().slice(0, 200);
    if (!subject) {
      await sendMessage(chatId, "Nama mata kuliah/subjek tidak boleh kosong.", cancelKeyboard());
      return;
    }

    await setSession(telegramUserId, chatId, "ADD_STUDY_DURATION", { subject });
    await sendMessage(chatId, "Berapa menit durasinya? Contoh: 25", cancelKeyboard());
    return;
  }

  if (state === "ADD_STUDY_DURATION") {
    const duration = Number(text.replace(/[^\d]/g, ""));
    const session = await getSession(telegramUserId);
    const data = (session?.data ?? {}) as TelegramSessionData;

    if (!Number.isInteger(duration) || duration < 1 || duration > 480 || !data.subject) {
      await sendMessage(chatId, "Durasi tidak valid. Isi 1 sampai 480 menit.", cancelKeyboard());
      return;
    }

    await prisma.studySession.create({
      data: {
        userId,
        subject: data.subject,
        duration,
        date: new Date(),
      },
    });
    await clearSession(telegramUserId, chatId);
    await sendMessage(chatId, `Sesi belajar tersimpan: ${escapeHtml(data.subject)} selama ${duration} menit.`, mainMenuKeyboard());
  }
}

async function handleTaskSession(chatId: string, telegramUserId: string, userId: string, text: string) {
  const title = text.trim().slice(0, 200);
  if (!title) {
    await sendMessage(chatId, "Judul tugas tidak boleh kosong.", cancelKeyboard());
    return;
  }

  await prisma.task.create({
    data: {
      userId,
      title,
      priority: "MEDIUM",
      status: "TODO",
    },
  });
  await clearSession(telegramUserId, chatId);
  await sendMessage(chatId, `Tugas baru tersimpan: <b>${escapeHtml(title)}</b>.`, mainMenuKeyboard());
}

async function handleSessionText(chatId: string, telegramUserId: string, userId: string, text: string) {
  const session = await getSession(telegramUserId);
  const state = (session?.state ?? "IDLE") as SessionState;
  const data = (session?.data ?? {}) as TelegramSessionData;

  if (state === "IDLE") return false;

  if (text.toLowerCase() === "batal" || text === "0") {
    await clearSession(telegramUserId, chatId);
    await sendMessage(chatId, "Aksi dibatalkan.", mainMenuKeyboard());
    return true;
  }

  if (
    state === "ADD_EXPENSE_AMOUNT" ||
    state === "ADD_EXPENSE_DESCRIPTION" ||
    state === "ADD_INCOME_AMOUNT" ||
    state === "ADD_INCOME_DESCRIPTION"
  ) {
    await handleTransactionSession(chatId, telegramUserId, state, data, text);
    return true;
  }

  if (state === "ADD_STUDY_SUBJECT" || state === "ADD_STUDY_DURATION") {
    await handleStudySession(chatId, telegramUserId, userId, state, text);
    return true;
  }

  if (state === "ADD_TASK_TITLE") {
    await handleTaskSession(chatId, telegramUserId, userId, text);
    return true;
  }

  return false;
}

async function handleLinkedText(chatId: string, telegramUser: TelegramUser, text: string) {
  const telegramUserId = String(telegramUser.id);
  const account = await getLinkedAccount(telegramUserId);

  if (!account) {
    await sendUnlinkedMessage(chatId);
    return;
  }

  const handledSession = await handleSessionText(chatId, telegramUserId, account.userId, text);
  if (handledSession) return;

  const normalized = text.trim().toLowerCase();
  if (["/start", "/menu", "menu", "0"].includes(normalized)) {
    await sendMainMenu(chatId, account.user.name);
    return;
  }

  if (normalized === "1" || normalized.includes("hari")) {
    await sendTodaySummary(chatId, account.userId);
    return;
  }
  if (normalized === "2" || normalized.includes("tugas")) {
    await sendTasks(chatId, account.userId);
    return;
  }
  if (normalized === "3" || normalized.includes("uang") || normalized.includes("keuangan")) {
    await sendFinance(chatId, account.userId);
    return;
  }
  if (normalized === "4" || normalized.includes("habit") || normalized.includes("kebiasaan")) {
    await sendHabits(chatId, account.userId);
    return;
  }
  if (normalized === "5" || normalized.includes("belajar")) {
    await sendStudy(chatId, account.userId);
    return;
  }
  if (normalized === "6" || normalized.includes("ipk") || normalized.includes("gpa")) {
    await sendGpa(chatId, account.userId);
    return;
  }

  const quickExpense = normalized.match(/^(?:tambah\s+)?(?:pengeluaran|expense)\s+([\d.,]+)\s+(.+)$/i);
  if (quickExpense) {
    const amount = parseAmount(quickExpense[1]);
    const description = quickExpense[2]?.trim().slice(0, 200);
    if (amount && description) {
      await prisma.transaction.create({
        data: {
          userId: account.userId,
          amount,
          description,
          type: "EXPENSE",
          category: "OTHER",
          date: new Date(),
        },
      });
      await sendMessage(chatId, `Pengeluaran tersimpan: ${formatRupiah(amount)} - ${escapeHtml(description)}.`, mainMenuKeyboard());
      return;
    }
  }

  await sendMessage(
    chatId,
    "Saya belum paham perintah itu. Pilih menu di bawah atau ketik /menu.",
    mainMenuKeyboard()
  );
}

async function handleCallback(callback: TelegramCallbackQuery) {
  const chatId = callback.message?.chat.id ? String(callback.message.chat.id) : "";
  const data = callback.data ?? "";
  const telegramUserId = String(callback.from.id);

  await answerCallbackQuery(callback.id);

  if (!chatId) return;

  const account = await getLinkedAccount(telegramUserId);
  if (!account) {
    await sendUnlinkedMessage(chatId);
    return;
  }

  if (data === "flow:cancel") {
    await clearSession(telegramUserId, chatId);
    await sendMessage(chatId, "Aksi dibatalkan.", mainMenuKeyboard());
    return;
  }

  if (data === "menu:main") {
    await clearSession(telegramUserId, chatId);
    await sendMainMenu(chatId, account.user.name);
    return;
  }
  if (data === "menu:today") {
    await sendTodaySummary(chatId, account.userId);
    return;
  }
  if (data === "menu:tasks") {
    await sendTasks(chatId, account.userId);
    return;
  }
  if (data === "menu:finance") {
    await sendFinance(chatId, account.userId);
    return;
  }
  if (data === "menu:habits") {
    await sendHabits(chatId, account.userId);
    return;
  }
  if (data === "menu:study") {
    await sendStudy(chatId, account.userId);
    return;
  }
  if (data === "menu:gpa") {
    await sendGpa(chatId, account.userId);
    return;
  }

  if (data === "tasks:add") {
    await setSession(telegramUserId, chatId, "ADD_TASK_TITLE");
    await sendMessage(chatId, "Tulis judul tugas baru:", cancelKeyboard());
    return;
  }

  if (data === "finance:add_expense") {
    await setSession(telegramUserId, chatId, "ADD_EXPENSE_AMOUNT", { transactionType: "EXPENSE" });
    await sendMessage(chatId, "Nominal pengeluaran berapa?", cancelKeyboard());
    return;
  }

  if (data === "finance:add_income") {
    await setSession(telegramUserId, chatId, "ADD_INCOME_AMOUNT", { transactionType: "INCOME" });
    await sendMessage(chatId, "Nominal pemasukan berapa?", cancelKeyboard());
    return;
  }

  if (data === "finance:history") {
    await sendFinanceHistory(chatId, account.userId);
    return;
  }

  if (data.startsWith("finance:category:")) {
    const category = parseTransactionCategory(data.replace("finance:category:", ""));
    const session = await getSession(telegramUserId);
    const sessionData = (session?.data ?? {}) as TelegramSessionData;

    if (!category) {
      await sendMessage(chatId, "Kategori tidak valid. Silakan ulangi tambah transaksi.", financeKeyboard());
      return;
    }

    if (!sessionData.amount || !sessionData.description || !sessionData.transactionType) {
      await clearSession(telegramUserId, chatId);
      await sendMessage(chatId, "Sesi tambah transaksi sudah kedaluwarsa. Silakan ulangi.", financeKeyboard());
      return;
    }

    await prisma.transaction.create({
      data: {
        userId: account.userId,
        amount: sessionData.amount,
        description: sessionData.description,
        type: sessionData.transactionType,
        category,
        date: new Date(),
      },
    });

    await clearSession(telegramUserId, chatId);
    await sendMessage(
      chatId,
      [
        "Transaksi tersimpan.",
        "",
        `${sessionData.transactionType === "INCOME" ? "Pemasukan" : "Pengeluaran"}: <b>${formatRupiah(sessionData.amount)}</b>`,
        `Deskripsi: ${escapeHtml(sessionData.description)}`,
        `Kategori: ${escapeHtml(category)}`,
      ].join("\n"),
      financeKeyboard()
    );
    return;
  }

  if (data.startsWith("habit:toggle:")) {
    const habitId = data.replace("habit:toggle:", "");
    const today = startOfDay(new Date());
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId: account.userId },
    });

    if (!habit) {
      await sendMessage(chatId, "Habit tidak ditemukan.", mainMenuKeyboard());
      return;
    }

    const existingLog = await prisma.habitLog.findUnique({
      where: {
        habitId_date: {
          habitId,
          date: today,
        },
      },
    });

    if (existingLog) {
      await prisma.habitLog.delete({ where: { id: existingLog.id } });
    } else {
      await prisma.habitLog.create({
        data: {
          habitId,
          userId: account.userId,
          date: today,
          completed: true,
        },
      });
    }

    await sendHabits(chatId, account.userId);
    return;
  }

  if (data === "study:add") {
    await setSession(telegramUserId, chatId, "ADD_STUDY_SUBJECT");
    await sendMessage(chatId, "Subjek/mata kuliah yang dipelajari?", cancelKeyboard());
  }
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  if (update.callback_query) {
    await handleCallback(update.callback_query);
    return;
  }

  const message = update.message;
  if (!message?.from || !message.text) {
    return;
  }

  const chatId = String(message.chat.id);
  const text = message.text.trim();

  if (text.toLowerCase().startsWith("/link")) {
    const code = text.split(/\s+/)[1];
    if (!code) {
      await sendMessage(chatId, "Format: /link KODE");
      return;
    }
    await linkAccount(chatId, message.from, code);
    return;
  }

  if (text === "/start") {
    const account = await getLinkedAccount(String(message.from.id));
    if (!account) {
      await sendUnlinkedMessage(chatId);
      return;
    }
  }

  await handleLinkedText(chatId, message.from, text);
}
