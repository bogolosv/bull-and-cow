import styles from "./mascot.module.css";

export function Mascot({
  kind = "bull",
  ghost = false,
  size = "fill",
}: {
  kind?: "bull" | "cow";
  ghost?: boolean;
  size?: "fill" | "medium";
}) {
  return (
    <svg
      data-size={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      className={[styles.mascot, ghost ? styles.ghost : ""].join(" ")}
    >
      <path
        d="M29 34C15 33 12 19 19 14C20 24 26 22 33 26M71 34C85 33 88 19 81 14C80 24 74 22 67 26"
        fill={
          kind === "bull"
            ? "var(--color-bull-horn)"
            : "var(--color-accent-soft)"
        }
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M25 42C9 35 7 48 23 53M75 42C91 35 93 48 77 53"
        fill={
          kind === "bull" ? "var(--color-bull-body)" : "var(--color-cow-muzzle)"
        }
        stroke="currentColor"
        strokeWidth="3"
      />
      <rect
        x="24"
        y="25"
        width="52"
        height="58"
        rx="24"
        fill={
          kind === "bull" ? "var(--color-bull-body)" : "var(--color-cow-body)"
        }
        stroke="currentColor"
        strokeWidth="3"
      />
      {kind === "cow" && (
        <path
          d="M28 38C32 26 48 27 49 38C51 51 29 53 28 38Z"
          fill="var(--color-cow-patch)"
        />
      )}
      <path
        d="M41 26L46 20L51 25L57 20L60 28"
        fill={
          kind === "bull" ? "var(--color-bull-body)" : "var(--color-cow-body)"
        }
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M37 48V53M63 48V53"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect
        x="29"
        y="58"
        width="42"
        height="25"
        rx="12.5"
        fill={
          kind === "bull"
            ? "var(--color-bull-muzzle)"
            : "var(--color-cow-muzzle)"
        }
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M40 67V70M60 67V70"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M46 76Q50 79 54 76"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
