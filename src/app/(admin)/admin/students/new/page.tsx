import { requireRole } from "@/lib/server/auth";
import { StudentForm } from "@/components/student-form";

export const dynamic = "force-dynamic";

export default async function NewStudentPage() {
  const user = await requireRole("ADMIN");
  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Yangi o&apos;quvchi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ariza tasdiqlangandan keyin o&apos;quvchi ro&apos;yxatga qo&apos;shiladi
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <StudentForm />
      </div>
    </div>
  );
}
