import { ChevronLeft, Search } from "lucide-react";

import { DataPlaceholder } from "@/components/DataPlaceholder";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { avatarUrl } from "@/lib/apiClient";
import { cn } from "@/lib/utils";

/**
 * The right column of Assignments: what the picked person holds, as a draft
 * the head edits and saves once.
 *
 * Branches and groups are a checklist; a region is a radio. Options come in
 * sections (a branch's group, a group's region). A branch another Account
 * Officer holds, or a group another Area Sales Head holds, shows who and cannot
 * be ticked -- one holder each is the model, and the API answers 409. The footer counts what changed and
 * holds Reset and Save; Save opens the page's confirm dialog.
 *
 *   tier / person
 *   saved         The person's holdings as the API has them, or null while loading.
 *   options       [{ code, name, section, note, holder }]
 *   draft         The codes ticked now.
 *   diff          { added, removed } between saved and draft.
 *   loading / error   The saved set and the options together.
 *   search / onSearchChange   Filters the options (shown when there are many).
 *   onToggle(code)   Multiple tiers.   onPick(code)   The region tier.
 *   onReset / onSave
 *   saveHint      Why Save is off, or null.
 *   onBack        Phones only: back to the list.
 */
const SEARCH_FROM = 8;

export function AssignmentEditor({
  tier,
  person,
  saved,
  options = [],
  draft = [],
  diff,
  loading = false,
  error = null,
  search,
  onSearchChange,
  onToggle,
  onPick,
  onReset,
  onSave,
  saveHint = null,
  onBack,
  className,
}) {
  if (!person) {
    return (
      <Card className={cn("items-center justify-center py-16 text-center", className)}>
        <span className="text-xs text-muted-foreground">Pick a {tier.person} to see what they cover.</span>
      </Card>
    );
  }

  const ticked = new Set(draft.map(String));
  const isDirty = diff.added.length > 0 || diff.removed.length > 0;
  const query = search.trim().toLowerCase();
  const shown = query
    ? options.filter((option) => `${option.name} ${option.section ?? ""}`.toLowerCase().includes(query))
    : options;
  const sections = groupBySection(shown);

  return (
    <Card className={cn("min-h-0 gap-0 overflow-hidden py-0", className)}>
      <CardHeader className="gap-3 border-b py-4 [.border-b]:pb-4">
        {onBack ? (
          <Button variant="ghost" size="xs" onClick={onBack} className="-ml-2 w-fit text-muted-foreground lg:hidden">
            <ChevronLeft data-icon="inline-start" />
            {tier.people}
          </Button>
        ) : null}
        <div className="flex items-center gap-3">
          <UserAvatar src={avatarUrl(person.photo)} name={person.fullName} size="lg" />
          <div className="min-w-0">
            <CardTitle className="truncate">{person.fullName ?? person.userCode}</CardTitle>
            <CardDescription className="truncate text-xs">
              {person.userCode} · {tier.person}
            </CardDescription>
          </div>
        </div>
        {/* What they hold now, as the API has it. */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">Holds</span>
          {saved == null ? (
            <span className="text-[10px] text-muted-foreground">…</span>
          ) : saved.items.length ? (
            saved.items.map((item) => (
              <Badge key={item.code} variant="secondary" className="text-[10px]">
                {item.name}
              </Badge>
            ))
          ) : (
            <Badge className="bg-amber-500/10 text-[10px] text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
              {saved.straddles ? "Groups across regions" : `No ${tier.multiple ? tier.units : tier.unit} yet`}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col px-0">
        {loading || error ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <DataPlaceholder
              loading={loading}
              error={error}
              loadingLabel={`Loading ${tier.units}...`}
              className="text-xs"
            />
          </div>
        ) : options.length === 0 ? (
          <p className="px-6 py-12 text-center text-xs text-muted-foreground">
            You have no {tier.units} to give out.
          </p>
        ) : (
          <>
            {options.length > SEARCH_FROM ? (
              <div className="px-6 pt-4">
                <div className="relative">
                  <Search
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    type="search"
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder={`Search ${tier.units}`}
                    aria-label={`Search ${tier.units}`}
                    className="pl-8 text-xs md:text-xs"
                  />
                </div>
              </div>
            ) : null}

            <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]]:max-h-[30rem]">
              <div className="flex flex-col gap-4 px-6 py-4">
                {shown.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    No {tier.units} match “{search.trim()}”.
                  </p>
                ) : tier.multiple ? (
                  sections.map(([section, items]) => (
                    <fieldset key={section} className="flex flex-col gap-1">
                      <legend className="mb-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                        {section}
                      </legend>
                      {items.map((option) => {
                        const heldByOther = Boolean(option.holder) && option.holder !== person.userCode;
                        return (
                          <label
                            key={option.code}
                            className={cn(
                              "flex items-center gap-3 rounded-md px-2 py-2 transition-colors",
                              heldByOther ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted/50",
                            )}
                          >
                            <Checkbox
                              checked={ticked.has(String(option.code))}
                              onCheckedChange={() => onToggle(option.code)}
                              disabled={heldByOther}
                            />
                            <span className="flex min-w-0 flex-1 flex-col">
                              <span className="truncate text-xs font-medium">{option.name}</span>
                              {option.note ? (
                                <span className="truncate text-[10px] text-muted-foreground">{option.note}</span>
                              ) : null}
                            </span>
                            {heldByOther ? (
                              <span className="shrink-0 text-[10px] text-muted-foreground">
                                Held by {option.holder}
                              </span>
                            ) : null}
                          </label>
                        );
                      })}
                    </fieldset>
                  ))
                ) : (
                  <RadioGroup
                    value={draft[0] != null ? String(draft[0]) : ""}
                    onValueChange={(value) => onPick(Number(value))}
                    className="gap-2"
                  >
                    {shown.map((option) => (
                      <label
                        key={option.code}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50 has-data-checked:border-primary has-data-checked:bg-muted/40"
                      >
                        <RadioGroupItem value={String(option.code)} />
                        <span className="text-xs font-medium">{option.name}</span>
                        {option.note ? (
                          <span className="ml-auto text-[10px] text-muted-foreground">{option.note}</span>
                        ) : null}
                      </label>
                    ))}
                  </RadioGroup>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>

      {/* Counts what changed, then Reset and Save. The grey band like every
          other card footer here. */}
      <CardFooter className="flex-col items-stretch gap-2 border-t bg-muted/50 py-3 sm:flex-row sm:items-center sm:justify-between [.border-t]:pt-3">
        <span className="text-xs text-muted-foreground tabular-nums">
          {saveHint ??
            (isDirty ? `${diff.added.length} added · ${diff.removed.length} removed` : "No changes")}
        </span>
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onReset} disabled={!isDirty} className="text-xs">
            Reset
          </Button>
          <Button size="sm" onClick={onSave} disabled={!isDirty || Boolean(saveHint)} className="text-xs">
            Save
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

/** [[section, options], ...] in first-seen order. */
function groupBySection(options) {
  const sections = new Map();
  for (const option of options) {
    const key = option.section ?? "Other";
    if (!sections.has(key)) sections.set(key, []);
    sections.get(key).push(option);
  }
  return [...sections.entries()];
}
