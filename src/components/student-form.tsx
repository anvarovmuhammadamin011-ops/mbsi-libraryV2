"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Eye, EyeOff } from "lucide-react";

const EMPTY = {
  firstName: "",
  lastName: "",
  login: "",
  password: "",
  email: "",
  phone: "",
  group: "",
  age: "",
  gender: "",
  address: "",
  parentContact: "",
  healthNote: "",
  about: "",
};

export function StudentForm({
  redirectTo = "/admin/students/pending",
}: {
  /** Ariza yuborilgandan keyin o'tiladigan sahifa. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  function set<K extends keyof typeof EMPTY>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    const errs: string[] = [];
    if (form.firstName.trim().length < 2) errs.push("Ism kamida 2 harf bo'lsin");
    if (form.lastName.trim().length < 2) errs.push("Familya kamida 2 harf bo'lsin");
    if (!/^[a-zA-Z0-9._-]{3,50}$/.test(form.login.trim()))
      errs.push("Login kamida 3 belgi — faqat harflar, raqamlar, . _ -");
    if (form.password.length < 4) errs.push("Parol kamida 4 belgi bo'lsin");
    if (!form.group.trim()) errs.push("Guruhni kiriting");
    const age = Number(form.age);
    if (!form.age || !Number.isInteger(age) || age < 5 || age > 100)
      errs.push("Yosh 5–100 oralig'ida bo'lsin");
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.push("Email noto'g'ri");
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/students/pending", {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        login: form.login.trim(),
        password: form.password,
        email: form.email.trim(),
        phone: form.phone.trim(),
        group: form.group.trim(),
        age,
        gender: form.gender || undefined,
        address: form.address.trim(),
        parentContact: form.parentContact.trim(),
        healthNote: form.healthNote.trim(),
        about: form.about.trim(),
      });
      toast.success("Ariza qabul qilindi — tasdiqlash kutilmoqda");
      router.push(redirectTo);
    } catch (e: any) {
      toast.error(e.message || "Xatolik");
    } finally {
      setSaving(false);
    }
  }

  const input = "h-10";

  function suggestLogin() {
    const f = form.firstName.trim().toLowerCase().replace(/[^a-z]/g, "");
    const l = form.lastName.trim().toLowerCase().replace(/[^a-z]/g, "");
    if (!f && !l) return;
    set("login", `${l || f}.${f || l}`.replace(/^\.+|\.+$/g, ""));
  }

  function generatePassword() {
    const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
    let out = "";
    for (let i = 0; i < 10; i++) {
      out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    set("password", `${out.slice(0, 5)}-${out.slice(5)}`);
    setShowPassword(true);
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      {errors.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <ul className="list-disc pl-5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Ism *</Label>
          <Input
            className={input}
            value={form.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            placeholder="Masalan: Ali"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Familya *</Label>
          <Input
            className={input}
            value={form.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            placeholder="Masalan: Valiyev"
          />
        </div>
      </div>
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-medium">
          🔐 Tizimga kirish ma&apos;lumotlari
        </p>
        <p className="mb-3 text-xs text-muted-foreground">
          O&apos;quvchi tasdiqlangach, shu login va parol orqali ilovaga kira
          oladi.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Login *</Label>
            <div className="flex gap-2">
              <Input
                className={input}
                value={form.login}
                onChange={(e) => set("login", e.target.value.toLowerCase())}
                onBlur={suggestLogin}
                placeholder="masalan: valiyev.ali"
                autoCapitalize="none"
                spellCheck={false}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Parol *</Label>
            <div className="flex gap-2">
              <Input
                className={input}
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Kamida 4 belgi"
                autoComplete="new-password"
                required
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Email *</Label>
          <Input
            className={input}
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="ali@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Telefon raqami</Label>
          <Input
            className={input}
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+998 90 123 45 67"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Guruh *</Label>
          <Input
            className={input}
            value={form.group}
            onChange={(e) => set("group", e.target.value)}
            placeholder="Masalan: 7-A"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Yosh *</Label>
          <Input
            className={input}
            type="number"
            min={5}
            max={100}
            value={form.age}
            onChange={(e) => set("age", e.target.value)}
            placeholder="13"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Jins</Label>
          <div className="flex h-10 items-center gap-4 rounded-md border border-input px-3 text-sm">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="gender"
                checked={form.gender === "MALE"}
                onChange={() => set("gender", "MALE")}
              />
              Erkak
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="gender"
                checked={form.gender === "FEMALE"}
                onChange={() => set("gender", "FEMALE")}
              />
              Ayol
            </label>
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Salomatlik holati haqida qisqacha</Label>
        <Input
          className={input}
          value={form.healthNote}
          onChange={(e) => set("healthNote", e.target.value)}
          placeholder="Masalan: allergiya yo'q"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Manzil</Label>
        <Input
          className={input}
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
          placeholder="Shahar, ko'cha, uy"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Ota-onasining kontakti</Label>
        <Input
          className={input}
          value={form.parentContact}
          onChange={(e) => set("parentContact", e.target.value)}
          placeholder="+998 90 ..."
        />
      </div>
      <div className="space-y-1.5">
        <Label>Qo&apos;shimcha ma&apos;lumot</Label>
        <Textarea
          rows={3}
          value={form.about}
          onChange={(e) => set("about", e.target.value)}
          placeholder="..."
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="gap-2">
          {saving && <Loader2 className="size-4 animate-spin" />}
          Qo&apos;shish
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Bekor qilish
        </Button>
      </div>
    </form>
  );
}
