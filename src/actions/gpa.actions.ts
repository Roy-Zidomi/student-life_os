"use server";

import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/user";
import { courseSchema } from "@/validators/gpa.schema";
import { GRADE_MAP } from "@/lib/constants";
import { revalidatePath } from "next/cache";

export async function getCourses() {
  const user = await ensureUser();

  const courses = await prisma.course.findMany({
    where: { userId: user.id },
    orderBy: [{ semester: "asc" }, { name: "asc" }],
  });

  return courses;
}

export async function createCourse(data: unknown) {
  const user = await ensureUser();
  const parsed = courseSchema.parse(data);

  const gradePoint = parsed.grade ? GRADE_MAP[parsed.grade] ?? null : null;

  const course = await prisma.course.create({
    data: {
      name: parsed.name,
      credits: parsed.credits,
      grade: parsed.grade,
      gradePoint,
      semester: parsed.semester,
      userId: user.id,
    },
  });

  revalidatePath("/gpa");
  revalidatePath("/dashboard");
  return { success: true, data: course };
}

export async function updateCourse(id: string, data: unknown) {
  const user = await ensureUser();
  const parsed = courseSchema.partial().parse(data);

  const existing = await prisma.course.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Mata kuliah tidak ditemukan" };
  }

  const updateData: Record<string, unknown> = { ...parsed };
  if (parsed.grade) {
    updateData.gradePoint = GRADE_MAP[parsed.grade] ?? null;
  }

  const course = await prisma.course.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/gpa");
  revalidatePath("/dashboard");
  return { success: true, data: course };
}

export async function deleteCourse(id: string) {
  const user = await ensureUser();

  const existing = await prisma.course.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Mata kuliah tidak ditemukan" };
  }

  await prisma.course.delete({ where: { id } });

  revalidatePath("/gpa");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getGPAStats() {
  const user = await ensureUser();

  const courses = await prisma.course.findMany({
    where: { userId: user.id, gradePoint: { not: null } },
    orderBy: { semester: "asc" },
  });

  // Calculate per-semester GPA (IPS)
  const semesterMap: Record<number, { totalCredits: number; totalPoints: number }> = {};

  courses.forEach((course) => {
    if (!semesterMap[course.semester]) {
      semesterMap[course.semester] = { totalCredits: 0, totalPoints: 0 };
    }
    semesterMap[course.semester].totalCredits += course.credits;
    semesterMap[course.semester].totalPoints += course.credits * (course.gradePoint ?? 0);
  });

  const semesterGPA = Object.entries(semesterMap).map(([semester, data]) => ({
    semester: Number(semester),
    gpa: data.totalCredits > 0 ? Number((data.totalPoints / data.totalCredits).toFixed(2)) : 0,
    totalCredits: data.totalCredits,
  }));

  // Calculate cumulative GPA (IPK)
  const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);
  const totalPoints = courses.reduce((acc, c) => acc + c.credits * (c.gradePoint ?? 0), 0);
  const cumulativeGPA = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;

  return {
    semesterGPA,
    cumulativeGPA,
    totalCredits,
    totalCourses: courses.length,
  };
}
