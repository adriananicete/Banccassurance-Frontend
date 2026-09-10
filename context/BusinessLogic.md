# Bancassurance Referral System — how the business works

Written 2026-08-19. **This is my understanding, written down so it can be checked.**

Three kinds of statement appear below, and they are marked so you can tell them apart:

- **Plain text** — read from the code or the stored procedures. Verifiable.
- **Confirmed** — told to me by Adrian. Business intent I could not have derived.
- ⚠️ **Inference** — my reading of *why*, not something anyone stated. **These are the ones most
  likely to be wrong, and the ones worth correcting.**

---

## 1. The arrangement

**Bancassurance is selling insurance through a bank.**

Two companies:

- **Landbank** — a bank, with 567 branches and customers who walk into them.
- **PhilLife** (Philippine Life Financial Assurance Corp.) — a life insurer.

⚠️ **Every branch count in §1a is the whole bank. Only NCR is confirmed data — 136 branches, 3
groups, 20 Account Officers, set 2026-08-28.** The counts below describe Landbank; **they are not what
we build and test against.** 📄 `HIERARCHY.md` §2 draws the line.

Landbank staff meet customers every day. Some of those customers could use insurance. Rather than
Landbank selling it themselves, a staff member **refers** the customer to PhilLife, and a PhilLife
Account Officer takes it from there.

**This system is the record of those referrals** — who referred whom, for what product, and what
happened next.

⚠️ **Inference:** the value of the arrangement is that Landbank gets a customer served without
becoming an insurer, and PhilLife gets access to a customer base it could not otherwise reach.
Nobody stated this; it is the standard shape of bancassurance and it fits everything in the code.

---

## 0. Glossary — read this before anything else

> ⚠️ **UPDATED 2026-08-26. Two things this section predates:**
> 1. **The rename landed.** The Group column is **`GroupCode`**, not `AreaCode`, everywhere —
>    database, backend, JWT, query strings, response keys. Read every `AreaCode` below as `GroupCode`.
> 2. **The ten-group re-cut was dropped.** The group tier **stays at fifteen** — `group_areas` is the
>    permanent groups table. `banc.groups` (the directory ten) is dropped. So "fifteen today, ten
>    after the re-cut" and the `groups (10)` target below **did not happen**; only the rename did.
>
> What survives: the business meaning ("Area" in the DB = Group; the Cluster sits one tier below the
> Group), and the four tiers `regions → group_areas → clusters → branches`. The Cluster tier now
> exists (`banc.clusters`, `branches.ClusterCode`) but is reporting-only — nobody heads one. Kept as
> the record of the reasoning; read the current shape in `HIERARCHY.md` and `Pending Branch.md`.

One word carries two meanings in this system and it has caused three separate misreadings in a
single day. Fix it in your head first.

| Business word | Database | Notes |
|---|---|---|
| **Sector** | *nothing* | One Sector Head holds all of Landbank |
| **Group** | `banc.group_areas`, column **`AreaCode`** | `NORTH NCR`, `CENTRAL LUZON` — fifteen today, **ten after the re-cut** |
| **Area** / **Cluster** | *nothing yet* | `Cluster A/B/C` under a group. DBA item 22c |
| **Branch** | `banc.branches` | 567, currently attached straight to a Group |

⚠️ **"Area" in the database means Group. "Area" in the business means Cluster.** They are one tier
apart, in the direction that makes a wrong reading look plausible.

⚠️ **All of this is being re-cut. Decided 2026-08-24: the Landbank BBS directory is authoritative.**

The table above describes what the database holds **today**. The target is the directory's own
structure, and the two do not line up at the group level:

```
today    Sector → group_areas (15)            → branches (567)
target   Sector → groups (10) → clusters (33) → branches (567)
```

**Seven of the fifteen are not groups at all** in the directory — they are clusters, one tier down.
`BICOL` is a Group with its own Group Head today; there it is *Cluster C of SOUTHEAST LUZON BRANCHES
GROUP*. So the codes cannot be carried across by renaming; every value is remapped and seven change
tier while doing it.

**`AreaCode` becomes `GroupCode` in the same pass**, at full depth — database, backend, JWT claim,
query strings, response keys. No compatibility alias. Every one of those columns is being rewritten
anyway, and the new level is named **`ClusterCode`, never `AreaCode`**.

**Read this glossary as history once that lands.** After the re-cut the words in the code and the
words on the org chart are the same words, and the collision that produced three wrong conclusions in
one day is gone rather than documented.

*Raised as DBA item 22c. The open risk is not technical: the directory lists roughly 209 branches
against 567 in the database, so a complete branch-to-cluster mapping has to come from Landbank
before it can finish.*

---

## 1a. The Landbank hierarchy, and the word that means two things

*(From `context/lanbankRoles.png`, supplied by Adrian 2026-08-24. The diagram is the authority for
this section; everything below is read off it.)*

```
Region  →  Sector  →  Group  →  Area / Cluster  →  Branch  →  Branch Staff
   ↑                    ↑              ↑              ↑
banc.regions      group_areas    banc.clusters   banc.branches
   (3)               (15)            (33)         (567 · 168 mapped)
```

📄 **Updated 2026-08-25 — every tier now has a table.** `banc.clusters` and `banc.regions` were
created after this section was written, so the "nothing" below Group is gone and a Region tier has
appeared above. `context/HIERARCHY.md` carries the counts and the coverage.

⚠️ **Read the rest of this section as the reasoning, not as the current schema.** Every `AreaCode`
below **was renamed to `GroupCode` on 2026-08-26** and the old column is dropped. The conclusion is
what survives — and it is what justified the rename.

**The database's `AreaCode` was the business's "Group".** This is not a guess — the diagram's group
names map one-for-one onto `banc.group_areas`:

| Diagram | `group_areas` |
|---|---|
| North NCR Branches Group | `AreaCode 1` |
| Central NCR Branches Group | `AreaCode 2` |
| South NCR Branches Group | `AreaCode 3` |
| Northwest / Northeast / Central Luzon Branches Group | `AreaCode 4–9` |

