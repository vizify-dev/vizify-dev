"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

const FIELD =
  "h-[48px] w-full rounded-[8px] bg-sunken px-[14px] text-[15px] text-ink placeholder:text-ink3 " +
  "focus-visible:outline-2 focus-visible:outline-accent-light";

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 16 16" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" />
      <circle cx="8" cy="8" r="2" />
      {off && <path d="M2.5 13.5 13.5 2.5" />}
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" width={18} height={18} aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.2 5.5-4.7 7.2l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.6Z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1Z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48Z" />
    </svg>
  );
}

export default function SignIn() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function google() {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy(true);
    if (mode === "up") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name }, emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
      else if (data.session) {
        router.push("/");
        router.refresh();
      } else setInfo("Check your email to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else {
        router.push("/");
        router.refresh();
      }
    }
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {/* Top bar */}
      <header className="flex items-center justify-between px-[24px] py-[20px] md:px-[56px]">
        <div className="flex items-center gap-[12px]">
          <Logo />
          <span className="hidden font-mono text-[12px] text-ink3 sm:inline">/ data, dressed up.</span>
        </div>
        <div className="flex items-center gap-[24px] text-[14px]">
          <span className="hidden text-ink3 md:inline">No account? No problem.</span>
          <Link href="/" className="font-semibold text-ink hover:text-accent-light">
            Open the editor ↗
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="px-[24px] pt-[16px] text-center">
        <h1 className="text-[32px] font-bold tracking-[-0.02em] text-ink md:text-[44px]">
          A little less raw. A lot more wow.
        </h1>
        <p className="mt-[12px] text-[15px] text-ink3">Your data has potential. Let&apos;s give it a place to shine.</p>
      </div>

      <main className="mx-auto grid w-full max-w-[1312px] flex-1 grid-cols-1 items-start gap-[32px] px-[24px] py-[40px] lg:grid-cols-[1fr_440px_1fr] lg:px-[56px]">
        {/* Left: raw material */}
        <section className="hidden lg:block" aria-label="The raw material">
          <p className="mb-[16px] font-mono text-[11px] tracking-[0.72px] text-ink3">01 / THE RAW MATERIAL</p>
          <div className="-rotate-[5deg] rounded-[12px] bg-ed p-[16px] font-mono text-[12px] leading-[1.6] text-edtext">
            <span className="text-eddim">untitled.csv</span>
            <pre className="mt-[6px] whitespace-pre-wrap">{`name,role,status\n"Alex",developer,"in progress"\n,designer,ready??`}</pre>
          </div>
          <Image
            src="/sign-in-illustration.svg"
            alt=""
            width={360}
            height={350}
            priority
            className="mt-[8px] h-auto w-full max-w-[340px]"
          />
          <div className="mt-[16px]">
            <p className="text-[20px] font-bold text-ink">Good data. Bad hair day.</p>
            <p className="mt-[6px] text-[13px] text-ink3">Bring your commas. We&apos;ll bring the polish.</p>
          </div>
        </section>

        {/* Center: form card */}
        <section className="mx-auto w-full max-w-[440px]">
          <div className="hidden w-[250px] rounded-t-[12px] bg-ed px-[16px] py-[10px] font-mono text-[12px] text-edtext lg:flex lg:items-center lg:gap-[8px]">
            <span className="size-[8px] rounded-full bg-white" />
            account.vizify
          </div>
          <form
            onSubmit={onSubmit}
            noValidate
            className="rounded-[20px] border border-line bg-surface p-[32px] shadow-xl lg:rounded-tl-none"
          >
            <p className="font-mono text-[11px] tracking-[0.72px] text-accent-light">
              {mode === "in" ? "WELCOME BACK" : "GET STARTED"}
            </p>
            <h2 className="mt-[8px] text-[30px] font-bold tracking-[-0.02em] text-ink">Make room for magic.</h2>
            <p className="mt-[8px] text-[15px] text-ink3">
              {mode === "in" ? "Sign in to pick up where you left off." : "Create a free account to save your work."}
            </p>

            <button
              type="button"
              className="mt-[24px] flex h-[48px] w-full cursor-pointer items-center justify-center gap-[12px] rounded-[8px] border border-line bg-surface text-[15px] font-semibold text-ink transition-colors hover:bg-sunken focus-visible:outline-2 focus-visible:outline-accent-light"
              onClick={google}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="my-[20px] flex items-center gap-[12px] text-[13px] text-ink3">
              <span className="h-px flex-1 bg-line" />
              or
              <span className="h-px flex-1 bg-line" />
            </div>

            {mode === "up" && (
              <div className="mb-[20px]">
                <label htmlFor="name" className="mb-[8px] block text-[14px] font-semibold text-ink">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={FIELD}
                  required
                />
              </div>
            )}

            <label htmlFor="email" className="mb-[8px] block text-[14px] font-semibold text-ink">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={FIELD}
              required
            />

            <div className="mt-[20px] mb-[8px] flex items-center justify-between">
              <label htmlFor="password" className="text-[14px] font-semibold text-ink">
                Password
              </label>
              <Link href="/forgot-password" className="text-[13px] text-accent-light hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={show ? "text" : "password"}
                autoComplete={mode === "in" ? "current-password" : "new-password"}
                placeholder="8+ characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${FIELD} pr-[48px]`}
                required
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                aria-pressed={show}
                className="absolute top-1/2 right-[12px] -translate-y-1/2 cursor-pointer rounded-[4px] p-[4px] text-ink3 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-light"
              >
                <EyeIcon off={show} />
              </button>
            </div>

            {error && (
              <p role="alert" className="mt-[12px] text-[13px] text-[#bf2600]">
                {error}
              </p>
            )}
            {info && <p className="mt-[12px] text-[13px] text-green-700">{info}</p>}

            <button
              type="submit"
              disabled={busy || !email || !password || (mode === "up" && !name)}
              className="mt-[24px] flex h-[48px] w-full cursor-pointer items-center justify-center gap-[8px] rounded-[8px] bg-ed text-[15px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light disabled:cursor-default disabled:opacity-50"
            >
              {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
              {!busy && <span aria-hidden="true">→</span>}
            </button>

            <p className="mt-[16px] text-center text-[13px] text-ink3">
              {mode === "in" ? "New here? " : "Have an account? "}
              <button
                type="button"
                className="cursor-pointer text-accent-light hover:underline"
                onClick={() => {
                  setMode(mode === "in" ? "up" : "in");
                  setError("");
                  setInfo("");
                }}
              >
                {mode === "in" ? "Create a free account" : "Sign in"}
              </button>
            </p>
          </form>
          <p className="mt-[20px] text-center text-[13px] text-ink3">
            <Link href="/" className="hover:text-ink">
              Just exploring? Continue without an account →
            </Link>
          </p>
        </section>

        {/* Right: possibilities */}
        <section className="hidden space-y-[20px] lg:block" aria-label="The possibilities">
          <p className="font-mono text-[11px] tracking-[0.72px] text-ink3">03 / THE POSSIBILITIES</p>

          {/* Board */}
          <div className="rotate-[2deg] overflow-hidden rounded-[10px] bg-surface shadow-lg">
            <div className="h-[4px] bg-gradient-to-r from-[#00b8e6] to-[#9d00ff]" />
            <div className="p-[16px]">
              <p className="text-[15px] font-semibold text-ink">Launch, without the chaos.</p>
              <p className="mb-[10px] font-mono text-[10px] text-ink3">PROJECT BOARD</p>
              <div className="grid grid-cols-3 gap-[8px] text-[10px]">
                {[
                  ["TO DO", ["Design tokens", "Auth screens"]],
                  ["IN PROGRESS", ["Build editor", "Polish CSS"]],
                  ["DONE", ["Ship v1", "Celebrate"]],
                ].map(([title, cards]) => (
                  <div key={title as string} className="rounded-[6px] bg-sunken p-[6px]">
                    <p className="mb-[4px] text-[8px] text-ink3">{title as string}</p>
                    {(cards as string[]).map((c) => (
                      <p key={c} className="mb-[4px] rounded-[4px] bg-surface px-[6px] py-[4px] text-ink shadow-sm">
                        {c}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ID card */}
          <div className="flex overflow-hidden rounded-[10px] bg-surface shadow-lg">
            <div className="flex w-[84px] flex-col justify-between bg-ed p-[12px] text-edtext">
              <span className="text-[16px] font-bold text-white">AR</span>
              <span className="font-mono text-[9px] leading-[1.6]">DESIGN<br />BUILD<br />REPEAT</span>
            </div>
            <div className="flex-1 p-[16px]">
              <p className="text-[20px] font-bold text-ink">Alex Rivera</p>
              <p className="text-[13px] text-accent-light">Frontend developer</p>
              <div className="my-[10px] h-px bg-line" />
              <p className="font-mono text-[9px] text-ink3">EXPERIENCE</p>
              <p className="text-[13px] text-ink">Making the web feel human.</p>
              <p className="mt-[4px] text-[10px] text-ink3">2023 — now · Studio North</p>
            </div>
          </div>

          {/* Certificate */}
          <div className="-rotate-[2deg] rounded-[10px] border border-line bg-surface p-[16px] shadow-lg">
            <p className="font-mono text-[10px] text-[#9d00ff]">CERTIFICATE OF AWESOME</p>
            <p className="mt-[6px] text-[20px] font-bold text-ink">Alex Rivera</p>
            <p className="mt-[4px] text-[12px] text-ink3">For turning raw into remarkable.</p>
          </div>
        </section>
      </main>

      <footer className="mx-4 flex flex-col items-center justify-between gap-[8px] border-t border-line py-[20px] font-mono text-[12px] text-ink3 md:mx-[56px] md:flex-row">
        <span>CSV in. Possibilities out.</span>
        <span>Tables / Resumes / Boards / Certificates / ID cards</span>
        <span className="flex gap-[12px] font-sans">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/help">Help</Link>
        </span>
      </footer>
    </div>
  );
}