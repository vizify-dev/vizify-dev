"use client";

import {
  Dialog,
  DialogPanel,
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

export default function AuthButton() {
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"in" | "up">("in");
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
          <span className="hidden max-w-[120px] truncate text-[14px] font-semibold text-ink lg:block">
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
              onClick={() => authClient.signOut()}
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
      <Button variant="ghost" onClick={() => setOpen(true)}>Sign in</Button>
      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-[16px]">
          <DialogPanel className="flex w-full max-w-[360px] flex-col gap-[12px] rounded-[12px] bg-surface p-[20px] shadow-xl">
            <h2 className="text-[16px] font-semibold text-ink">
              {mode === "in" ? "Sign in" : "Create account"}
            </h2>
            <Button onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/" })}>
  <GoogleIcon />
  Continue with Google
</Button>
            <div className="text-center text-[12px] text-ink3">or</div>
            <form onSubmit={submit} className="flex flex-col gap-[10px]">
              {mode === "up" && (
                <input className={INPUT} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              )}
              <input className={INPUT} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className={INPUT} type="password" required minLength={8} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              {error && <p className="text-[12px] text-red-600">{error}</p>}
              <Button type="submit" variant="primary" disabled={busy}>
                {mode === "in" ? "Sign in" : "Sign up"}
              </Button>
            </form>
            <button
              type="button"
              className="text-[12px] text-ink3 hover:text-ink"
              onClick={() => { setMode(mode === "in" ? "up" : "in"); setError(""); }}
            >
              {mode === "in" ? "No account? Sign up" : "Have an account? Sign in"}
            </button>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}