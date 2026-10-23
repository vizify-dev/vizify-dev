import type { SVGProps } from "react";

/** 16px stroke icons that inherit `currentColor`, so Tailwind text-* classes recolor them. */
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const ChevronDownIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M3.5 6 8 10.5 12.5 6" />
  </Icon>
);

export const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="m3.5 8.5 3 3 6-7" />
  </Icon>
);

export const UploadIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M8 10.5V2.5M4.5 6 8 2.5 11.5 6M2.5 10v3a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3" />
  </Icon>
);

export const SaveIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M3 2.5h7.5l2.5 2.5v8a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5ZM5 2.5V6h5V2.5M5 13.5V9.5h6v4" />
  </Icon>
);

export const CopyIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M5.5 5.5h7a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5V6a.5.5 0 0 1 .5-.5ZM3 10.5v-8a.5.5 0 0 1 .5-.5h7" />
  </Icon>
);
