import { cn } from "@/lib/utils";

/**
 * shadcn/ui -- skeleton (base-nova), from `npx shadcn@latest add skeleton --view`.
 * Written by hand because the CLI wanted to install an npm package named `cn`
 * for the import; every class is upstream's.
 */
function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
