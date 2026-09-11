import { prisma } from "@/lib/db";
import { guardRegistrar } from "@/lib/server/guard";
import { RegistrarRequestsList } from "@/components/registrar-requests-list";

export const dynamic = "force-dynamic";

export default async function RegistrarRequestsPage() {
  const user = await guardRegistrar();

  const items = await prisma.pendingStudent.findMany({
    where: { submittedById: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      group: true,
      age: true,
      status: true,
      createdAt: true,
      phone: true,
      email: true,
      about: true,
    },
  });

  const rows = items.map((r) => ({
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    group: r.group,
    age: r.age,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    phone: r.phone,
    email: r.email,
    about: r.about,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mening arizalarim</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Siz yuborgan o&apos;quvchi arizalari va ularning statusi
        </p>
      </div>
      <RegistrarRequestsList items={rows} />
    </div>
  );
}
