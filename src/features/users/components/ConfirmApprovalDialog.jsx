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

import { APPROVAL_CONFIRM } from "../approvalsUtils";

/**
 * The confirm before approve, reject or deactivate (FRONTEND_DESIGN_PATTERN.md
 * §9) -- shadcn's AlertDialog, base-nova.
 *
 *   target        { row, action } or null. Null closes the dialog.
 *   submitting    Disables both buttons and swaps the label while in flight.
 *   error         The backend's own message, shown as-is under the description.
 *   onConfirm / onClose
 *
 * The dialog cannot be dismissed while the request is in flight, so a
 * half-sent approval never looks cancelled.
 */
export function ConfirmApprovalDialog({ target, submitting = false, error = null, onConfirm, onClose }) {
  const copy = target ? APPROVAL_CONFIRM[target.action] : null;
  const name = target?.row.fullName ?? target?.row.userCode ?? "this account";

  return (
    <AlertDialog
      open={Boolean(target)}
      onOpenChange={(open) => {
        if (!open && !submitting) onClose();
      }}
    >
      {copy ? (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.title(name)}</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">{copy.description}</AlertDialogDescription>
          </AlertDialogHeader>

          {error ? (
            <p role="alert" className="text-xs text-destructive">
              {error.message}
            </p>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting} className="text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant={copy.destructive ? "destructive" : "default"}
              disabled={submitting}
              onClick={onConfirm}
              className="text-xs"
            >
              {submitting ? copy.pendingLabel : copy.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      ) : null}
    </AlertDialog>
  );
}
