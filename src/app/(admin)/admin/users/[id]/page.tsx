import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { requireRole } from "@/lib/server/auth";
import { getManagedUserDetail } from "@/lib/server/users";
import { AdminUserActions } from "@/components/admin-user-actions";
import { AdminUserActivity } from "@/components/admin-user-activity";
import {
  ShieldCheck,
  Shield,
  BookOpen,
  BookCheck,
  Clock,
  Flame,
  PlayCircle,
  BookMarked,
  GraduationCap,
  Star,
  Briefcase,
  ArrowLeft,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireRole("ADMIN");
  if (!admin) return null;

  const { id } = await params;
  let detail;
  try {
    detail = await getManagedUserDetail(id);
  } catch {
    return notFound();
  }

  const u = detail.user;
  const s = detail.stats;

  const roleLabel =
    u.role === "STUDENT"
      ? "O'quvchi"
      : u.role === "TEACHER"
        ? "O'qituvchi"
        : u.role === "ADMIN"
          ? "Administrator"
          : u.role === "BOOK_MANAGER"
            ? "Kitob menejeri"
            : u.role === "REGISTRAR"
              ? "Registrator"
              : u.staffPosition ?? "Xodim";

  const fmtDur = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.round((sec % 3600) / 60);
    return h > 0 ? `${h} soat ${m} daq` : `${m} daq`;
  };

  const fmtDate = (iso?: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString("uz-UZ", { dateStyle: "medium" })
      : "—";

  const roleIcon =
    u.role === "STUDENT" ? (
      <GraduationCap size={18} className="text-blue-600" />
    ) : u.role === "TEACHER" ? (
      <Star size={18} className="text-violet-600" />
    ) : (
      <Briefcase size={18} className="text-muted-foreground" />
    );
  const isPrivileged = u.role === "ADMIN" || u.role === "BOOK_MANAGER";

  const info: [string, string][] = [
    ["Tug'ilgan sana", fmtDate(u.birthDate)],
    ["Yosh", u.age ? String(u.age) : "—"],
    ["Jinsi", u.gender === "MALE" ? "Erkak" : u.gender === "FEMALE" ? "Ayol" : "—"],
    ["Gruppa", u.group ?? u.staffPosition ?? (u.teacherSubject ? `Fan: ${u.teacherSubject}` : "—")],
    ["Telefon", u.phone ?? "—"],
    ["Email", u.email ?? "—"],
    ["Manzil", u.address ?? "—"],
    ["Ota-ona", u.parentContact ?? "—"],
    ["Qo'shimcha", u.about ?? "—"],
    ["Tizimda", fmtDate(u.createdAt)],
    ["Oxirgi login", u.lastLoginAt ? fmtDate(u.lastLoginAt) : "—"],
  ];

  const stats: { label: string; value: string; icon: ReactNode }[] = [
    { label: "Jami o'qishlar", value: String(s.sessions), icon: <PlayCircle size={15} /> },
    { label: "Boshlangan kitoblar", value: String(s.booksStarted), icon: <BookOpen size={15} /> },
    { label: "Faol o'qishlar", value: String(s.booksActive), icon: <BookMarked size={15} /> },
    { label: "Tugatilgan", value: String(s.booksCompleted), icon: <BookCheck size={15} /> },
    { label: "O'qilgan sahifalar", value: s.pagesRead.toLocaleString(), icon: <Flame size={15} /> },
    { label: "O'qish vaqti", value: fmtDur(s.readingSeconds), icon: <Clock size={15} /> },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={15} /> Foydalanuvchilar
      </Link>

      {/* ─── Header ─── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
              {u.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{u.name}</h1>
                {isPrivileged && (
                  <span className="text-amber-600">
                    {u.role === "ADMIN" ? <ShieldCheck size={20} /> : <Shield size={20} />}
                  </span>
                )}
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                {roleIcon} {roleLabel}
                {u.username ? ` · @${u.username}` : ""}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    u.isActive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {u.isActive ? "Faol" : "Bloklangan"}
                </span>
                {u.studentId && (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                    O&apos;quvchi ID: {u.studentId}
                  </span>
                )}
                {u.staffId && (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                    Xodim ID: {u.staffId}
                  </span>
                )}
              </div>
            </div>
          </div>
          <AdminUserActions
            userId={u.id}
            name={u.name}
            username={u.username}
            isActive={u.isActive}
            canDelete={u.id !== admin.id}
          />
        </div>
      </div>

      {/* ─── Statistika ─── */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
        {stats.map((x) => (
          <div key={x.label} className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">{x.icon}</div>
            <p className="text-xl font-bold tabular-nums">{x.value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{x.label}</p>
          </div>
        ))}
      </div>

      {/* ─── Davr bo'yicha faollik ─── */}
      <AdminUserActivity userId={u.id} />

      {/* ─── Hozir o'qilmoqda ─── */}
      {detail.currentReading && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <BookMarked size={15} className="text-primary" /> Hozir o&apos;qilmoqda
          </h2>
          <div className="flex items-center gap-3">
            {detail.currentReading.book.coverUrl ? (
              <img
                src={detail.currentReading.book.coverUrl}
                alt={detail.currentReading.book.title}
                className="h-16 w-12 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen size={18} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <Link
                href={`/books/${detail.currentReading.book.slug}`}
                className="block truncate font-medium hover:underline"
              >
                {detail.currentReading.book.title}
              </Link>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, detail.currentReading.progress)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {Math.round(detail.currentReading.progress)}% —{" "}
                {detail.currentReading.currentPage} sahifa
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── So'nggi kitoblar ─── */}
      {detail.recentBooks.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <BookCheck size={15} className="text-primary" /> So&apos;nggi o&apos;qilgan kitoblari
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {detail.recentBooks.map((b) => (
              <Link
                key={b.bookId}
                href={`/books/${b.slug}`}
                className="group rounded-xl border border-border p-3 transition-colors hover:border-primary/40"
              >
                <p className="truncate text-sm font-medium group-hover:underline">{b.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {b.completedAt
                    ? "✅ Tugatilgan"
                    : `${Math.round(b.progress)}% o'qilgan`}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─── Ma'lumotlar ─── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold">Ma&apos;lumotlar</h2>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {info.map(([k, v]) => (
            <div key={k} className="flex items-start justify-between gap-4 border-b border-border/50 pb-2">
              <dt className="shrink-0 text-sm text-muted-foreground">{k}</dt>
              <dd className="text-right text-sm font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}