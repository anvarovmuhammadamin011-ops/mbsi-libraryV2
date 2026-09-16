import { RegistrarUsersList } from "@/components/registrar-users-list";

export const dynamic = "force-dynamic";

export default function RegistrarUsersPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Barcha foydalanuvchilar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          O&#39;quvchilar, o&#39;qituvchilar va xodimlar
        </p>
      </div>
      <RegistrarUsersList />
    </div>
  );
}