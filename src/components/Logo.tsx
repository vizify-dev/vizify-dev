/* eslint-disable @next/next/no-img-element */
import markA from "@/assets/icons/logo-mark-a.svg";
import markB from "@/assets/icons/logo-mark-b.svg";

/** viz|ify|.dev wordmark with the logo mark, per the Figma Brand frame. */
export default function Logo() {
  return (
    <div className="flex shrink-0 items-center gap-[10px]">
      <div className="relative size-[28px] shrink-0 overflow-clip bg-surface">
        <div className="absolute inset-[15%_7.5%_11.25%_7.5%]">
          <div className="absolute inset-[-5.09%_-4.41%_-5.08%_-4.41%]">
            <img alt="" className="block size-full max-w-none" src={markA.src} />
          </div>
        </div>
        <div className="absolute inset-[18%_60.5%_63%_18%]">
          <img alt="" className="absolute inset-0 block size-full max-w-none" src={markB.src} />
        </div>
      </div>
      <div className="flex items-end whitespace-nowrap font-bold leading-[normal]">
        <span className="text-[21px] tracking-[-0.42px] text-[#1f2837]">viz</span>
        <span className="bg-gradient-to-r from-[#00b8e6] to-[#9d00ff] bg-clip-text text-[21px] tracking-[-0.42px] text-transparent">
          ify
        </span>
        <span className="text-[12px] font-medium text-[#0098c4]">.dev</span>
      </div>
    </div>
  );
}
