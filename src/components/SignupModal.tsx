"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import Button from "@/components/Button";
import { CheckIcon } from "@/components/Icons";

const PERKS = ["Save projects to your account", "Customize your designs", "Pick up where you left off"];

export default function SignupModal({
  open,
  onClose,
  onSignup,
  onSignin,
}: {
  open: boolean;
  onClose: () => void;
  onSignup: () => void;
  onSignin: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/40 transition duration-150 data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex items-center justify-center p-[16px]">
        <DialogPanel
          transition
          className="w-full max-w-[420px] rounded-[16px] bg-surface p-[24px] shadow-xl transition duration-150 data-closed:scale-95 data-closed:opacity-0"
        >
          <DialogTitle className="text-[20px] font-bold text-ink">Make this design yours</DialogTitle>
          <p className="mt-[6px] text-[14px] text-ink3">
            Create a free Vizify account to save and customize your designs. Pro themes require a Pro plan.
          </p>
          <ul className="mt-[16px] flex flex-col gap-[8px]">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-[8px] text-[14px] text-ink">
                <CheckIcon className="size-[16px] text-accent-light" />
                {perk}
              </li>
            ))}
          </ul>
          <Button variant="primary" className="mt-[20px] w-full" onClick={onSignup}>
            Create free account
          </Button>
          <button
            type="button"
            onClick={onSignin}
            className="mt-[12px] w-full cursor-pointer text-center text-[13px] text-ink3 hover:text-ink"
          >
            Already have an account? <span className="font-semibold">Sign in</span>
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
