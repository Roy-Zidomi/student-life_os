import { z } from "zod";

export const courseSchema = z.object({
  name: z.string().min(1, "Nama mata kuliah wajib diisi").max(200),
  credits: z.number().min(1, "SKS minimal 1").max(8, "SKS maksimal 8"),
  grade: z.string().optional(),
  semester: z.number().min(1, "Semester minimal 1").max(14, "Semester maksimal 14"),
});

export type CourseFormData = z.infer<typeof courseSchema>;
