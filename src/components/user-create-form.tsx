"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, EyeOff, KeyRound, BadgeCheck, ArrowRight } from "lucide-react";
import type { UserTypeChoice } from "@/types";

const INPUT = "h-10";

const USER_TYPES: { value: UserTypeChoice; label: string; desc: string }[] = [
  { value: "TEACHER", label: "O'qituvchi", desc: "Fan o'qituvchisi — kitob o'qiydi va ball to'playdi" },
  { value: "DIRECTOR", label: "Direktor", desc: "Maktab direktori — kitob o'qiydi va ball to'playdi" },
  { value: "ADMIN", label: "Administrator", desc: "Tizim administratori" },
  { value: "STAFF", label: "Xodim", desc: "Kutubxonachi, menejer yoki boshqa xodim" },
];

const STAFF_POSITIONS = ["Direktor", "Administrator", "Kutubxonachi", "Menejer"];

type FormState = {
  userType: UserTypeChoice | null;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  studentId: string;
  age: string;
  birthDate: string;
  gender: string;
  group: string;
  teacherSubject: string;
  staffPosition: string;
  customPosition: string;
  staffId: string;
  email: string;
  phone: string;
  address: string;
  parentContact: string;
  about: string;
};

const EMPTY: FormState = {
  userType: null,
  firstName: "",
  lastName: "",
  username: "",
  password: "",
  studentId: "",
  age: "",
  birthDate: "",
  gender: "",
  group: "",
  teacherSubject: "",
  staffPosition: "",
  customPosition: "",
  staffId: "",
  email: "",
  phone: "",
  address: "",
  parentContact: "",
  about: "",
};

