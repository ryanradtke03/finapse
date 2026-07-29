interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Curated palette so colors stay intentional (no muddy random HSL)
const PALETTE = [
  "#2E7D32", // green — matches your reference screenshot
  "#1565C0", // blue
  "#6A1B9A", // purple
  "#C62828", // red
  "#EF6C00", // orange
  "#00838F", // teal
  "#4527A0", // deep purple
  "#AD1457", // pink
];

const SIZE_MAP: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "w-8 h-8 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0; // force 32-bit int
  }
  return Math.abs(hash);
}

function getColor(name: string): string {
  return PALETTE[hashString(name) % PALETTE.length];
}

export function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  const initials = getInitials(name);
  const bgColor = getColor(name);

  return (
    <div
      className={`flex items-center justify-center shrink-0 rounded-full font-semibold text-white ${SIZE_MAP[size]} ${className}`}
      style={{ backgroundColor: bgColor }}
      title={name}
    >
      {initials}
    </div>
  );
}
