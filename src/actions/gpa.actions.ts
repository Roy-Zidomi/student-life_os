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

export async function parseTranscriptAction(base64Image: string, mimeType: string) {
  try {
    const user = await ensureUser();
    
    const { generateObject } = await import("ai");
    const { google } = await import("@ai-sdk/google");
    const { z } = await import("zod");

    const { object } = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: z.object({
        courses: z.array(
          z.object({
            semester: z.number().describe("Semester number, e.g. 1, 2, 3..."),
            name: z.string().describe("Official course name, e.g. KALKULUS 1"),
            credits: z.number().describe("SKS/Credits, e.g. 3, 2, 1..."),
            grade: z.string().nullable().describe("Grade letter, e.g. A, AB, B, BC, C, D, E. If no grade, null."),
          })
        ),
      }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all courses from this academic transcript or KHS image. Capture the Semester, Course Name (Mata Kuliah), Credits (SKS), and Grade (Nilai). Ensure that grade letters like A, AB, B, BC, C, D, E are captured exactly as shown. For SKS and Semester, convert them to numbers.",
            },
            {
              type: "image",
              image: base64Image,
              mediaType: mimeType,
            },
          ],
        },
      ],
    });

    return { success: true, courses: object.courses };
  } catch (error: any) {
    console.error("Error parsing transcript:", error);
    return { success: false, error: error.message || "Gagal memproses dokumen" };
  }
}

export async function importCoursesAction(courses: { semester: number; name: string; credits: number; grade: string | null }[]) {
  try {
    const user = await ensureUser();
    
    const createdCourses = await prisma.$transaction(
      courses.map((course) => {
        const gradePoint = course.grade ? GRADE_MAP[course.grade] ?? null : null;
        return prisma.course.create({
          data: {
            name: course.name,
            credits: course.credits,
            grade: course.grade,
            gradePoint,
            semester: course.semester,
            userId: user.id,
          },
        });
      })
    );

    revalidatePath("/gpa");
    revalidatePath("/dashboard");
    return { success: true, count: createdCourses.length };
  } catch (error: any) {
    console.error("Error importing courses:", error);
    return { success: false, error: error.message || "Gagal menyimpan mata kuliah" };
  }
}
