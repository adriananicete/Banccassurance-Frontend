import { useState } from 'react'

import { NotBuiltYet } from '@/app/NotBuiltYet'
import { useAuth } from '@/features/auth/AuthContext'
import { useGroups, useRegions } from '@/features/lookups/hooks'

import { ConfirmSaveDialog, DiscardChangesDialog } from '../components/AssignmentDialogs'
import { AssignmentEditor } from '../components/AssignmentEditor'
import { AssignmentsView } from '../components/AssignmentsView'
import { PeopleCard } from '../components/PeopleCard'
import {
  ASSIGNMENT_KIND,
  ASSIGNMENT_TIERS,
  PEOPLE_FILTER,
  diffCodes,
  notifySaved,
} from '../assignmentsUtils'
import {
  useAssignableBranches,
  useAssignmentPeople,
  useHoldings,
  useSaveHoldings,
} from '../hooks'

/**
 * /assignments -- a PhilLife head gives the tier below them what they cover.
 * Master-detail (Adrian, 2026-09-15): pick a person, tick what they should
 * hold, save once. The plan is in context/DECISIONS.md.
 *
 * The superadmin can assign all three tiers but is not in this version, so
 * they keep the scaffold.
 */
export function AssignmentsPage() {
  const { user } = useAuth()
  const tier = ASSIGNMENT_TIERS[user?.role]

  if (!tier) {
    return (
      <NotBuiltYet
        title="Assignments"
        note="Built for the Area Sales Head, Regional Sales Head and Department Head. The superadmin's view -- every tier, with a group picker -- is not built yet."
        endpoints={[
          'GET · PUT /users/:userId/branches',
          'GET · PUT /users/:userId/groups',
          'GET · PUT /users/:userId/region',
          'GET /users/assignable-branches',
        ]}
      />
    )
  }

  // Keyed on the role, so a different tier never inherits another's draft.
  return <TierAssignments key={user.role} tier={tier} user={user} />
}

function holdsNothing(person) {
  return Boolean(person.holdings) && person.holdings.codes.length === 0 && !person.holdings.straddles
}

