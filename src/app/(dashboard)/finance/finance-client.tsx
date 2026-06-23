"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Wallet, User, HandCoins, CheckCircle2 } from "lucide-react";
import { createTransaction, deleteTransaction, updateInitialBalance } from "@/actions/finance.actions";
import { createDebt, payDebt, deleteDebt } from "@/actions/debt.actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";

interface TransactionItem {
  id: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: Date;
}

interface FinanceStatsData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: { category: string; amount: number }[];
}

interface DebtItem {
  id: string;
  contactName: string;
  amount: number;
  notes: string | null;
  createdAt: Date;
}

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: "Makanan", TRANSPORTATION: "Transportasi", EDUCATION: "Pendidikan",
  ENTERTAINMENT: "Hiburan", HEALTH: "Kesehatan", SCHOLARSHIP: "Beasiswa",
  SALARY: "Gaji", ALLOWANCE: "Uang Saku", FREELANCE: "Freelance", OTHER: "Lainnya",
};

const CATEGORY_ICONS: Record<string, string> = {
  FOOD: "🍔", TRANSPORTATION: "🚗", EDUCATION: "📚", ENTERTAINMENT: "🎮",
  HEALTH: "💊", SCHOLARSHIP: "🎓", SALARY: "💰", ALLOWANCE: "💵",
  FREELANCE: "💻", OTHER: "📦",
};

