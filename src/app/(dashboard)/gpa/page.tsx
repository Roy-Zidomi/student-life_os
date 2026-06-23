import { Metadata } from "next";
import { getCourses, getGPAStats } from "@/actions/gpa.actions";
import GPAPageClient from "./gpa-client";

export const metadata: Metadata = { title: "IPK Predictor" };

export default async function GPAPage() {
  const [courses, stats] = await Promise.all([getCourses(), getGPAStats()]);
  return (
    <GPAPageClient
      initialCourses={JSON.parse(JSON.stringify(courses))}
      initialStats={JSON.parse(JSON.stringify(stats))}
    />
  );
}
