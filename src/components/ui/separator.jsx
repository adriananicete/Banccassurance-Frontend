import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";

import { cn } from "@/lib/utils";

/**
 * shadcn/ui -- separator (base-nova), from `npx shadcn@latest add separator
 * --view`. Written by hand because the CLI wanted to install an npm package
 * named `cn` for the import; JSX instead of TSX, every class is upstream's.
 */
function Separator({ className, orientation = "horizontal", ...props }) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