⚠️ **So "area" in the code means "group" in the business, everywhere.** The table is named
`group_areas` for exactly that reason. Anyone reading `AreaCode` as the Area/Cluster level below a
group will be wrong by one tier, and this has already cost one incorrect DBA request.

~~**There is a fourth level and the database has no room for it.**~~ — **it does now.** Each Group
holds several Areas/Clusters — *North NCRBG Cluster A, B, C* — and each Cluster holds Branches.
`banc.clusters` holds all 33 and `banc.branches` has a `ClusterCode`.

**The diagram still marks `Cluster/Area Head` in red as *"Not included in the hierarchy"*, and that
remains true of the roles.** Nobody heads a cluster on the Landbank side; the tier exists for
reporting. The PhilLife **Area** Sales Head sits at it — a different company's chain, and where that
role's name comes from.

⚠️ **A second word now means two things, and this one is numeric.** `group_areas.GroupCode` is a copy
of its own `AreaCode` (1–15); `banc.groups.GroupCode` is the Branch Banking directory's ten. **They
agree only at 1**, and `clusters.GroupCode` points at the fifteen. A join between the two resolves,
returns rows, and is wrong fourteen times in fifteen. `HIERARCHY.md` §4 carries it.

**Confirmed by Adrian:** `SECTOR_HEAD`, `GROUP_HEAD`, `BRANCH_HEAD` and `BRANCH_STAFF` are certain.
✅ **Settled 2026-08-24: there will be no Cluster/Area Head role.** The **level** is still needed —
the reporting drill-down in §10 goes Group → Cluster → Branch and cannot skip a tier — but nobody
heads a cluster, so the system models it as structure only.

**That makes the work smaller, and safer.** No ninth role, no `USR-CLH` prefix, no scope table, no
new link in the approval chain — a Branch Head is still approved by their Group Head, unchanged.
And it removes the risk of resting an **access boundary** on a mapping described as informal: with
no role, the cluster affects only how counts are grouped, and a rollup that regroups is harmless
where a silently drifting permission is not.

What remains is exactly what Adrian named as the point: **a single source of truth for group,
cluster and branch.**

~~If a Cluster/Area Head is confirmed it~~ — *the original note follows, kept because it explains why
the question mattered.* If it were confirmed it
is not merely a fifth role — it needs a table, a scope source, and a new link in the approval chain
between the Group Head and the Branch Head, and it breaks the four-to-four symmetry with PhilLife
that §2 and §8 both lean on.

**Both questions are settled, 2026-08-24.**

**There is exactly one Sector Head** *(Adrian)*, holding Luzon, Visayas and Mindanao together — the
whole of Landbank. They are the true mirror of the Department Head and need **no scope table at
all**. Every procedure that hands them `banc.user_area` is wrong; raised as DBA item 33.

**`AreaCode` is the Group, confirmed from the data.** The fifteen `AreaName` values read `NORTH NCR`,
`CENTRAL NCR`, `SOUTH NCR`, `BICOL`, `CENTRAL LUZON`, `NORTHEAST LUZON`, `NORTHWEST LUZON`,
`SOUTHEAST LUZON`, `SOUTHWEST LUZON`, `CENTRAL VISAYAS`, `EAST VISAYAS`, `WEST VISAYAS`,
`NORTH MINDANAO`, `SOUTH MINDANAO`, `WEST MINDANAO` — the diagram's *Group* names, six for six on the
ones it spells out, and not one `Cluster A`. Branch counts run 19 to 52 and sum to exactly 567.

So **a Group Head heads one Group and holds one `AreaCode`**, and the single-value column is correct
for that role. `banc.user_area` duplicates it and is read by nothing once item 33 lands.

~~⚠️ **`GroupCode` does not need adding — the Group is already there under another name.**~~ —
**true of the fifteen, and overtaken by the decision to re-cut.** The Group tier exists, but it is
cut wrong: seven of the fifteen are clusters promoted a level. So both tiers are being rebuilt —
`banc.groups` with ten rows and `banc.clusters` with thirty-three — and `AreaCode` becomes
`GroupCode` in the same pass. See §0 and DBA item 22c.

The original point still holds and is why the naming trap exists: **the schema was never missing a
Group. It was missing a Cluster**, one tier below where the word "area" led everyone to look.

**Confirmed 2026-08-24: the Cluster level is real and required.** Adrian: drilling into `NORTH NCR`
shows `Cluster A`, `Cluster B`, `Cluster C` **before** it shows any branch. So the hierarchy is four
deep — Sector → Group → Cluster → Branch — and the database currently models three.

✅ **And the group level is being re-cut with it. Decided 2026-08-24: the directory is
authoritative.** `context/landbank_complete_10_groups_directory.pdf` lists **ten** Branches Groups
with **33 clusters between them — every group has clusters, not NCR alone**, which corrects what we
were told earlier that day.

Only eight of the fifteen `group_areas` names appear in it, and **what the database calls a Group the
directory calls a Cluster**: `BICOL` is `AreaCode 4`, a Group, in the system; in the directory it is
*Cluster C of SOUTHEAST LUZON BRANCHES GROUP*. `NORTHEAST` and `NORTHWEST LUZON` sit inside a single
`NORTH LUZON` the same way.

**So the fifteen rows were never one clean tier** — some are groups, some are clusters promoted.
Both tiers are being rebuilt: `banc.groups` with ten rows, `banc.clusters` with thirty-three, and
branches attaching to a cluster. Raised as DBA item 22c.

📄 **The transcription of that directory was deleted 2026-09-01, and the paragraph above is history.**
It described the *Complete 10 Branches Groups Nationwide Directory* — 10 groups, 33 clusters, 204
branches of 567 — which was the reference for DBA item 22c. **22c was withdrawn on 2026-08-26** and
the group tier stays at fifteen, so nothing is being rebuilt against it.

**The reference for structure below Region is `Bancassurance_Hierarchy_and_process.md`** — the final
Landbank directory, 136 NCR branches, 3 groups, 20 Account Officer blocks. Only NCR is confirmed data,
and the other 431 branch rows were removed. The PDF is still in `context/` if the old counts are ever
needed again.

