import { Metadata } from "next";
import { getHabits } from "@/actions/habit.actions";
import HabitsPageClient from "./habits-client";

export const metadata: Metadata = { title: "Kebiasaan" };

export default async function HabitsPage() {
  const habits = await getHabits();
  return <HabitsPageClient initialHabits={JSON.parse(JSON.stringify(habits))} />;
}
