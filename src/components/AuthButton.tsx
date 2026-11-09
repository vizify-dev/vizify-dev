"use client";

import {
  Dialog,
  DialogDescription,
  DialogPanel,
  DialogTitle,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { useState } from "react";
import Button from "@/components/Button";
import { authClient } from "@/lib/auth-client";
import { ChevronDownIcon, GoogleIcon } from "@/components/Icons";

const INPUT =
  "h-[40px] w-full rounded-[8px] border border-line px-[12px] text-[14px] text-ink focus-visible:outline-2 focus-visible:outline-accent-light";

type AuthButtonProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialMode?: "in" | "up";
  initialShowSignupForm?: boolean;
  onSignOut?: () => void;
};

export default function AuthButton({
  open: controlledOpen,
  onOpenChange,
  initialMode = "in",
  initialShowSignupForm,
  onSignOut,
}: AuthButtonProps = {}) {
  const { data: session } = authClient.useSession();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (nextOpen: boolean) => {
    setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };
  const [mode, setMode] = useState<"in" | "up">(initialMode);
  const [showSignupForm, setShowSignupForm] = useState(
    initialShowSignupForm ?? initialMode !== "up",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (session) {
    const { name, email, image } = session.user;
    const initial = (name || email).charAt(0).toUpperCase();
    return (
      <Menu>
        <MenuButton className="group flex h-[40px] cursor-pointer items-center gap-[8px] rounded-[8px] px-[6px] transition-colors hover:bg-sunken data-open:bg-sunken focus-visible:outline-2 focus-visible:outline-accent-light">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" referrerPolicy="no-referrer" className="size-[28px] rounded-full object-cover" />
          ) : (
            <span className="flex size-[28px] items-center justify-center rounded-full bg-accent-light text-[13px] font-semibold text-ed">
              {initial}
            </span>
          )}
          <span className="hidden max-w-[120px] truncate text-[14px] font-semibold text-ink 2xl:inline">
            {name || email}
          </span>
          <ChevronDownIcon className="size-[14px] text-ink3 transition-transform group-data-open:rotate-180" />
        </MenuButton>
        <MenuItems
          anchor="bottom end"
          transition
          className="z-50 w-[240px] rounded-[12px] border border-line bg-surface p-[6px] shadow-xl [--anchor-gap:6px] focus:outline-none transition duration-100 ease-out data-closed:scale-95 data-closed:opacity-0"
        >
          <div className="px-[10px] py-[8px]">
            <p className="truncate text-[14px] font-semibold text-ink">{name}</p>
            <p className="truncate text-[12px] text-ink3">{email}</p>
          </div>
          <div className="mx-[4px] my-[6px] h-px bg-line" />
          <MenuItem>
            <button
              type="button"
              onClick={() => {
                if (onSignOut) onSignOut();
                else void authClient.signOut();
              }}
              className="flex w-full cursor-pointer items-center rounded-[8px] px-[10px] py-[8px] text-left text-[14px] font-semibold text-ink data-focus:bg-sunken"
            >
              Sign out
            </button>
          </MenuItem>
        </MenuItems>
      </Menu>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res =
      mode === "in"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ name: name || email.split("@")[0], email, password });
    setBusy(false);
    if (res.error) setError(res.error.message ?? "Something went wrong");
    else setOpen(false);
  }

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => {
          setMode("in");
          setShowSignupForm(true);
          setError("");
          setOpen(true);
        }}
      >
        Sign in
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-[2px]" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-[16px]">
          <DialogPanel
            className={`relative flex max-h-[calc(100dvh-32px)] w-full flex-col overflow-y-auto rounded-[16px] border border-line bg-surface p-[24px] text-ink shadow-2xl sm:p-[32px] ${
              mode === "up" && !showSignupForm
                ? "max-w-[480px]"
                : "max-w-[400px] gap-[12px]"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close dialog"
              className="absolute right-[12px] top-[12px] flex size-[32px] cursor-pointer items-center justify-center rounded-full text-ink3 transition-colors hover:bg-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-light"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-[16px]" aria-hidden="true">
                <path d="m4 4 8 8M12 4l-8 8" />
              </svg>
            </button>
            {mode === "up" && !showSignupForm ? (
              <>
                <div className="mb-[16px] flex justify-center">
                  <div className="flex size-[48px] items-center justify-center rounded-[14px] bg-accent-light/15 text-[#0098c4]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-[24px]" aria-hidden="true">
                      <path d="m15 4 5 5M4 20l5.5-1.5L20 8l-4-4L5.5 15.5 4 20Z" />
                      <path d="m4 4 .7 2.3L7 7l-2.3.7L4 10l-.7-2.3L1 7l2.3-.7L4 4ZM19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14Z" />
                    </svg>
                  </div>
                </div>
                <DialogTitle className="text-center text-[20px] font-semibold tracking-[-0.3px] text-ink">
                  Make this design yours
                </DialogTitle>
                <DialogDescription className="mt-[8px] text-center text-[14px] leading-[1.5] text-ink3">
                  Create a free Vizify account to edit, customize, and save your designs.
                </DialogDescription>
                <ul className="mt-[20px] flex flex-col gap-[10px] rounded-[12px] bg-sunken p-[14px] text-[14px] text-ink">
                  {["Edit text and data", "Customize fonts and colors", "Save projects to your account"].map((benefit) => (
                    <li key={benefit} className="flex items-center gap-[10px]">
                      <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#21c77a] text-white">
                        <svg viewBox="0 0 16 16" fill="none" className="size-[12px]" aria-hidden="true">
                          <path d="m3.5 8 3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      {benefit}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="primary"
                  className="mt-[18px] w-full"
                  onClick={() => setShowSignupForm(true)}
                >
                  Create free account
                </Button>
                <p className="mt-[14px] text-center text-[13px] text-ink3">
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="cursor-pointer font-semibold text-ink underline decoration-line underline-offset-2 hover:text-[#0098c4]"
                    onClick={() => {
                      setMode("in");
                      setShowSignupForm(true);
                      setError("");
                    }}
                  >
                    Sign in
                  </button>
                </p>
              </>
            ) : (
              <>
                <DialogTitle className="text-[16px] font-semibold text-ink">
                  {mode === "in" ? "Sign in" : "Create your free account"}
                </DialogTitle>
                <form onSubmit={submit} className="flex flex-col gap-[10px]">
                  {mode === "up" && (
                    <input className={INPUT} placeholder="Name" required value={name} onChange={(e) => setName(e.target.value)} />
                  )}
                  <input className={INPUT} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <input className={INPUT} type="password" required minLength={8} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  {error && <p className="text-[12px] text-red-600">{error}</p>}
                  <Button type="submit" variant="primary" disabled={busy}>
                    {mode === "in" ? "Sign in" : "Create free account"}
                  </Button>
                </form>
                <div className="text-center text-[12px] text-ink3">or continue with</div>
                <Button onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/" })}>
                  <GoogleIcon />
                  Continue with Google
                </Button>
                <button
                  type="button"
                  className="text-[12px] text-ink3 hover:text-ink"
                  onClick={() => {
                    setMode(mode === "in" ? "up" : "in");
                    setShowSignupForm(true);
                    setError("");
                  }}
                >
                  {mode === "in" ? "No account? Sign up" : "Already have an account? Sign in"}
                </button>
              </>
            )}
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}