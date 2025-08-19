import prisma from "@/lib/db";
import { requireAdmin } from "./require-admin";

export async function adminGetCourses() {
  await requireAdmin();

  const data = await prisma.course.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      smallDescription: true,
      level: true,
      duration: true,
      fileKey: true,
    },
  });
  return data;
}

export type AdminCourseType = Awaited<ReturnType<typeof adminGetCourses>>[0];
