import { Metadata } from "next";
import { getTasks } from "@/actions/task.actions";
import TasksPageClient from "./tasks-client";

export const metadata: Metadata = {
  title: "Manajemen Tugas",
};

export default async function TasksPage() {
  const tasks = await getTasks();

  return <TasksPageClient initialTasks={JSON.parse(JSON.stringify(tasks))} />;
}
