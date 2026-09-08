"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { COMPANY } from "@/lib/company";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, password, remember }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || "Unable to create account");
        return;
      }
      const next = searchParams.get("next") || "/";
      router.replace(next.startsWith("/") ? next : "/");
      router.refresh();
    } catch {
      setError("Unable to sign up. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleGoogleSignIn() {
    const next = searchParams.get("next") || "/";
    const url = new URL("/api/auth/google", window.location.origin);
    if (next.startsWith("/")) url.searchParams.set("next", next);
    window.location.href = url.toString();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      <div>
        <label htmlFor="name" className="mb-2 block text-[13px] font-medium text-[#1f2937]">
          Full name
        </label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Cruz"
          className="h-12 w-full rounded-xl border border-[#e5e7eb] bg-white px-3.5 text-[14px] text-[#111827] outline-none transition placeholder:text-[#c0c5ce] focus:border-[#2c3947] focus:ring-4 focus:ring-[#2c3947]/15"
          required
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="username" className="mb-2 block text-[13px] font-medium text-[#1f2937]">
          Username
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#9ca3af]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
              <path
                d="M3 13.2c.8-2.2 2.6-3.4 5-3.4s4.2 1.2 5 3.4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            id="username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="janecruz"
            className="h-12 w-full rounded-xl border border-[#e5e7eb] bg-white pr-3.5 pl-10 text-[14px] text-[#111827] outline-none transition placeholder:text-[#c0c5ce] focus:border-[#2c3947] focus:ring-4 focus:ring-[#2c3947]/15"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-[13px] font-medium text-[#1f2937]">
          Password
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#9ca3af]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <rect
                x="3.25"
                y="7"
                width="9.5"
                height="6.25"
                rx="1.4"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M5.5 7V5.4a2.5 2.5 0 015 0V7"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="h-12 w-full rounded-xl border border-[#e5e7eb] bg-white pr-11 pl-10 text-[14px] text-[#111827] outline-none transition placeholder:text-[#c0c5ce] focus:border-[#2c3947] focus:ring-4 focus:ring-[#2c3947]/15"
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-[11px] font-semibold text-[#6b7280] hover:text-[#111827]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirm" className="mb-2 block text-[13px] font-medium text-[#1f2937]">
          Confirm password
        </label>
        <input
          id="confirm"
          name="confirm"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          className="h-12 w-full rounded-xl border border-[#e5e7eb] bg-white px-3.5 text-[14px] text-[#111827] outline-none transition placeholder:text-[#c0c5ce] focus:border-[#2c3947] focus:ring-4 focus:ring-[#2c3947]/15"
          required
          minLength={8}
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[#4b5563]">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="h-4 w-4 rounded border-[#d1d5db] text-[#2c3947] accent-[#2c3947]"
        />
        Remember me
      </label>

      {error ? (
        <p className="rounded-xl border border-[#fbd3ce] bg-[#fef3f2] px-3.5 py-2.5 text-[13px] font-medium text-[#b42318]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-[#15181c] text-[14px] font-semibold text-white transition hover:bg-[#0f1317] disabled:opacity-60"
      >
        {busy ? "Creating account…" : "Sign up"}
      </button>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-[#e5e7eb]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#f3f4f6] px-3 text-[12px] text-[#9ca3af]">or</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-[#e5e7eb] bg-white text-[14px] font-semibold text-[#1f2937] transition hover:bg-[#f9fafb]"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
          <path
            fill="#EA4335"
            d="M9 7.2v3.5h4.9c-.2 1.1-.8 2-1.7 2.6l2.8 2.2c1.6-1.5 2.5-3.7 2.5-6.3 0-.6-.1-1.2-.2-1.8H9z"
          />
          <path
            fill="#34A853"
            d="M4.1 10.7l-.7.5-2.3 1.8C2.6 15.5 5.6 17.5 9 17.5c2.2 0 4.1-.7 5.5-2l-2.8-2.2c-.8.5-1.8.9-2.7.9-2.1 0-3.9-1.4-4.5-3.3z"
          />
          <path
            fill="#4A90E2"
            d="M1.1 5.5C.4 6.9 0 8.4 0 10s.4 3.1 1.1 4.5l3-2.3C3.8 11.5 3.6 10.8 3.6 10s.2-1.5.5-2.2l-3-2.3z"
          />
          <path
            fill="#FBBC05"
            d="M9 3.5c1.2 0 2.3.4 3.2 1.2l2.4-2.4C13.1.8 11.2 0 9 0 5.6 0 2.6 2 1.1 5.5l3 2.3C4.7 5 6.6 3.5 9 3.5z"
          />
        </svg>
        Continue with Gmail
      </button>

      <p className="pt-1 text-center text-[13px] text-[#6b7280]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#15181c] hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[#f3f4f6] lg:grid lg:grid-cols-[minmax(0,42%)_minmax(0,58%)]">
      <section className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-10 flex items-center gap-2.5">
            <Image
              src="/brand/techcentrix-logo.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-md bg-black object-cover"
              priority
            />
            <span className="text-[17px] font-bold tracking-tight text-[#111827]">
              {COMPANY.displayName}
            </span>
          </div>

          <h1 className="mb-8 text-[34px] leading-none font-bold tracking-tight text-[#111827]">
            Sign up
          </h1>

          <Suspense
            fallback={<div className="h-64 animate-pulse rounded-xl bg-white/70" aria-hidden />}
          >
            <SignupForm />
          </Suspense>

          <p className="mt-8 text-[12px] text-[#9ca3af]">
            Internal use only · © {new Date().getFullYear()} {COMPANY.displayName}
          </p>
        </div>
      </section>

      <section className="relative hidden overflow-hidden p-4 lg:block lg:p-5">
        <div className="relative flex h-full min-h-[calc(100vh-2.5rem)] flex-col overflow-hidden rounded-[28px] bg-[#15181c] px-10 py-10 text-white xl:px-14">
          <div
            className="pointer-events-none absolute -right-10 -bottom-16 opacity-[0.07]"
            aria-hidden
          >
            <Image
              src="/brand/techcentrix-logo.png"
              alt=""
              width={420}
              height={420}
              className="h-[420px] w-[420px] object-contain"
            />
          </div>

          <div className="relative z-10 mb-auto flex items-center gap-2.5">
            <Image
              src="/brand/techcentrix-logo.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded object-cover"
            />
            <span className="text-[14px] font-semibold tracking-wide">
              {COMPANY.legalName}
            </span>
          </div>

          <div className="relative z-10 max-w-lg pt-16 pb-10">
            <p
              className="mb-3 text-[12px] font-semibold tracking-[0.16em] uppercase"
              style={{ color: "#C9A227" }}
            >
              Quotation System
            </p>
            <h2 className="mb-4 text-[40px] leading-[1.1] font-bold tracking-tight xl:text-[44px]">
              Create your{" "}
              <span style={{ color: "#C9A227" }}>Techcentrix</span> account
            </h2>
            <p className="max-w-md text-[15px] leading-relaxed text-white/70">
              Join the team workspace to prepare quotations, track RFQs, and keep
              project documentation in one place.
            </p>
          </div>

          <div className="relative z-10 mt-auto rounded-2xl bg-white/10 px-6 py-5 ring-1 ring-white/10 backdrop-blur-sm">
            <p className="mb-1.5 text-[16px] font-semibold text-white">
              Built for Techcentrix staff
            </p>
            <p className="max-w-md text-[13px] leading-relaxed text-white/55">
              Use a work username or continue with an allowed Gmail account.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
