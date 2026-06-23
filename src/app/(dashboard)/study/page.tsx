import { Metadata } from "next";
import { getStudySessions, getStudyStats } from "@/actions/study.actions";
import StudyPageClient from "./study-client";

export const metadata: Metadata = {
  title: "Belajar",
};

export default async function StudyPage() {
  const [sessions, stats] = await Promise.all([getStudySessions(), getStudyStats()]);

  return (
    <StudyPageClient
      initialSessions={JSON.parse(JSON.stringify(sessions))}
      initialStats={JSON.parse(JSON.stringify(stats))}
    />
  );
}
