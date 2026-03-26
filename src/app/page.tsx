"use client";

import { AlertCircle, Loader2, Smartphone } from "lucide-react";
import React, { useEffect, useState } from "react";

import AmountCard from "@/components/home/amount-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTelegram } from "@/hooks/use-telegram";
import { getUserAmount } from "@/lib/api/user/get-user-amount";
import { MonthIncomeExpenseAreaChart } from "@/components/home/home-chart-month";

export default function Home() {
  const { user, isReady, error } = useTelegram();


  // Amount state
  const [amount, setAmount] = useState<number>(0);

  // API status
  const [amountLoading, setAmountLoading] = useState<boolean>(true);
  const [amountError, setAmountError] = useState<string | null>(null);

  // Fetch amount (FAqat 1 marta)
  useEffect(() => {
    if (!isReady || !user) return;

    let mounted = true;

    const fetchAmount = async () => {
      try {
        setAmountLoading(true);
        setAmountError(null);

        const data = await getUserAmount();

        if (!mounted) return;

        if (data?.success) {
          setAmount(Number(data.amount));
        } else {
          setAmountError(data?.message || "Balansni olishda xatolik");
        }
      } catch (err: any) {
        if (!mounted) return;

        setAmountError(err?.message || "Server bilan bog‘lanib bo‘lmadi");
      } finally {
        if (mounted) {
          setAmountLoading(false);
        }
      }
    };

    fetchAmount();

    return () => {
      mounted = false;
    };
  }, [isReady, user]);

  /* =====================
     Telegram holatlari
     ===================== */

  // Telegram loading
  if (!isReady && !error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground text-lg">Yuklanmoqda...</p>
        </div>
      </main>
    );
  }

  // Telegram error
  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-5 w-5" />

          <AlertTitle>Xatolik</AlertTitle>

          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <Smartphone className="h-16 w-16 text-muted-foreground" />

          <p className="text-muted-foreground max-w-xs">
            Bu ilova faqat Telegram orqali ochilganda ishlaydi.
            Iltimos, Telegram botdan Web App tugmasini bosing.
          </p>
        </div>
      </main>
    );
  }

  // User not found
  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <Alert className="max-w-md">
          <AlertCircle className="h-5 w-5" />

          <AlertTitle>Foydalanuvchi topilmadi</AlertTitle>

          <AlertDescription>
            Telegram foydalanuvchi ma'lumotlari yuklanmadi.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  /* =====================
     Main UI
     ===================== */

  return (
    <main className="space-y-3 p-2">
      {/* Amount error */}
      {amountError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />

          <AlertTitle>Xatolik</AlertTitle>

          <AlertDescription>{amountError}</AlertDescription>
        </Alert>
      )}

      {/* Cards */}
      <AmountCard
        title="Kundalik jamg'arma"
        status="active"
        statusText="FAOL"
        description="Kundalik harajatlaringiz uchun ishlatiladigan mablag'laringiz!"
        disabled={false}
        amount={amount}
        loading={amountLoading}
        setAmount={setAmount}
      />

      <MonthIncomeExpenseAreaChart amount={amount} />

      {/* Other content */}
      {/* <HomeShowData /> */}
    </main>
  );
}
