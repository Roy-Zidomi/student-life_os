import { z } from "zod";
import { sanitizePreprocess } from "@/lib/sanitize";

export const courseSchema = z.object({
  name: z.preprocess(sanitizePreprocess, z.string().min(1, "Nama mata kuliah wajib diisi").max(200)),
  credits: z.number().int("SKS harus bilangan bulat").min(1, "SKS minimal 1").max(8, "SKS maksimal 8"),
  grade: z.string().max(5).optional(),
  semester: z.number().int("Semester harus bilangan bulat").min(1, "Semester minimal 1").max(14, "Semester maksimal 14"),
});

export type CourseFormData = z.infer<typeof courseSchema>;