**"Area" and "Cluster" are the same tier in Adrian's usage**, as in the diagram's own
*"Areas/Clusters"* box. That is why the word has now caused three separate misreadings: the database
spends it on the Group and the business spends it on the Cluster.

---

## 2. Why there are two of everything

Each company has its own chain of command, and the system holds both.

⚠️ **They are NOT mirror images, and this table said they were until 2026-08-28.** PhilLife has a
Region level and Landbank does not, so the pairing below is **wrong by one tier.**
📄 **`HIERARCHY.md` §3 is the authority.** The correct alignment:

| Tier | Landbank | PhilLife |
|---|---|---|
| Tenant | Sector Head | Department Head |
| Region | — nobody | **Regional Sales Head** |
| Group | Group Head | **Area Sales Head** |
| Cluster | — nobody | — nobody. **Reporting only** |
| Branch | Branch Head — one | **Account Officer — six to eight** |
| Person | Branch Staff | — |

**The Group Head's counterpart is the Area Sales Head**, not the Regional Sales Head.

*The superseded pairing, kept because it is quoted elsewhere:* ~~Sector↔Department,
Group Head↔Regional Sales Head, Branch Head↔Area Sales Head, Branch Staff↔Account Officer.~~

*Do not read "cluster" into either table.* The Landbank org chart has a real Cluster tier between
Group and Branch (§1a) and **no role on either side sits at it** — it is structure rather than a
seat. The final Landbank directory confirmed it on 2026-08-28: the Account Officer holds a **list of
branches**, six to eight of them, not a cluster.

Every user carries a code that says which company they belong to: `USR-` for Landbank, `PHL-` for
PhilLife. The code is the tenant boundary — the system reads the prefix to decide what a person
may see.

**A referral crosses the boundary.** It is created on the Landbank side and worked on the PhilLife
side. That is the single most important structural fact in the system, and most of its
complexity follows from it.

---

## 3. The people, and what each actually does

### Landbank side

**Branch Staff** — the front line. Talks to the customer, collects their details, obtains consent,
and creates the referral. Most referrals in the system originate here.

**Branch Head** — runs a branch. **Does everything Branch Staff does, and also refers personally.**
Is notified whenever their staff create a referral.

**Group Head** — oversees an area's worth of branches. Approves Branch Head registrations. **Does
not refer.**

**Sector Head** — top of the Landbank chain. Approves Group Heads. Does not refer.

### PhilLife side

**Account Officer (AO)** — the one who does the insurance work. Referrals are assigned to them,
and they present products to the client and move the referral's status. **They may also refer
their own clients**, in which case they are both the referrer and the handler.

**Area Sales Head (ASH)** — **an overseer.** *(Confirmed.)* Watches the Account Officers in their
areas through a dashboard. Approves new AOs and assigns them the branches they will cover.
**Does not refer and does not work referrals.**

**Regional Sales Head (RSH)** — **an overseer**, one level up. *(Confirmed.)* Watches a region,
approves ASHs, assigns them areas.

**Department Head (DH)** — **an overseer** for the whole PhilLife tenant. *(Confirmed.)* Approves
RSHs, assigns them groups.

> **The three PhilLife heads read dashboards. That is their day-to-day use of this system**,
> alongside approving and equipping the people below them.
>
> This has a consequence that is easy to underrate: when their referral list is empty, they have
> nothing. It is not a degraded view — **the list is the function.**

### The asymmetry worth noticing

On the Landbank side, the Branch Head **refers alongside** their staff. On the PhilLife side, the
Account Officer's own head **does not**.

⚠️ **Inference:** a Branch Head is still a bank branch manager who meets customers, so referring is
a natural part of their job. An Area Sales Head manages a territory rather than a desk, so there
is nobody in front of them to refer. The code enforces the distinction; nobody explained it.

---

## 4. The journey of one referral

```
  ┌─ LANDBANK ───────────────────────────────────────────┐
  │                                                       │
  │  1. Staff talks to a client, takes their details      │
  │                                                       │
  │  2. A consent request is emailed to the client        │
  │     POST /consent/send                                │
  │                                                       │
  │  3. The client opens the link, reads the notice,      │
  │     and presses "I Agree"                             │
  │     GET /consent/confirm  ->  POST /consent/confirm   │
  │                                                       │
  │  4. The staff member creates the referral             │
  │     POST /referrals            status: Referred       │
  │     -- refused until step 3 has happened              │
  │     -- the consent is consumed here                   │
  └───────────────────────────────────────────────────────┘
                            |
                    crosses to PhilLife
                            |
  ┌─ PHILLIFE ───────────────────────────────────────────┐
  │                                                       │
  │  5. The assigned Account Officer presents a product   │
  │     PUT /referrals/:id/status  ->  Presented          │
  │                                                       │
  │  6. Underwriting decides                              │
  │     Presented -> Closed Pending                       │
  │                -> Approved / Declined / Postponed     │
  └───────────────────────────────────────────────────────┘
```

**The system ends at step 6.** No policy document, no premium, no payment, no commission. A
referral reaching `Approved` means underwriting said yes — what happens afterwards lives in other
systems.

**Step 6 is not performed by a person using this application.** An external system, written in
C#, calls in with a shared API key. That has one consequence worth knowing: **there is no
per-caller attribution behind that key**, so nothing can record *who* at underwriting made a
decision — only that one was made.

---

## 5. Consent, and why it is strict

Before a client can be referred, they must consent to their information being processed. This is a
**Data Privacy Act of 2012** requirement, not an internal preference, and the notice the client
reads says so explicitly.

Two ways to satisfy it:

1. **The client confirms by email** — a link is sent, they read the notice on a web page, and
   press `I Agree`. Status becomes `CONFIRMED`.
2. **A signed paper form is uploaded** by staff. Status becomes `UPLOADED`.

Either satisfies the check. `POST /referrals` refuses with 403 until one of them has happened.

### Consent is single-use

Creating a referral **consumes** the consent that authorised it. The referral row keeps a copy of
which consent token was used and when it was confirmed, so the link between the two is permanent.

**A client who wants a second product needs a second consent.** *(Confirmed.)* One referral is one
product, so a client interested in two plans is referred twice and asked twice.

