import { adminGetCourses } from "@/app/data/admin/admin-get-courses";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { AdminCourseCard } from "./_components/admin-course-card";

export default async function CoursesPage() {
  const data = await adminGetCourses();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2x font-bold">Your Courses</h1>

        <Link href="/admin/courses/create" className={buttonVariants()}>
          Create Course
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.map((item) => (
          <AdminCourseCard key={item.id} data={item} />
        ))}
      </div>
    </div>
  );
}
