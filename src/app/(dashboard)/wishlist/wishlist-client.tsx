"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Heart, Plus, Trash2, Calendar, Target, AlertCircle } from "lucide-react";
import { createWishlistItem, deleteWishlistItem } from "@/actions/wishlist.actions";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface WishlistItem {
  id: string;
  name: string;
  targetPrice: number;
  targetDate: Date | string | null;
  createdAt: Date | string;
}

interface SavingsData {
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  currentSavings: number;
}

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

export default function WishlistPageClient({
  initialWishlist,
  initialSavingsData,
}: {
  initialWishlist: WishlistItem[];
  initialSavingsData: SavingsData;
}) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>(initialWishlist);
  const [isPending, startTransition] = useTransition();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const handleAddSubmit = () => {
    if (!name.trim() || !targetPrice) {
      toast.error("Nama barang dan target harga wajib diisi");
      return;
    }
    startTransition(async () => {
      try {
        const result = await createWishlistItem({
          name: name.trim(),
          targetPrice: Number(targetPrice),
          targetDate: targetDate || null,
        });
        if (result.success && result.data) {
          setWishlist((prev) => [result.data as WishlistItem, ...prev]);
          toast.success("Item wishlist berhasil ditambahkan");
          setDialogOpen(false);
          setName("");
          setTargetPrice("");
          setTargetDate("");
        }
      } catch {
        toast.error("Gagal menambahkan item wishlist");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        const result = await deleteWishlistItem(id);
        if (result.success) {
          setWishlist((prev) => prev.filter((item) => item.id !== id));
          toast.success("Item wishlist berhasil dihapus");
        }
      } catch {
        toast.error("Gagal menghapus item wishlist");
      }
    });
  };

  const currentSavings = initialSavingsData.currentSavings;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wishlist</h1>
          <p className="text-muted-foreground mt-1">Kelola barang impianmu yang terhubung dengan tabungan saat ini.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setName(""); setTargetPrice(""); setTargetDate(""); } }}>
          <DialogTrigger render={<Button className="bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-pink-600 hover:to-rose-700 shadow-lg shadow-pink-500/25" />}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Wishlist
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Item Wishlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nama Barang *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: MacBook Pro, Liburan Akhir Semester" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Harga (Rp) *</Label>
                  <Input type="number" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} placeholder="15000000" />
                </div>
                <div className="space-y-2">
                  <Label>Target Tanggal</Label>
                  <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleAddSubmit} disabled={isPending} className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white">
                {isPending ? "Menyimpan..." : "Tambah ke Wishlist"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Savings Summary Banner */}
      <Card className="border-indigo-500/20 bg-indigo-500/5">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
              <Target className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tabungan Saat Ini (dari menu Keuangan)</p>
              <p className="text-2xl font-bold text-indigo-400 mt-0.5">{formatRupiah(currentSavings)}</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground sm:text-right">
            <p>Saldo Awal: {formatRupiah(initialSavingsData.initialBalance)}</p>
            <p className="mt-0.5">Total Mutasi: +{formatRupiah(initialSavingsData.totalIncome)} | -{formatRupiah(initialSavingsData.totalExpense)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Grid of items */}
      {wishlist.length === 0 ? (
        <Card className="border-border/50 bg-card/50 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-pink-500/10 mb-4">
            <Heart className="h-6 w-6 text-pink-500" />
          </div>
          <h3 className="text-lg font-semibold">Wishlist Kosong</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
            Belum ada barang impian yang ditambahkan. Buat target menabungmu sekarang!
          </p>
          <Button onClick={() => setDialogOpen(true)} className="mt-6 bg-gradient-to-r from-pink-500 to-rose-600 text-white">
            <Plus className="mr-2 h-4 w-4" /> Tambah Item Pertama
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wishlist.map((item) => {
            const hasMetTarget = currentSavings >= item.targetPrice;
            const diff = Math.abs(currentSavings - item.targetPrice);
            const percent = Math.min(100, Math.round((currentSavings / item.targetPrice) * 100));

            // Target date calculations
            let dateText = "Tanpa Target Tanggal";
            let daysRemainingText = null;
            if (item.targetDate) {
              const parsedDate = new Date(item.targetDate);
              dateText = format(parsedDate, "dd MMM yyyy", { locale: localeId });
              const daysDiff = differenceInDays(parsedDate, new Date());
              if (daysDiff > 0) {
                daysRemainingText = `${daysDiff} hari lagi`;
              } else if (daysDiff === 0) {
                daysRemainingText = "Hari ini!";
              } else {
                daysRemainingText = `Lewat ${Math.abs(daysDiff)} hari`;
              }
            }

            return (
              <Card key={item.id} className="border-border/50 bg-card/50 flex flex-col justify-between group hover:border-pink-500/20 transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base line-clamp-1">{item.name}</CardTitle>
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Target: {dateText} {daysRemainingText && `(${daysRemainingText})`}
                      </p>
                    </div>
                    <Badge className={hasMetTarget ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-pink-500/10 text-pink-500 border-pink-500/20"}>
                      {hasMetTarget ? "Tercapai 🎉" : `${percent}%`}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="h-2 rounded-full bg-accent overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${
                          hasMetTarget ? "from-emerald-500 to-green-500" : "from-pink-500 to-rose-500"
                        } transition-all duration-300`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Target: {formatRupiah(item.targetPrice)}</span>
                      <span className="font-semibold">{percent}%</span>
                    </div>
                  </div>

                  {/* Lacking / Over balance card info */}
                  <div className={`p-3 rounded-lg flex items-start gap-2 text-xs border ${
                    hasMetTarget 
                      ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-500" 
                      : "bg-amber-500/5 border-amber-500/10 text-amber-500"
                  }`}>
                    {hasMetTarget ? (
                      <>
                        <Target className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Dana Terpenuhi!</p>
                          <p className="text-[10px] opacity-90 mt-0.5">Tabungan Anda saat ini lebih {formatRupiah(diff)} dari target.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Menabung Lagi</p>
                          <p className="text-[10px] opacity-90 mt-0.5">Masih kurang {formatRupiah(diff)} lagi untuk membeli barang ini.</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end border-t border-border/40 pt-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 h-8 w-8 opacity-70 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
