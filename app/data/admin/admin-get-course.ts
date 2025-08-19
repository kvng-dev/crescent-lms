import "server-only";
import { requireAdmin } from "./require-admin";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";

export async function adminGetCourse(id: string) {
  requireAdmin();

  const data = await prisma.course.findUnique({
    where: {
      id: id,
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
      status: true,
      category: true,
      price: true,
      chapters: {
        select: {
          id: true,
          title: true,
          position: true,
          lessons: {
            select: {
              id: true,
              title: true,
              position: true,
              thumbnailKey: true,
              description: true,
              videoKey: true,
            },
          },
        },
      },
    },
  });
  if (!data) {
    return notFound();
  }
  return data;
}

export type AdminGetCourseType = Awaited<ReturnType<typeof adminGetCourse>>;