export default function FinancePageClient({
  initialTransactions,
  initialStats,
  initialBalance,
  initialDebts,
}: {
  initialTransactions: TransactionItem[];
  initialStats: FinanceStatsData;
  initialBalance: number;
  initialDebts: DebtItem[];
}) {
  const [transactions, setTransactions] = useState<TransactionItem[]>(initialTransactions);
  const [stats, setStats] = useState<FinanceStatsData>(initialStats);
  const [balance, setBalance] = useState<number>(initialBalance);
  const [debts, setDebts] = useState<DebtItem[]>(initialDebts);
  const [isPending, startTransition] = useTransition();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [newBalanceInput, setNewBalanceInput] = useState(initialBalance.toString());

  // Debt dialog states
  const [addDebtDialogOpen, setAddDebtDialogOpen] = useState(false);
  const [debtContactName, setDebtContactName] = useState("");
  const [debtAmount, setDebtAmount] = useState("");
  const [debtNotes, setDebtNotes] = useState("");
  const [debtRecordTx, setDebtRecordTx] = useState(true);

  const [payDebtDialogOpen, setPayDebtDialogOpen] = useState(false);
  const [selectedDebtForPay, setSelectedDebtForPay] = useState<DebtItem | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payRecordTx, setPayRecordTx] = useState(true);

  // Transaction form states
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [category, setCategory] = useState("OTHER");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setType("EXPENSE");
    setCategory("OTHER");
    setDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleUpdateBalance = () => {
    const amt = Number(newBalanceInput || 0);
    startTransition(async () => {
      try {
        const result = await updateInitialBalance(amt);
        if (result.success) {
          setBalance(amt);
          toast.success("Saldo awal berhasil diperbarui");
          setBalanceDialogOpen(false);
        }
      } catch {
        toast.error("Gagal memperbarui saldo awal");
      }
    });
  };

  const handleSubmit = () => {
    if (!description.trim() || !amount) {
      toast.error("Deskripsi dan jumlah wajib diisi");
      return;
    }
    startTransition(async () => {
      try {
        const result = await createTransaction({
          description: description.trim(),
          amount: Number(amount),
          type,
          category,
          date,
        });
        if (result.success && result.data) {
          setTransactions((prev) => [result.data as TransactionItem, ...prev]);
          const amt = Number(amount);
          setStats((prev) => ({
            ...prev,
            totalIncome: type === "INCOME" ? prev.totalIncome + amt : prev.totalIncome,
            totalExpense: type === "EXPENSE" ? prev.totalExpense + amt : prev.totalExpense,
            balance: type === "INCOME" ? prev.balance + amt : prev.balance - amt,
          }));
          toast.success("Transaksi berhasil ditambahkan");
          setDialogOpen(false);
          resetForm();
        }
      } catch {
        toast.error("Gagal menambahkan transaksi");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        const result = await deleteTransaction(id);
        if (result.success) {
          const deleted = transactions.find((t) => t.id === id);
          setTransactions((prev) => prev.filter((t) => t.id !== id));
          if (deleted) {
            setStats((prev) => ({
              ...prev,
              totalIncome: deleted.type === "INCOME" ? prev.totalIncome - deleted.amount : prev.totalIncome,
              totalExpense: deleted.type === "EXPENSE" ? prev.totalExpense - deleted.amount : prev.totalExpense,
              balance: deleted.type === "INCOME" ? prev.balance - deleted.amount : prev.balance + deleted.amount,
            }));
          }
          toast.success("Transaksi berhasil dihapus");
        }
      } catch {
        toast.error("Gagal menghapus transaksi");
      }
    });
  };

  // Debt Action Handlers
  const handleCreateDebt = () => {
    if (!debtContactName.trim() || !debtAmount) {
      toast.error("Nama teman dan jumlah utang wajib diisi");
      return;
    }
    const amt = Number(debtAmount);
    startTransition(async () => {
      try {
        const result = await createDebt({
          contactName: debtContactName.trim(),
          amount: amt,
          notes: debtNotes.trim() || null,
        }, debtRecordTx);

        if (result.success && result.data) {
          setDebts((prev) => [result.data as DebtItem, ...prev]);
          toast.success("Catatan piutang berhasil ditambahkan");
          setAddDebtDialogOpen(false);
          setDebtContactName("");
          setDebtAmount("");
          setDebtNotes("");

          if (debtRecordTx) {
            const mockTx: TransactionItem = {
              id: `mock-debt-${Date.now()}`,
              description: `Pinjaman kepada ${debtContactName.trim()}`,
              amount: amt,
              type: "EXPENSE",
              category: "OTHER",
              date: new Date(),
            };
            setTransactions((prev) => [mockTx, ...prev]);
            setStats((prev) => ({
              ...prev,
              totalExpense: prev.totalExpense + amt,
              balance: prev.balance - amt,
            }));
          }
        }
      } catch {
        toast.error("Gagal menambahkan catatan piutang");
      }
    });
  };

  const handlePayDebt = () => {
    if (!selectedDebtForPay || !payAmount) {
      toast.error("Jumlah cicilan wajib diisi");
      return;
    }
    const amt = Number(payAmount);
    startTransition(async () => {
      try {
        const result = await payDebt(selectedDebtForPay.id, amt, payRecordTx);
        if (result.success) {
          setDebts((prev) =>
            prev.map((d) => (d.id === selectedDebtForPay.id ? { ...d, amount: Math.max(0, d.amount - amt) } : d))
          );
          toast.success("Pembayaran piutang berhasil dicatat");
          setPayDebtDialogOpen(false);
          setPayAmount("");

          if (payRecordTx) {
            const mockTx: TransactionItem = {
              id: `mock-pay-${Date.now()}`,
              description: `Pembayaran utang oleh ${selectedDebtForPay.contactName}`,
              amount: amt,
              type: "INCOME",
              category: "OTHER",
              date: new Date(),
            };
            setTransactions((prev) => [mockTx, ...prev]);
            setStats((prev) => ({
              ...prev,
              totalIncome: prev.totalIncome + amt,
              balance: prev.balance + amt,
            }));
          }
        }
      } catch {
        toast.error("Gagal mencatat pembayaran piutang");
      }
    });
  };

  const handleDeleteDebt = (id: string) => {
    startTransition(async () => {
      try {
        const result = await deleteDebt(id);
        if (result.success) {
          setDebts((prev) => prev.filter((d) => d.id !== id));
          toast.success("Catatan piutang berhasil dihapus");
        }
      } catch {
        toast.error("Gagal menghapus catatan piutang");
      }
    });
  };

  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const totalExpense = stats.categoryBreakdown.reduce((acc, c) => acc + c.amount, 0);
  const currentSavings = balance + stats.totalIncome - stats.totalExpense;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Keuangan</h1>
          <p className="text-muted-foreground mt-1">Lacak pemasukan, pengeluaran, dan tabunganmu.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
            <DialogTrigger render={<Button variant="outline" className="border-border hover:bg-accent">
              Atur Saldo Awal (Rp {formatRupiah(balance).replace("Rp", "").trim()})
            </Button>} />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Atur Saldo Awal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Saldo/Tabungan Awal (Rp) *</Label>
                  <Input
                    type="number"
                    value={newBalanceInput}
                    onChange={(e) => setNewBalanceInput(e.target.value)}
                    placeholder="Contoh: 15000000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Saldo awal ini adalah dana/tabungan awal Anda sebelum ditambah pemasukan dan dikurangi pengeluaran dari transaksi.
                  </p>
                </div>
                <Button onClick={handleUpdateBalance} disabled={isPending} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  {isPending ? "Menyimpan..." : "Simpan Saldo Awal"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger render={<Button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25" />}>
              <Plus className="mr-2 h-4 w-4" />
              Transaksi Baru
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Transaksi</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Tabs value={type} onValueChange={(v) => { setType(v as "INCOME" | "EXPENSE"); setCategory("OTHER"); }}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="EXPENSE">💸 Pengeluaran</TabsTrigger>
                    <TabsTrigger value="INCOME">💰 Pemasukan</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="space-y-2">
                  <Label>Deskripsi *</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Contoh: Makan siang" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jumlah (Rp) *</Label>
                    <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Select value={category} onValueChange={(val) => setCategory(val || "OTHER")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tanggal</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <Button onClick={handleSubmit} disabled={isPending} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  {isPending ? "Menyimpan..." : "Tambah Transaksi"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Pemasukan</p>
                <p className="text-xl font-bold text-emerald-500 mt-1">{formatRupiah(stats.totalIncome)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <ArrowUpRight className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Pengeluaran</p>
                <p className="text-xl font-bold text-red-500 mt-1">{formatRupiah(stats.totalExpense)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <ArrowDownRight className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Tabungan Saat Ini</p>
                <p className={`text-xl font-bold mt-1 ${currentSavings >= 0 ? "text-indigo-400" : "text-red-500"}`}>
                  {formatRupiah(currentSavings)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
                <Wallet className="h-5 w-5 text-indigo-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Category Breakdown & Debts list */}
        <div className="space-y-6">
          {/* Category Breakdown */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-sm">Distribusi Pengeluaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.categoryBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada data pengeluaran.</p>
              ) : (
                stats.categoryBreakdown.map((item) => {
                  const percentage = totalExpense > 0 ? (item.amount / totalExpense) * 100 : 0;
                  return (
                    <div key={item.category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{CATEGORY_ICONS[item.category]} {CATEGORY_LABELS[item.category] || item.category}</span>
                        <span className="font-medium">{formatRupiah(item.amount)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-accent">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Debts/Piutang Owed to Me */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm">Daftar Piutang (Teman Berutang)</CardTitle>
              <Dialog open={addDebtDialogOpen} onOpenChange={(open) => { setAddDebtDialogOpen(open); if (!open) { setDebtContactName(""); setDebtAmount(""); setDebtNotes(""); } }}>
                <DialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-400 hover:bg-accent">
                  <Plus className="h-4 w-4" />
                </Button>} />
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Catat Piutang Baru</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Nama Teman *</Label>
                      <Input value={debtContactName} onChange={(e) => setDebtContactName(e.target.value)} placeholder="Contoh: Budi" />
                    </div>
                    <div className="space-y-2">
                      <Label>Jumlah Piutang (Rp) *</Label>
                      <Input type="number" value={debtAmount} onChange={(e) => setDebtAmount(e.target.value)} placeholder="100000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Catatan (Opsional)</Label>
                      <Input value={debtNotes} onChange={(e) => setDebtNotes(e.target.value)} placeholder="Contoh: Pinjam buat makan siang" />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="debtRecordTx"
                        checked={debtRecordTx}
                        onChange={(e) => setDebtRecordTx(e.target.checked)}
                        className="rounded border-border text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <Label htmlFor="debtRecordTx" className="text-xs font-normal cursor-pointer select-none">
                        Otomatis catat sebagai Pengeluaran
                      </Label>
                    </div>
                    <Button onClick={handleCreateDebt} disabled={isPending} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                      {isPending ? "Menyimpan..." : "Simpan Catatan"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[350px] overflow-y-auto">
              {debts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Belum ada catatan piutang.</p>
              ) : (
                debts.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg bg-accent/30 p-3 hover:bg-accent/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-indigo-400" />
                        <span className="text-xs font-semibold">{item.contactName}</span>
                      </div>
                      {item.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{item.notes}</p>}
                      <p className="text-[9px] text-muted-foreground mt-1">
                        Dibuat: {format(new Date(item.createdAt), "dd MMM yyyy", { locale: localeId })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className={`text-xs font-bold ${item.amount > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                          {item.amount > 0 ? formatRupiah(item.amount) : "Lunas 🎉"}
                        </p>
                      </div>
                      {item.amount > 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[10px] border-border hover:bg-accent"
                          onClick={() => {
                            setSelectedDebtForPay(item);
                            setPayAmount("");
                            setPayDebtDialogOpen(true);
                          }}
                        >
                          Bayar
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteDebt(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Transaction List */}
        <Card className="border-border/50 bg-card/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Riwayat Transaksi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {transactions.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Belum ada transaksi.</p>
            ) : (
              transactions.slice(0, 20).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-lg bg-accent/30 p-3 group hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{CATEGORY_ICONS[tx.category] || "📦"}</span>
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.date), "dd MMM yyyy", { locale: localeId })} • {CATEGORY_LABELS[tx.category] || tx.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${tx.type === "INCOME" ? "text-emerald-500" : "text-red-500"}`}>
                      {tx.type === "INCOME" ? "+" : "-"}{formatRupiah(tx.amount)}
                    </span>
                    {tx.id.startsWith("mock-") ? null : (
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete(tx.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pay Debt Dialog */}
      <Dialog open={payDebtDialogOpen} onOpenChange={setPayDebtDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Catat Pembayaran Piutang</DialogTitle>
          </DialogHeader>
          {selectedDebtForPay && (
            <div className="space-y-4 pt-4">
              <div>
                <p className="text-xs text-muted-foreground">Nama Teman</p>
                <p className="text-sm font-semibold">{selectedDebtForPay.contactName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sisa Piutang</p>
                <p className="text-sm font-bold text-amber-500">{formatRupiah(selectedDebtForPay.amount)}</p>
              </div>
              <div className="space-y-2">
                <Label>Jumlah yang Dibayarkan (Rp) *</Label>
                <Input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="Contoh: 50000"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="payRecordTx"
                  checked={payRecordTx}
                  onChange={(e) => setPayRecordTx(e.target.checked)}
                  className="rounded border-border text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <Label htmlFor="payRecordTx" className="text-xs font-normal cursor-pointer select-none">
                  Otomatis catat sebagai Pemasukan
                </Label>
              </div>
              <Button onClick={handlePayDebt} disabled={isPending} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                {isPending ? "Mencatat..." : "Simpan Pembayaran"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
