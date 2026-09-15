import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * The confirm before a save (FRONTEND_DESIGN_PATTERN.md §9). It lists what is
 * added and removed by name, and says the save replaces what they hold. A
 * refusal shows in the backend's words; the dialog cannot close mid-save.
 *
 *   open / tier / name
 *   added / removed   Option names.
 *   saving / error
 *   onConfirm / onClose
 */
export function ConfirmSaveDialog({ open, tier, name, added = [], removed = [], saving = false, error = null, onConfirm, onClose }) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !saving) onClose();
      }}
    >
      {open ? (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Save {name}'s {tier.multiple ? tier.units : tier.unit}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This replaces what they hold with the list below.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-2 text-xs">
            {added.length ? <ChangeLine label="Adding" names={added} className="text-[#00996a] dark:text-[#00bb7c]" /> : null}
            {removed.length ? <ChangeLine label="Removing" names={removed} className="text-destructive" /> : null}
          </div>

          {error ? (
            <p role="alert" className="text-xs text-destructive">
              {error.message}
            </p>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving} className="text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction disabled={saving} onClick={onConfirm} className="text-xs">
              {saving ? "Saving…" : "Save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      ) : null}
    </AlertDialog>
  );
}

function ChangeLine({ label, names, className }) {
  return (
    <p>
      <span className={className}>{label}</span> <span className="text-muted-foreground">{names.join(", ")}</span>
    </p>
  );
}

/**
 * Asked when another person is picked while the current one has unsaved
 * changes. Keep editing is the safe default.
 */
export function DiscardChangesDialog({ open, name, onDiscard, onKeep }) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onKeep();
      }}
    >
      {open ? (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard your changes to {name}?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              They have not been saved. Nothing they hold has changed yet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Keep editing</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onDiscard} className="text-xs">
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      ) : null}
    </AlertDialog>
  );
}
