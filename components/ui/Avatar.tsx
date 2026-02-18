"use client";

function getInitials(displayName: string | null, email: string): string {
  if (displayName?.trim()) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "?";
}

interface AvatarProps {
  photoURL: string | null;
  displayName?: string | null;
  email?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-20 h-20 text-2xl",
  xl: "w-24 h-24 text-3xl",
};

export function Avatar({
  photoURL,
  displayName = null,
  email = "",
  size = "md",
  className = "",
}: AvatarProps) {
  const sizeClass = sizeClasses[size];

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt=""
        className={`rounded-full object-cover shrink-0 ${sizeClass} ${className}`}
      />
    );
  }

  const initials = getInitials(displayName ?? null, email);

  return (
    <div
      className={`rounded-full bg-white/20 flex items-center justify-center font-medium text-white shrink-0 ${sizeClass} ${className}`}
      aria-hidden
    >
      {initials}
    </div>
  );
}