⚠️ **This contradicts what the notice tells the client.** Both the email and the page say *"This
consent shall remain valid unless withdrawn in writing"*, while the implementation treats it as
good for exactly one referral. **Either the lifetime is wrong or the sentence is** — that is a
compliance question, not a technical one, and it is open.

### The two-step click is deliberate

The client clicks twice: once in the email to open the page, once on the page to agree. This looks
redundant and was briefly collapsed into one, then deliberately restored.

The reason is that **email clients are unreliable renderers.** Gmail clips long messages and
Outlook mangles list markup, so an email-only flow can take agreement from someone who was shown a
truncated notice. The browser renders what we send; the inbox does not.

The original problem was never the number of steps — it was that both steps looked identical, same
notice and same button label, so the second read as the first having failed. Now the email says
`Review and Give Consent` and states plainly that opening the link records nothing; the page says
`I Agree`.

---

## 6. The referral lifecycle

```
                    ┌──────────┐
                    │ Referred │  created
                    └────┬─────┘
            ┌────────────┼────────────┐
            v            v            v
      ┌──────────┐ ┌───────────┐ ┌──────┐
      │ Deferred │ │ Presented │ │ Lost │
      └────┬─────┘ └─────┬─────┘ └──────┘
           │             │
           └─────────────┤        AO's side ends here
─────────────────────────┼─────────────────────────────
                         v        underwriting takes over
                 ┌────────────────┐
                 │ Closed Pending │
                 └───────┬────────┘
              ┌──────────┼──────────┐
              v          v          v
        ┌──────────┐ ┌──────────┐ ┌───────────┐
        │ Approved │ │ Declined │ │ Postponed │
        └──────────┘ └──────────┘ └─────┬─────┘
                                        │
                              still resolvable later
```

**Who moves what:**

| Status | Meaning | Set by |
|---|---|---|
| `Referred` | Created, waiting for the AO | The system, on creation |
| `Presented` | The AO has shown the client a product | Account Officer |
| `Deferred` | The client wants to think about it | Account Officer |
| `Lost` | The client is not proceeding | Account Officer |
| `Closed Pending` | With underwriting for a decision | Underwriting |
| `Approved` | Underwriting said yes | Underwriting |
| `Declined` | Underwriting said no | Underwriting |
| `Postponed` | Underwriting deferred the decision | Underwriting |

**Only the Account Officer assigned to a referral may change its status**, and only within the
moves above. The three overseer roles cannot move anything.

`Presented` is the handover point and appears in both halves — the AO can still pull it back to
`Deferred` or `Lost`, and underwriting can push it forward. There is no lock, so whoever acts
second gets a clear refusal rather than an error.

`Deferred` is the AO's alone. Underwriting never sees it and cannot act on it.

---

## 7. When a client can be approached again

A client cannot have two open referrals for the same product. The pairing is **email + product**.

| Terminal state | Set by | Frees the pairing? |
|---|---|---|
| `Approved` | Underwriting | **Yes** |
| `Declined` | Underwriting | **Yes** |
| `Lost` | Account Officer | **No — permanently closed** |
| `Postponed` | Underwriting | No, and correctly: it can still resolve |

**All four are intended.** *(Confirmed.)*

The pattern: **when underwriting reaches a verdict, the client becomes available again.** When the
Account Officer closes a referral as `Lost`, that client and that product are finished, and no
role can reopen the pairing.

⚠️ **Inference:** `Lost` means the client said no to a person, and reopening it would let staff
approach the same client repeatedly for the same product. A verdict from underwriting is about the
application, not the client's willingness, so it does not carry that concern.

> **This is the rule most likely to be mistaken for a bug.** The code reads
> `WHERE Status NOT IN ('Approved','Declined')`, which looks as though `Lost` was forgotten. It
> was not. Adding `Lost` to that list would reverse a business decision.

---

## 8. Who can see what

This is where most of the system's complexity lives, because **every role's scope comes from a
different place.**

| Role | Sees |
|---|---|
| Branch Staff | Only referrals they created |
| Branch Head | Everything from their branch |
| Group Head | **Everything in their group** — one, held in `Users.GroupCode` |
| Sector Head | **Everything in the Landbank tenant.** No scope table; they hold the country |
| Account Officer | Every referral assigned to them, wherever it came from |
| Area Sales Head | Referrals handled by AOs in the areas they hold |
| Regional Sales Head | The same, across their region |
| Department Head | Everything in the PhilLife tenant |

Two things make this harder than it looks:

**The PhilLife roles scope on who *handles* the referral, not who created it.** Most referrals are
created by Landbank staff and handled by a PhilLife AO. An ASH looking at their area needs to see
referrals their AOs are working — which means matching on the account officer, not the referrer.
Getting this backwards hides exactly the referrals the role exists to watch, and it has happened.

**An Area Sales Head can hold several areas, and an area can have several Area Sales Heads.** That
is why their scope lives in a separate table rather than a column, and why any lookup that takes
only the first match will find the wrong person.

~~**The same is true of a Group Head**… a Group Head's scope lives in `banc.user_area`.~~ —
**wrong, and settled the same day.** It was written from Adrian's *"many groups, each holding their
own areas"*, then contradicted by the org chart: *"Group Head = the head of **a** Group"*, singular.

**A Group Head holds exactly one group**, in `Users.GroupCode`. The "areas" in that sentence were the
**Cluster** level — the word doing its usual double duty. See §0.

`banc.user_area` is read by nothing in `src/` already; the procedures still read it for the Sector
Head, and that is `DBA-REQUESTS.md` A3.

**A Sector Head holds every branch, area and group in Landbank, nationwide.** They are the mirror of
the Department Head and, like them, need **no scope table at all** — a tenant guard is their whole
scope. The two are a matched pair and should read identically in every procedure:

| Landbank | Scope source | PhilLife | Scope source |
|---|---|---|---|
| Sector Head | none — the whole tenant | Department Head | none — the whole tenant |
| Group Head | `Users.GroupCode` — **one** group | Regional Sales Head | `regional_sales_head_areas` — **several** |
| Branch Head | `Users.BranchCode` | Area Sales Head | `area_sales_head_areas` — **several** |
| Branch Staff | their own referrals | Account Officer | `account_officer_branches` |

