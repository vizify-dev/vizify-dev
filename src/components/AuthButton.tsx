"use client";

import { useState, type FormEvent } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import type { User } from "@supabase/supabase-js";
import Button from "@/components/Button";
import { createClient } from "@/lib/supabase/client";

const INPUT =
  "h-[40px] w-full rounded-[8px] border border-line bg-surface px-[12px] text-[14px] text-ink outline-none focus-visible:outline-2 focus-visible:outline-[#0098c4]";

export default function AuthButton({ user, onSignOut }: { user: User | null; onSignOut: () => void }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    return (
      <div className="flex items-center gap-[8px]">
        <span className="hidden max-w-[160px] truncate text-[13px] text-ink3 lg:block">{user.email}</span>
        <Button
          variant="ghost"
          onClick={async () => {
            await supabase.auth.signOut();
            onSignOut();
          }}
        >
          Sign out
        </Button>
      </div>
    );
  }

  async function google() {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  }

  async function submit(e: FormEvent) {
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
      else if (data.session) setOpen(false);
      else setInfo("Check your email to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else setOpen(false);
    }
    setBusy(false);
  }

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>Sign in</Button>
      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-[16px]">
          <DialogPanel className="w-full max-w-[380px] rounded-[12px] bg-surface p-[24px] shadow-xl">
            <DialogTitle className="mb-[16px] text-[18px] font-semibold text-ink">
              {mode === "in" ? "Sign in to Vizify" : "Create your account"}
            </DialogTitle>

            <Button className="w-full" onClick={google}>Continue with Google</Button>
            <div className="my-[16px] flex items-center gap-[8px] text-[12px] text-ink3">
              <div className="h-px flex-1 bg-line" /> or <div className="h-px flex-1 bg-line" />
            </div>

            <form onSubmit={submit} className="flex flex-col gap-[10px]">
              {mode === "up" && (
                <input className={INPUT} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
              )}
              <input className={INPUT} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input className={INPUT} type="password" placeholder="Password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} required />
              {error && <p className="text-[13px] text-red-600">{error}</p>}
              {info && <p className="text-[13px] text-green-700">{info}</p>}
              <Button type="submit" variant="primary" disabled={busy}>
                {mode === "in" ? "Sign in" : "Sign up"}
              </Button>
            </form>

            <button
              type="button"
              className="mt-[12px] w-full text-center text-[13px] text-ink3 hover:text-ink"
              onClick={() => { setMode(mode === "in" ? "up" : "in"); setError(""); setInfo(""); }}
            >
              {mode === "in" ? "No account? Sign up" : "Have an account? Sign in"}
            </button>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}