export function UserCreateForm({
  createUrl = "/api/admin/users",
  onlyType,
  profileUrl = (id: string) => `/admin/users/${id}`,
  submitLabel = "Foydalanuvchi yaratish",
}: {
  /** So'rov yuboriladigan endpoint (admin yoki registrar). */
  createUrl?: string;
  /** Faqat shu turdagi foydalanuvchi yaratiladi (registrar uchun: STUDENT). */
  onlyType?: UserTypeChoice | null;
  /** Yaratilgandan keyin "Profilga o'tish" havolasi — null bo'lsa ko'rinmaydi. */
  profileUrl?: ((id: string) => string) | null;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ ...EMPTY, userType: onlyType ?? null });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ id: string; name: string; username: string; role: string } | null>(null);
  const [plainPassword, setPlainPassword] = useState("");

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function suggestLogin() {
    const f = form.firstName.trim().toLowerCase().replace(/[^a-z]/g, "");
    const l = form.lastName.trim().toLowerCase().replace(/[^a-z]/g, "");
    if (!f && !l) return;
    set("username", `${l || f}.${f || l}`.replace(/^\.+|\.+$/g, "").toLowerCase());
  }

  function generatePassword() {
    const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
    let out = "";
    for (let i = 0; i < 12; i++) {
      out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    set("password", `${out.slice(0, 6)}-${out.slice(6)}`);
    setShowPassword(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const name = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    try {
      const res = await api.post<{
        user: { id: string; name: string; username: string; role: string };
        plainPassword: string;
      }>(createUrl, {
        userType: form.userType,
        name,
        username: form.username,
        password: form.password || undefined,
        group: form.group || undefined,
        age: form.age ? Number(form.age) : undefined,
        birthDate: form.birthDate || undefined,
        gender: form.gender || undefined,
        address: form.address || undefined,
        parentContact: form.parentContact || undefined,
        about: form.about || undefined,
        studentId: form.studentId || undefined,
        teacherSubject:
          form.userType === "TEACHER" ? form.teacherSubject || undefined : undefined,
        staffPosition:
          form.userType === "STAFF"
            ? form.staffPosition === "custom"
              ? form.customPosition || undefined
              : form.staffPosition || undefined
            : form.userType === "TEACHER"
              ? form.staffPosition || undefined
              : undefined,
        staffId: form.staffId || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
      });
      setCreated(res.user);
      setPlainPassword(res.plainPassword);
      toast.success("Foydalanuvchi yaratildi");
    } catch (err: any) {
      toast.error(err.message ?? "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  }

  const typeLabel = USER_TYPES.find((u) => u.value === form.userType)?.label ?? "foydalanuvchi";

  return (
    <>
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-4 md:grid-cols-2">
            {!onlyType && (
              <div className="space-y-1.5 md:col-span-2">
                <Label>Foydalanuvchi turi *</Label>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {USER_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => set("userType", t.value)}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        form.userType === t.value
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                          : "border-border bg-background hover:border-primary/40"
                      }`}
                    >
                      <p className="text-sm font-semibold">{t.label}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {form.userType === "STUDENT" && (
              <div className="space-y-1.5">
                <Label>O&apos;quvchi ID</Label>
                <Input
                  className={INPUT}
                  value={form.studentId}
                  onChange={(e) => set("studentId", e.target.value)}
                  placeholder="avtomatik beriladi"
                />
              </div>
            )}
            {(form.userType === "STAFF" || form.userType === "TEACHER" || form.userType === "DIRECTOR" || form.userType === "ADMIN") && (
              <div className="space-y-1.5">
                <Label>Xodim ID</Label>
                <Input
                  className={INPUT}
                  value={form.staffId}
                  onChange={(e) => set("staffId", e.target.value)}
                  placeholder="avtomatik beriladi"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Ism *</Label>
              <Input
                className={INPUT}
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                placeholder="Masalan: Ali"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Familya *</Label>
              <Input
                className={INPUT}
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                placeholder="Masalan: Valiyev"
                required
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
            <KeyRound size={15} className="text-primary" /> Tizimga kirish ma&apos;lumotlari
          </p>
          <p className="mb-4 text-xs text-muted-foreground">
            Keyingi qadamda parol faqat bir marta ko&apos;rsatiladi — uni saqlab qoling.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Login *</Label>
              <Input
                className={INPUT}
                value={form.username}
                onChange={(e) => set("username", e.target.value.toLowerCase())}
                onBlur={suggestLogin}
                placeholder="masalan: valiyev.ali"
                autoCapitalize="none"
                spellCheck={false}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Parol *</Label>
              <div className="flex gap-2">
                <Input
                  className={INPUT}
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Kamida 4 belgi"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0 text-xs"
                  onClick={generatePassword}
                >
                  Avtomatik
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 shrink-0 px-2"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {form.userType && form.userType !== "ADMIN" && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="mb-4 text-sm font-semibold">Qo&apos;shimcha ma&apos;lumotlar</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {form.userType === "STUDENT" && (
                <>
                  <div className="space-y-1.5">
                    <Label>Guruh / sinf *</Label>
                    <Input
                      className={INPUT}
                      value={form.group}
                      onChange={(e) => set("group", e.target.value)}
                      placeholder="Masalan: 7-A"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Yosh</Label>
                    <Input
                      className={INPUT}
                      type="number"
                      min={5}
                      max={100}
                      value={form.age}
                      onChange={(e) => set("age", e.target.value)}
                      placeholder="Masalan: 13"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tug&apos;ilgan sana</Label>
                    <Input
                      className={INPUT}
                      type="date"
                      value={form.birthDate}
                      onChange={(e) => set("birthDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Jinsi</Label>
                    <Select value={form.gender} onValueChange={(v) => set("gender", v ?? "")}>
                      <SelectTrigger className="w-full h-10">
                        <SelectValue placeholder="Tanlanmagan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Erkak</SelectItem>
                        <SelectItem value="FEMALE">Ayol</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ota-onasining kontakti</Label>
                    <Input
                      className={INPUT}
                      value={form.parentContact}
                      onChange={(e) => set("parentContact", e.target.value)}
                      placeholder="+998 90 ..."
                    />
                  </div>
                </>
              )}
              {form.userType === "TEACHER" && (
                <>
                  <div className="space-y-1.5">
                    <Label>Fan</Label>
                    <Input
                      className={INPUT}
                      value={form.teacherSubject}
                      onChange={(e) => set("teacherSubject", e.target.value)}
                      placeholder="Masalan: Matematika"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Lavozim</Label>
                    <Input
                      className={INPUT}
                      value={form.staffPosition}
                      onChange={(e) => set("staffPosition", e.target.value)}
                      placeholder="Masalan: Sinf rahbari"
                    />
                  </div>
                </>
              )}
              {form.userType === "STAFF" && (
                <>
                  <div className="space-y-1.5">
                    <Label>Lavozim *</Label>
                    <Select value={form.staffPosition} onValueChange={(v) => set("staffPosition", v ?? "")}>
                      <SelectTrigger className="w-full h-10">
                        <SelectValue placeholder="Tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {STAFF_POSITIONS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Boshqa xodim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.staffPosition === "custom" && (
                    <div className="space-y-1.5">
                      <Label>Lavozim (erkin)</Label>
                      <Input
                        className={INPUT}
                        value={form.customPosition}
                        onChange={(e) => set("customPosition", e.target.value)}
                        placeholder="Masalan: Psixolog"
                      />
                    </div>
                  )}
                </>
              )}
              <div className="space-y-1.5">
                <Label>Telefon</Label>
                <Input
                  className={INPUT}
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+998 90 123 45 67"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  className={INPUT}
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="user@maktab.uz"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Manzil</Label>
                <Input
                  className={INPUT}
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Shahar, ko'cha, uy"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Qo&apos;shimcha ma&apos;lumot</Label>
                <Textarea
                  rows={3}
                  value={form.about}
                  onChange={(e) => set("about", e.target.value)}
                  placeholder="Ixtiyoriy"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Bekor qilish
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saqlanmoqda..." : submitLabel}
          </Button>
        </div>
      </form>

      <Dialog open={created !== null} onOpenChange={(o) => !o && reset()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5">
              <BadgeCheck size={17} className="text-emerald-500" /> {typeLabel} yaratildi
            </DialogTitle>
            <DialogDescription>
              <strong>{created?.name}</strong> endi tizimda. Quyidagi ma&apos;lumotlarni saqlab
              qoling — bu parol endi ko&apos;rinmaydi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <CredRow label="Login" value={`@${created?.username ?? ""}`} />
            <CredRow label="Parol" value={plainPassword} mono />
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={reset}>
              Yangi yaratish
            </Button>
            {profileUrl && created && (
              <Button onClick={() => router.push(profileUrl(created.id))}>
                Profilga o&apos;tish <ArrowRight size={15} />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  function reset() {
    setCreated(null);
    setPlainPassword("");
    setForm({ ...EMPTY, userType: onlyType ?? null });
  }
}

function CredRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`select-all text-sm font-semibold ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}