**The two sides are not symmetrical in the middle, and that is correct.** A Group Head runs one
group; their PhilLife counterpart covers several. Landbank scope follows the org chart, one seat per
unit; PhilLife scope is a coverage assignment that can be spread and reshuffled. **Only the PhilLife
roles need junction tables.**

⚠️ **The referral procedures currently have the top two rows swapped** — they give the junction
table to the Sector Head and the single column to the Group Head. Raised as DBA item 33.

---

## 9. Bringing a new person into the system

Three steps, and all three are required:

```
1. They register, choosing where they belong
2. The role above them approves
3. That same person assigns their scope
```

**An approved user with no scope cannot work.** An Account Officer who has been approved but not
given branches gets a clear refusal when they try to create a referral. That ordering is
deliberate — approval says who you are, scope says what you cover, and they are separate decisions.

**The same rule runs the other way, and it was never written down here.** *(Stated by Adrian
2026-08-24; it has been enforced in the code all along.)* **Branch Staff and a Branch Head cannot
create a referral unless an Account Officer covers their branch.** A referral has to be handed to
somebody, so if nobody covers the branch there is no referral to make, and the refusal says exactly
that: *"Your account has no assigned Account Officer."*

⚠️ **Nobody assigns an Account Officer to a Landbank staff member.** There is no such step and no
such endpoint — the only assignment is **Account Officer → branches**, by their Area Sales Head. So
the branch is where the answer lives, and reading it anywhere else gives a stale one. That is what
`getReferrerAttribution` now does, and the value is **not** allowed to fall back to
`Users.AOCode`: a branch taken away from an Account Officer must stop producing referrals for them.

```
PhilLife
AO  registers, picks a group   ->  the ASH holding that area approves  ->  ASH assigns branches
ASH registers, picks a group   ->  the RSH holding that area approves  ->  RSH assigns areas
RSH registers, picks nothing   ->  the DH approves                     ->  DH assigns groups

Landbank                                        (confirmed by Adrian 2026-08-24)
Staff registers, picks a branch             ->  the Branch Head of that branch approves
BRH  registers, picks a branch AND a group  ->  the Group Head of that group approves
GRH  registers, picks a group               ->  the Sector Head approves
```

⚠️ **A Branch Head picks two things, and the second is easy to forget.** The branch is what they will
run; the **group** is how the system finds their approver — the Group Head of that group. Neither was
enforced until 2026-08-24, and a registration missing the group failed with *"No Group Head is
assigned to this group yet"*, which was false: there is one for every group, and none had been named.

Every self-registering role now answers both questions — group and branch — as **required**,
**forbidden** or **optional**. Branch Staff are the only *optional*: their group is derivable from
their branch and nothing reads it.

**Each role approves exactly the one below it, and no further.** A Sector Head approves Group Heads
and **only** Group Heads — never a Branch Head, even though every branch is ultimately under them.
The code already enforces this and should keep doing so: `approveRejectUser` refuses with 403 when
the target is not the expected role, and that check is separate from the scope check being removed
under DBA item 33.

No Landbank role assigns scope after approving. A Branch Head's branch and a Group Head's group are
both chosen at registration and never reassigned — which is why the three assign endpoints are all
PhilLife.

The group an ASH picks at registration is not decoration: **without it there would be no way to
know which of the three Regional Sales Heads should receive the approval request.**

Sector Heads and Department Heads **could not self-register** until 2026-08-20. They sit at the top
with nobody above them, so they were created directly in the database.

~~⚠️ **Inference:** the planned `SUPERADMIN` role exists to close that gap.~~ — **built and seeded
2026-08-20, and the inference was right.** `SUPERADMIN` is an IT-held account that approves those two
roles, and both can now register normally; a superadmin can also create one outright. **The
superadmin itself remains a seeded row and always will** — nobody exists to approve the first one.
That is the one manual database step this system cannot remove.

### Signing in

**A user may sign in with their email address, their UserCode, or their employee number** —
whichever they remember. *(Confirmed.)* All three go in the same field.

That rule carries a requirement which is easy to miss: **if any of the three can name an account,
each of the three must name exactly one account.** Only the UserCode is guaranteed unique today.
Where two people share an email or an employee number, the system signs you in as whichever of them
registered first, and it is genuinely their session — not a partial or degraded one. Raised as DBA
items 10, 13 and 31.

⚠️ **Inference:** three identifiers exist because the people using this system are bank and insurance
staff who were issued an employee number long before they had an account here, and who think of
themselves by that number rather than by a `USR-STF-0131`. Nobody stated this; it is the ordinary
reason an enterprise login accepts a staff ID.

---

## 10. Reporting

*(Confirmed 2026-08-19. This is the specification.)*

**Build state as of 2026-08-28.** ⚠️ **Both halves now exist in the database and neither has a caller
in `src/`.** The **detail** half is `usp_exp_referrals_by_role`, and its relationship column landed as
DBA item A8. The **summary** half is `usp_rpt_referral_counts_by_role`, rewritten as A4: correct
per-role scoping, and all four `@GroupBy` levels working.

**So this specification is now the largest thing we can build**, and it is API work rather than
database work. Two things gate it: **A6** — the procedure filters on `StatusDate` and this
specification says `CreatedAt` — and **A20**, the parent filter described in point 3 below, which the
procedure does not have.

**What a report contains depends on the role**, and it follows the same division as everything
else: the people who do the work get lists, the people who oversee get numbers.

### Two shapes, not eight

**Detail — an actual list of referrals**

| Role | Contains |
|---|---|
| Branch Head | Referrals from their branch, **including their own**, not only their staff's |
| Account Officer | **Two separate sections**: referrals they made, and referrals assigned to them |

The Account Officer's two sections must not be merged. When an AO refers their own client they are
both the referrer and the handler, so without the split those referrals would appear twice or be
indistinguishable.

**Summary — counts only, no referral details**

⚠️ **This table is the 2026-08-19 version and the levels in it are wrong.** It is kept because the
*summary versus detail* split it records is still right. **The levels are superseded by the
drill-down below**, confirmed 2026-08-24: Group → Cluster → Branch, not "area, branch".