function TierAssignments({ tier, user }) {
  const { people, loading, error } = useAssignmentPeople(tier)

  const [filter, setFilter] = useState(PEOPLE_FILTER.ALL)
  const [search, setSearch] = useState('')
  const [optionSearch, setOptionSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  // { userId, codes } -- the ticks not saved yet, for one person.
  const [draft, setDraft] = useState(null)
  const [pendingPerson, setPendingPerson] = useState(null)
  const [confirming, setConfirming] = useState(false)
  // Phones show the list or the editor, not both.
  const [showEditorOnPhone, setShowEditorOnPhone] = useState(false)

  // The choices this head can give out.
  const assignable = useAssignableBranches({ enabled: tier.kind === ASSIGNMENT_KIND.BRANCHES })
  const regions = useRegions({ enabled: tier.kind === ASSIGNMENT_KIND.REGION })
  // `/lookups/groups` carries each group's region (R7), for "NCR · 3 groups".
  const groups = useGroups({ enabled: tier.kind === ASSIGNMENT_KIND.REGION })

  // A group has at most one Area Sales Head (F9): a group another area head in
  // the list holds is shown with their code and cannot be ticked. The PUT's
  // 409 still covers a holder outside this list.
  const groupHolders = new Map()
  if (tier.kind === ASSIGNMENT_KIND.GROUPS) {
    for (const person of people) {
      for (const code of person.holdings?.codes ?? []) groupHolders.set(String(code), person.userCode)
    }
  }

  const allOptions =
    tier.kind === ASSIGNMENT_KIND.BRANCHES
      ? (assignable.data ?? [])
      : tier.kind === ASSIGNMENT_KIND.GROUPS
        ? (user.scopes ?? [])
            .filter((scope) => scope.level === 'GROUP')
            .map((scope) => {
              const code = scope.groupCode ?? scope.code
              return {
                code,
                name: scope.groupName ?? scope.name,
                section: scope.regionName ?? 'Your groups',
                holder: groupHolders.get(String(code)) ?? null,
              }
            })
        : (regions.data ?? []).map((region) => {
            const count = groups.data?.filter((group) => String(group.RegionCode) === String(region.RegionCode)).length
            return {
              code: region.RegionCode,
              name: region.RegionName,
              note: count != null ? `${count} group${count === 1 ? '' : 's'}` : null,
            }
          })
  const optionsQuery = tier.kind === ASSIGNMENT_KIND.BRANCHES ? assignable : tier.kind === ASSIGNMENT_KIND.REGION ? regions : null

  // The list: nothing-held first, then by name; filtered by the tiles and the search.
  const query = search.trim().toLowerCase()
  const visible = [...people]
    .sort(
      (a, b) =>
        Number(holdsNothing(b)) - Number(holdsNothing(a)) ||
        String(a.fullName ?? a.userCode).localeCompare(String(b.fullName ?? b.userCode)),
    )
    .filter((person) => {
      if (filter === PEOPLE_FILTER.NONE && !holdsNothing(person)) return false
      if (filter === PEOPLE_FILTER.ASSIGNED && (!person.holdings || holdsNothing(person))) return false
      if (!query) return true
      return `${person.fullName ?? ''} ${person.userCode ?? ''}`.toLowerCase().includes(query)
    })

  // The picked person, else the first in the list.
  const selected = people.find((person) => person.userId === selectedId) ?? visible[0] ?? null

  const savedQuery = useHoldings(tier.kind, selected?.userId)
  const saved = savedQuery.data ?? null
  const draftCodes = draft && draft.userId === selected?.userId ? draft.codes : (saved?.codes ?? [])
  const diff = diffCodes(saved?.codes ?? [], draftCodes)
  const isDirty = diff.added.length > 0 || diff.removed.length > 0

  // An Account Officer's branches must sit in their own group; when the
  // approvals row says which group, only that group's branches are offered.
  const options =
    tier.kind === ASSIGNMENT_KIND.BRANCHES && selected?.groupCode != null
      ? allOptions.filter((option) => String(option.groupCode) === String(selected?.groupCode))
      : allOptions

  const saveHint =
    isDirty && !tier.allowEmpty && draftCodes.length === 0
      ? `Pick at least one ${tier.unit} -- they cannot be left with none`
      : null

  const save = useSaveHoldings(tier.kind, tier.personRole)

  const openPerson = (person) => {
    setSelectedId(person.userId)
    setDraft(null)
    setOptionSearch('')
    setShowEditorOnPhone(true)
  }

  const pickPerson = (person) => {
    if (isDirty && person.userId !== selected?.userId) setPendingPerson(person)
    else openPerson(person)
  }

  // Every handler reads `selected` with `?.`: the React Compiler reads the
  // values a callback closes over while rendering, and `selected` is null
  // while the list loads or when there is nobody to assign -- a bare
  // `selected.userId` crashed the page for the Department Head (2026-09-15).
  const toggle = (code) => {
    if (!selected) return
    const has = draftCodes.some((value) => String(value) === String(code))
    setDraft({
      userId: selected?.userId,
      codes: has ? draftCodes.filter((value) => String(value) !== String(code)) : [...draftCodes, code],
    })
  }

  const nameOf = (code) =>
    allOptions.find((option) => String(option.code) === String(code))?.name ??
    saved?.items.find((item) => String(item.code) === String(code))?.name ??
    String(code)

  const closeConfirm = () => {
    setConfirming(false)
    save.reset()
  }

  const confirmSave = () => {
    if (!selected) return
    save.mutate(
      { userId: selected?.userId, codes: draftCodes },
      {
        onSuccess: () => {
          setConfirming(false)
          setDraft(null)
          notifySaved(tier, selected?.fullName ?? selected?.userCode)
        },
      },
    )
  }

  const pool =
    tier.kind === ASSIGNMENT_KIND.BRANCHES
      ? { label: 'Free branches', hint: 'no Account Officer holds them', count: assignable.data ? assignable.data.filter((option) => !option.holder).length : null }
      : tier.kind === ASSIGNMENT_KIND.GROUPS
        ? { label: 'Your groups', hint: 'what you can give out', count: allOptions.length }
        : { label: 'Regions', hint: 'one per Regional Sales Head', count: regions.data ? regions.data.length : null }

  return (
    <>
      <AssignmentsView
        tier={tier}
        counts={{
          all: people.length,
          none: people.filter(holdsNothing).length,
          assigned: people.filter((person) => person.holdings && !holdsNothing(person)).length,
          pool: pool.count,
        }}
        countsLoading={loading}
        poolLabel={pool.label}
        poolHint={pool.hint}
        filter={filter}
        onFilterChange={setFilter}
        list={
          <PeopleCard
            tier={tier}
            people={visible}
            selectedId={selected?.userId}
            onSelect={pickPerson}
            search={search}
            onSearchChange={setSearch}
            loading={loading}
            error={error}
            className={showEditorOnPhone ? 'hidden lg:flex' : undefined}
          />
        }
        editor={
          <AssignmentEditor
            tier={tier}
            person={selected}
            saved={saved}
            options={options}
            draft={draftCodes}
            diff={diff}
            loading={Boolean(selected) && (savedQuery.isPending || Boolean(optionsQuery?.isPending && optionsQuery.fetchStatus !== 'idle'))}
            error={savedQuery.error ?? optionsQuery?.error ?? null}
            search={optionSearch}
            onSearchChange={setOptionSearch}
            onToggle={toggle}
            onPick={(code) => setDraft({ userId: selected?.userId, codes: [code] })}
            onReset={() => setDraft(null)}
            onSave={() => setConfirming(true)}
            saveHint={saveHint}
            onBack={() => setShowEditorOnPhone(false)}
            className={showEditorOnPhone ? undefined : 'hidden lg:flex'}
          />
        }
      />

      <ConfirmSaveDialog
        open={confirming}
        tier={tier}
        name={selected?.fullName ?? selected?.userCode ?? ''}
        added={diff.added.map(nameOf)}
        removed={diff.removed.map(nameOf)}
        saving={save.isPending}
        error={save.error}
        onConfirm={confirmSave}
        onClose={closeConfirm}
      />

      <DiscardChangesDialog
        open={Boolean(pendingPerson)}
        name={selected?.fullName ?? selected?.userCode ?? ''}
        onDiscard={() => {
          if (pendingPerson) openPerson(pendingPerson)
          setPendingPerson(null)
        }}
        onKeep={() => setPendingPerson(null)}
      />
    </>
  )
}
