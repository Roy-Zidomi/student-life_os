import { Metadata } from "next";
import { getEvents } from "@/actions/event.actions";
import CalendarPageClient from "./calendar-client";

export const metadata: Metadata = {
  title: "Kalender",
};

export default async function CalendarPage() {
  const events = await getEvents();

  return <CalendarPageClient initialEvents={JSON.parse(JSON.stringify(events))} />;
}