| Role | Grouped by *(superseded — see below)* |
|---|---|
| Group Head | ~~area, branch~~ |
| Sector Head | ~~area, branch~~ |
| Area Sales Head | ~~area, branch~~ |
| Regional Sales Head | ~~area, branch~~ |
| Department Head | ~~**region**, area, branch~~ |

### The drill-down — **revised 2026-08-28. Two trees, one per tenant.**

⚠️ **This replaces the four-level tree confirmed on 2026-08-24**, which was
*Sector → Group → Cluster → Branch*. **The Cluster level is removed.** The reasoning is at the end of
this section; the short version is that a cluster is too thin to be a level and the data to fill it
does not exist.

**The report is navigated, not read side by side. Every level carries a per-status breakdown.**

```
LANDBANK — "which branches are producing?"

  TOTAL
  ├─ NORTH NCR        210
  ├─ CENTRAL NCR      180
  └─ …15 groups

  opens NORTH NCR:
  ├─ Araneta Center    30
  ├─ Batasan           35
  └─ …its 52 branches          the Branch Head also receives client rows


PHILLIFE — "who is working them?"

  TOTAL
  ├─ NCR              310
  └─ …3 regions

  opens NCR:
  ├─ NORTH NCR        210
  └─ …its groups

  opens NORTH NCR:
  ├─ PHL-AO-00001      42
  ├─ PHL-AO-00002      38
  └─ …its 7 Account Officers
```

**Landbank: Tenant → Group → Branch. PhilLife: Tenant → Region → Group → Account Officer.**

A Group Head enters the Landbank tree at their own group; an Area Sales Head enters the PhilLife tree
at theirs. A Branch Head sees their total **and** the client details — they are the only Landbank role
that ever receives a client row, however deep anyone above them drills.

**Every role gets totals by status**, superseding *"Branch Staff get no report"* below.

**Each level reads a column the referral already carries** — `GroupCode`, `BranchCode`, `AOCode`, all
denormalised at insert, and the last two carry foreign keys to `banc.Users`. **Nothing is derived
through a lookup table**, so no level can be re-bucketed by a change in reference data.

⚠️ **Grouping by `AOCode` is stable across staffing changes, and this is worth being precise about.**
It records **who handled that referral**, permanently, on the row. *"Referrals handled by
`PHL-AO-00003` in Q1"* does not change when they resign. That is the opposite of grouping by a
*caseload* — which branches a person currently holds — and it is why `account_officer_branches` is
never joined by a report. **Scope reads the junction; reports read the referral.**

⚠️ **An Account Officer's total is not the sum of their branches.** Their own referrals carry
`BranchCode = NULL`, so the two trees answer different questions and **must not be reconciled against
each other.** Say so on the screen.

### Why the Cluster level went

Four reasons, in the order they matter:

1. **It is too thin to be a level.** The 33 clusters spread over 15 groups: `3, 2, 1, 1, 4, 2, 2, 5,
   0, 2, 2, 3, 2, 3, 1`. **Three groups have exactly one cluster and one has none** — a click that
   reveals nothing. The widest is five. ⚠️ **In NCR, the only confirmed region, it is 3 · 2 · 1** —
   so **South NCR's level would be a single row above its 43 branches.**
2. **The data to fill it does not exist and is not coming.** The **final Landbank directory carries no
   cluster column** — it gives branch → group and branch → AO. In NCR, **40 of 136 branches are
   placed**; the other 96 would render as one unnamed bucket larger than all six NCR clusters
   combined.
3. **31 branches point at a cluster in another group**, so part of even the populated third is wrong.
4. **Nobody heads a cluster on either side** (`HIERARCHY.md` §3), so no one owns the number or would
   be asked about it.

**`banc.clusters` and `branches.ClusterCode` stay in the schema.** The cluster travels as a **label on
the branch row** where it is known, so the frontend can group visually — no navigation depends on it,
and partial data degrades into a missing label rather than a hole in the tree. Cheap to keep, and
expensive to reintroduce if Landbank ever staffs the tier.

*The `CLUSTER` value in `@GroupBy` landed on 2026-08-28 as DBA item A7, one day before this decision.
**Leave it in place** — it costs nothing unused, and removing it is churn.*

**Where the work sits.** The navigation — expanding, collapsing, breadcrumbs — is the frontend's.
Three things cannot be:

1. **Scoping.** Which groups, clusters and branches a caller may see is not decidable in a browser.
2. **Aggregation.** SQL counts, not JavaScript. The stronger reason is not speed: **to total the rows
   itself the frontend would first have to receive them**, and handing an overseer 1,234 client rows
   to produce one number is exactly what the summary/detail rule forbids.
3. **The parent filter.** The API has to answer *"branches under group 1"* and *"Account Officers
   under group 1"* — one call per expansion, not one call carrying the whole tree.

   ⚠️ **Revised 2026-08-28: this used to say "clusters under group 1" and cite a 567-branch tree.**
   The cluster is no longer a level, and **only NCR is confirmed data — 136 branches, not 567.** A
   Sector Head's full NCR tree is 3 groups and 136 branches × 8 statuses. **The parent filter is still
   wanted**, because it is the shape the report is navigated in and because the other two regions
   arrive later, but it is no longer urgent on size alone.

~~⛔ **None of this can be built yet. The Cluster level does not exist in the database.**~~ —
**updated 2026-08-25: most of it exists now.**

| | | |
|---|---|---|
| 1 | `banc.clusters` — code, name, parent group | ✅ **33 rows** |
| 2 | `ClusterCode` on `banc.branches` | ✅ **168 of 567 populated** |
| 3 | ~~All 567 branches assigned to a cluster~~ | ❌ **No longer required.** The Cluster level is out of the drill-down; the cluster is a label on the branch row |
| 4 | `usp_rpt_referral_counts_by_role` rewritten | ✅ **Done 2026-08-28.** Scoping correct, `REGION` built off `group_areas → regions`, `CLUSTER` added and joined on `ClusterCode` **and** `GroupCode` |
| 5 | An `AO` value in `@GroupBy` | ⏳ **Missing.** The deepest PhilLife level. One block, mirroring `BRANCH`, grouping `r.AOCode` joined to `Users` for the name |
| 6 | A parent filter, so one call serves one expansion | ⏳ **Missing.** `DBA-REQUESTS.md` A20 |

