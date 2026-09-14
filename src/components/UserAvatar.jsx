import { useState } from "react";
import { UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

const SIZES = {
  xs: "size-5 text-[9px]",
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
};

function initialsOf(name) {
  return String(name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/**
 * A person's picture, everywhere a person is shown.
 *
 *   src   An absolute URL, or null. Build it with `avatarUrl(photo)` from
 *         lib/apiClient.js in the container -- uploads sit outside /api/v1.
 *   name  Used for the initials fallback and the alt text. Null means there
 *         is nobody (an unassigned seat), and renders a muted person icon.
 *   size  xs | sm | md | lg.
 *
 * Falls back to initials when there is no src AND when the image fails to
 * load -- a missing upload should not leave a broken-image icon. The failure
 * is remembered per src, so a new src gets a fresh attempt.
 */
export function UserAvatar({ src, name, size = "sm", className }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = Boolean(src) && failedSrc !== src;
  const initials = initialsOf(name);

  const base = cn(
    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-muted-foreground",
    SIZES[size],
    className,
  );

  if (showImage) {
    return (
      <img
        src={src}
        alt={name ?? ""}
        onError={() => setFailedSrc(src)}
        className={cn(base, "object-cover")}
      />
    );
  }

  return (
    <span aria-hidden className={base}>
      {initials || <UserRound className="size-3/5" />}
    </span>
  );
}
