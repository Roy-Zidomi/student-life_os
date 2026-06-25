"use server";

import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/user";
import { courseSchema } from "@/validators/gpa.schema";
import { cuidSchema, checkRateLimit } from "@/lib/sanitize";
import { ACTION_WRITE_LIMIT } from "@/lib/rate-limit";
import { GRADE_MAP } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const MAX_RESULTS = 500;

export async function getCourses() {
  const user = await ensureUser();

  const courses = await prisma.course.findMany({
    where: { userId: user.id },
    orderBy: [{ semester: "asc" }, { name: "asc" }],
    take: MAX_RESULTS,
  });

  return courses;
}

export async function createCourse(data: unknown) {
  const user = await ensureUser();

  const rateCheck = checkRateLimit(`action:gpa:create:${user.id}`, ACTION_WRITE_LIMIT);
  if (!rateCheck.allowed) {
    return { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
  }

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
  const validatedId = cuidSchema.parse(id);

  const rateCheck = checkRateLimit(`action:gpa:update:${user.id}`, ACTION_WRITE_LIMIT);
  if (!rateCheck.allowed) {
    return { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
  }

  const parsed = courseSchema.partial().parse(data);

  const existing = await prisma.course.findFirst({
    where: { id: validatedId, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Mata kuliah tidak ditemukan" };
  }

  const updateData: Record<string, unknown> = { ...parsed };
  if (parsed.grade) {
    updateData.gradePoint = GRADE_MAP[parsed.grade] ?? null;
  }

  const course = await prisma.course.update({
    where: { id: validatedId },
    data: updateData,
  });

  revalidatePath("/gpa");
  revalidatePath("/dashboard");
  return { success: true, data: course };
}

export async function deleteCourse(id: string) {
  const user = await ensureUser();
  const validatedId = cuidSchema.parse(id);

  const rateCheck = checkRateLimit(`action:gpa:delete:${user.id}`, ACTION_WRITE_LIMIT);
  if (!rateCheck.allowed) {
    return { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
  }

  const existing = await prisma.course.findFirst({
    where: { id: validatedId, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Mata kuliah tidak ditemukan" };
  }

  await prisma.course.delete({ where: { id: validatedId } });

  revalidatePath("/gpa");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getGPAStats() {
  const user = await ensureUser();

  const courses = await prisma.course.findMany({
    where: { userId: user.id, gradePoint: { not: null } },
    orderBy: { semester: "asc" },
    take: MAX_RESULTS,
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

// --- Security constants for file upload ---
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB max
const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
];

// Strict validation: only allow base64 characters
const BASE64_REGEX = /^[A-Za-z0-9+/=]+$/;

export async function parseTranscriptAction(base64Image: string, mimeType: string) {
  try {
    const user = await ensureUser();

    const rateCheck = checkRateLimit(`action:gpa:transcript:${user.id}`, { windowMs: 60_000, maxRequests: 5 });
    if (!rateCheck.allowed) {
      return { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return { success: false, error: "Tipe file tidak didukung. Gunakan PNG, JPG, WEBP, atau PDF." };
    }

    // Validate base64 format
    if (!BASE64_REGEX.test(base64Image)) {
      return { success: false, error: "Format file tidak valid." };
    }

    // Validate file size (base64 is ~33% larger than binary)
    const estimatedBytes = Math.ceil((base64Image.length * 3) / 4);
    if (estimatedBytes > MAX_FILE_SIZE_BYTES) {
      return { success: false, error: "Ukuran file terlalu besar. Maksimal 5MB." };
    }
    
    const { generateObject } = await import("ai");
    const { google } = await import("@ai-sdk/google");

    const isPdf = mimeType === "application/pdf";
    const filePart = isPdf
      ? {
          type: "file" as const,
          data: base64Image,
          mediaType: "application/pdf",
        }
      : {
          type: "image" as const,
          image: base64Image,
          mediaType: mimeType,
        };

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
              text: "Extract all courses from this academic transcript or KHS document. Capture the Semester, Course Name (Mata Kuliah), Credits (SKS), and Grade (Nilai). Ensure that grade letters like A, AB, B, BC, C, D, E are captured exactly as shown. For SKS and Semester, convert them to numbers.",
            },
            filePart,
          ],
        },
      ],
    });

    return { success: true, courses: object.courses };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error parsing transcript:", message);
    return { success: false, error: "Gagal memproses dokumen. Silakan coba lagi." };
  }
}

// Zod schema for validating imported courses
const importCourseSchema = z.object({
  semester: z.number().int().min(1).max(14),
  name: z.string().min(1).max(200),
  credits: z.number().int().min(1).max(8),
  grade: z.string().max(5).nullable(),
});

const importCoursesSchema = z
  .array(importCourseSchema)
  .min(1, "Minimal 1 mata kuliah")
  .max(100, "Maksimal 100 mata kuliah per import");

export async function importCoursesAction(courses: { semester: number; name: string; credits: number; grade: string | null }[]) {
  try {
    const user = await ensureUser();

    const rateCheck = checkRateLimit(`action:gpa:import:${user.id}`, { windowMs: 60_000, maxRequests: 5 });
    if (!rateCheck.allowed) {
      return { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
    }

    // Validate input with Zod
    const parsed = importCoursesSchema.parse(courses);
    
    const createdCourses = await prisma.$transaction(
      parsed.map((course) => {
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error importing courses:", message);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Data mata kuliah tidak valid. Periksa kembali format data." };
    }
    return { success: false, error: "Gagal menyimpan mata kuliah. Silakan coba lagi." };
  }
}
