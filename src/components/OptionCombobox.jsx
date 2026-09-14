import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

/**
 * A dropdown of fixed options, on shadcn's Combobox -- Adrian's pick for every
 * dropdown in the app (2026-09-14), in place of a native <select>.
 *
 *   options   [{ value, label }]. `value` may be any type; it is compared with ===.
 *   value     The current `value`, or null.
 *   onChange  (value) => void. Not called when the input is cleared, so a
 *             dropdown that must always hold a choice keeps it.
 *   label     REQUIRED. The accessible name -- there is no visible label.
 *   className Passed to the input group; set the width here.
 *
 * Typing filters the list, which is what makes it a combobox. The input shows
 * the chosen option's label when closed.
 */
export function OptionCombobox({
  options,
  value,
  onChange,
  label,
  placeholder = "Select…",
  emptyText = "No matches.",
  className,
}) {
  const selected = options.find((option) => option.value === value) ?? null;

  return (
    <Combobox
      items={options}
      value={selected}
      onValueChange={(option) => {
        if (option) onChange(option.value);
      }}
      itemToStringLabel={(option) => option.label}
      isItemEqualToValue={(option, current) => option.value === current?.value}
    >
      <ComboboxInput
        aria-label={label}
        placeholder={placeholder}
        className={cn("[&_input]:text-xs", className)}
      />
      <ComboboxContent>
        <ComboboxEmpty className="text-xs">{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(option) => (
            <ComboboxItem key={String(option.value)} value={option} className="text-xs">
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