**The tier above turned out to exist too.** `banc.regions` holds three rows — NCR, Luzon, VisMin — and
`regional_sales_head_areas` carries a `RegionCode`. ⚠️ **But that table is about people**, so a report
grouped by region from it would move whenever somebody changes job. `usp_rpt_referral_counts_by_role`
refuses for exactly that reason: `THROW 50004, 'REGION grouping requires the actual region mapping
table.'` **A `RegionCode` on `banc.group_areas` is what unblocks it** — fifteen rows, mapping already
decided.

⚠️ **The cluster mapping is still unsettled and is now nobody's blocker.** `GroupCode 9`, Southwest
Luzon, has **no clusters**, while Southeast Luzon holds five including Cavite, Batangas and MIMAROPA —
which the Branch Banking directory places under Southwest. **Since the cluster is only a label, a
wrong one shows a wrong name beside a branch rather than misfiling a total.** Still worth correcting;
no longer worth waiting for.

📄 **`context/HIERARCHY.md` carries the tiers, the counts and the two-words-two-meanings warnings.**

⚠️ **AO-created referrals have no branch.** `BranchCode` is NULL on every one of them, so they drop
out of the Landbank tree's deepest level entirely — **a group's total will not equal the sum of its
branches.** That is correct behaviour rather than a broken query, and it has to be stated on the
screen or it will be reported as a bug the first week. **They are not lost**: they appear in the
PhilLife tree under the Account Officer who made them.

*The reason, corrected 2026-08-28: an Account Officer holds **six to eight branches**, so a referral
they create has no single branch to record. This used to read "an Account Officer belongs to an area,
not a branch," which was the cluster-tier reading the final directory disproved. **The behaviour is
unchanged; only the explanation was wrong.***

**Every summary is broken down by status** — each row carries a count per status rather than a
single total, so a Group Head sees not just how many referrals came from a branch but how many
were approved, declined, still open.

⚠️ ~~**The Department Head's three levels are three separate totals**, read side by side rather than
nested.~~ — **superseded 2026-08-28.** The Department Head navigates the PhilLife tree like everyone
else on that side, entering at the top: **Region → Group → Account Officer.** They are the only role
that sees the Region level, because they are the only one who holds more than one region.

~~**Branch Staff get no report.**~~ — **superseded 2026-08-24**, see clarification iii above:
totals by status are for every role.

### Date range

Every report is for a period. Presets: **this month**, 3 months, 6 months, **this year**, **all
time**, and a custom range.

⚠️ **The default is `allTime` on both endpoints, decided 2026-09-09.** It was `thisMonth`.

**The reasoning is about what a report claims, not about convenience.** A summary that defaults to the
current month answers *"this month's referrals by group"* while presenting itself as the summary —
and whoever opens the screen reads the numbers as totals. The presets exist to narrow a report; one
that names no period should be everything in the caller's scope.

*An earlier version of this change kept the summary on `thisMonth`, on the grounds that a screen
should not fetch all history on load. **That was withdrawn the same day.** The summary is an
aggregate: it returns one row per group, branch or Account Officer whatever the range, so the payload
does not grow with the period — only the scan does.*

*`allTime` carries a sentinel lower bound of 1 January 2000 rather than an open one, because the
procedure takes a range and we have never established that it accepts a NULL `DateFrom`. Twenty-six
years before the first referral is the same answer without the question.*

### ⚠️ `GET /reports/dashboard` takes no period at all, and this is why

**Parked 2026-09-09 so nobody re-opens it.** The dashboard has no `preset` and no dates. It is
always all time. **That is a constraint from the database, not a preference.**

**It reads two procedures and only one of them understands dates:**

| Part of the response | Procedure | Takes a date? |
|---|---|---|
| `total`, `byStatus` | `usp_sel_referral_counts_by_role` | ❌ **No.** It binds four parameters — `Role`, `UserCode`, `BranchCode`, `GroupCode` — and nothing else |
| `breakdown` | `usp_rpt_referral_counts_by_role` | ✅ Yes — `DateFrom`, `DateTo` |

**So a dated dashboard would disagree with itself on screen.** Given `?preset=thisMonth`:

```
Kabuuan                       847      <- ignored the period; this is all time
  Pasig Capitol                18      <- honoured the period
  Cubao                        22
  Ortigas                      23
                              ----
                                63
```

**847 above, 63 below, one screen, two different periods, and nothing saying which is which.** The
frontend cannot correct it — it has no way to see that the two halves were asked different questions.
It would be filed as a bug, and the real cause would be a procedure that has no date to filter on.

**All time on both halves makes them agree**, which is the only self-consistent option available
today.

✅ **If a dated dashboard is ever wanted, it is one DBA change:** add `@DateFrom` and `@DateTo` to
`usp_sel_referral_counts_by_role`, matching what `usp_rpt_referral_counts_by_role` already has. **It
has not been requested**, because a dashboard answers *"where do we stand"* and that question carries
no period.

⚠️ **The by-status split is the half that sums.** `byStatus` partitions the caller's referrals exactly
once each; a `BRANCH` breakdown does not, because AO-created referrals carry no branch. **Sum
`byStatus`, never `breakdown`** — the same discrepancy this section already warns about two
paragraphs down.

---

⚠️ **`annual` was replaced by `thisYear` on 2026-09-09**, Adrian's decision. The three month-count
presets run back N months **including the current one**, and `annual` followed the same rule — so in
September it started the previous October. **Nobody asking *"what are our referrals this year"* means
a rolling twelve months.** `thisYear` starts on 1 January; a rolling window is what the custom range
is for.

⚠️ **Every preset runs to the end of the current month, not to today.** On 9 September, `thisMonth`
is 1–30 September and includes twenty-one days that have not happened. The counts are unaffected —
there are no referrals in the future — but **the period label on the export says the whole month**,
so a file downloaded mid-month reads as a complete one. Known and left as it is.

✅ **The clock is settled for reporting, 2026-08-28.** `usp_ins_referrals` stopped supplying
`CreatedAt`, so the column default `SYSUTCDATETIME()` fires and **`Referrals.CreatedAt` is UTC**, the
same as notifications and the audit log. The month-boundary problem this paragraph used to describe is
gone from the report. *(`Users.CreatedAt` is still server-local — `DBA-REQUESTS.md` A5 — but no preset
here filters on it.)*

⚠️ **One question is still open and it changes every number: which column.**
`usp_rpt_referral_counts_by_role` filters on `StatusDate`; **this specification says `CreatedAt`.**
*"How many did we receive this month"* and *"how much moved this month"* are both legitimate reports
and **they cannot be reconciled after the fact.** `DBA-REQUESTS.md` A6. **Answer it before the
summaries are built, not after.**

### Format

Excel is the point, and the same content is also read on screen, with an occasional download.

⚠️ **Inference:** this reads as one body of data serving two purposes rather than a file-generation
feature — the screen view is the normal use and the download is for sending onward. That shapes
whether the file is built in the backend or the browser, and the decision is open.

### Why this is smaller than it looks

**Two trees, four grouping values, one query.** Landbank walks `AREA → BRANCH`; PhilLife walks
`REGION → AREA → AO`. That is **one summarising query with a grouping parameter and a parent filter,
plus one detail query** — not eight reports, and not two engines. The scoping is the same scoping the
referral list already applies, so nothing new decides who may see what.

✅ **The blocker this paragraph used to carry is gone.** It read *"cannot be built until the Area Sales
Head and Department Head scoping is fixed in the database."* **Both landed 2026-08-28** — A1 gave the
Department Head `AOCode` in all four procedures and A3 gave the Sector Head a plain tenant guard.

⚠️ **But nothing is proven.** `banc.Referrals` holds zero rows, so every one of those fixes is correct
by reading only. **A report of zeroes looks like an empty month rather than a broken query**, which
makes shipping this before referral data exists worse than not shipping it.

---

## 11. Things that look wrong and are not

A short list, because each of these has confused someone already.

**An Account Officer is their own Account Officer.** When an AO refers their own client, they are
recorded as both the referrer and the handler, and the referral carries **no branch** — an AO holds
six to eight of them, so there is no single one to record. **Any report grouping by branch silently
loses every one of these**, which is why the PhilLife tree groups by `AOCode` instead. *(Corrected
2026-08-28: this said the referral "belongs to an area", which was the cluster-tier reading.)*

**Area Sales Heads and Regional Sales Heads have no area on their user record.** Their coverage
lives in separate tables because they can hold several. Reading the single-value field for them
returns nothing, which has produced three separate defects.

**Account Officers have no branch on their user record**, for the same reason.

**`Lost` never frees the client for that product.** See §7.

**Rejecting a user and deactivating one are the same thing.** There is one flag with three states:
pending, active, rejected/deactivated.

**Two people can be notified about one referral.** Where two Area Sales Heads cover the same area,
both hear about it. That is intended, not duplication.

---

## 12. What this system does not do

Worth stating, because the absences are as defining as the features.

- **No policies, premiums, or payments.** It ends at the underwriting decision.
- **No commission tracking.** Nothing records what anyone earned.
- **No customer record.** A referral holds the client's details; there is no separate client
  entity, and two referrals for the same person are linked only by email address.
- **No messaging between staff and clients** beyond the consent email.
- **No reporting yet beyond the dashboard counts and the referral list.** The reports in §10 are
  specified but not built.
- **No audit of referral status changes.** Administrative actions — approvals, rejections, scope
  assignments — are recorded as of 2026-08-19. Status changes are not, because the underwriting
  system's shared API key makes it impossible to say who made the decision.

---

## 13. Where the rules actually live

For anyone who needs to check a rule rather than trust this document:

| Rule | Where |
|---|---|
| Who may create a referral | `utils/constant.js`, `referralCreatorRoles` |
| The status transitions | `utils/constant.js`, two maps |
| Who may see which referral | `referralService.canAccessReferral`, and the two list procedures |
| The duplicate rule | `referralModel.findActiveDuplicate` |
| Consent required before referral | `referralService.createReferral` |
| Consent lifetime | `usp_check_consent` and `usp_ins_referrals`, in the database |
| Who approves whom | `userService.approveRejectUser` |
| Who may assign scope | `routes/userRoutes.js`, and the checks in `userService` |
| **Who may self-register** | `utils/constant.js`, `landBankRoles` + `philLifeRoles`, enforced in `userService.register` |

~~⚠️ **Those last two constant names are misleading**… each holds only three of its four.~~ —
**out of date, corrected 2026-08-24 from `utils/constant.js`.** Both lists now hold all four roles
of their tenant: `SECTOR_HEAD` joined `landBankRoles` and `DEPARTMENT_HEAD` joined `philLifeRoles`
when self-registration for the top two roles shipped (PR #90). The names and the contents finally
agree, and the trap this paragraph warned about is gone.

What still gates the top two is the **approver lookup**, not the role list: `register` sends them to
`getSuperadmins()` and refuses with *"No superadmin account is active"* if none is found. That is
the guard to leave alone — `topLevelRoles` and `superadminApprovableRoles` are where the rule now
lives.

**The list procedures and the application both enforce visibility, and they must agree.** When
they drift, a user can open a referral they cannot find in their own list, or the reverse — and
that has happened more than once.

---

## Open questions

Things I could not determine from the code, and nobody has stated:

1. **Should a confirmed consent cover more than one referral?** The notice promises it remains
   valid; the code consumes it. One of the two is wrong.
2. **Should the reference lists — branches, groups, plans — require a session?** Two of them are
   currently open to anyone who can reach the server, because public registration needs them.
3. **What should happen when someone leaves?** Deactivation exists, but nothing clears the scope
   they were holding.
4. ~~**Is the Excel export for a person or a system?**~~ — **answered 2026-08-19, see §10.** It is
   for a person: read on screen, downloaded occasionally. The one part still open is **where the
   file is built** — backend or browser — which is a dependency question rather than a business
   one.
