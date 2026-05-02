# Mother Brain v0.1 — G2E Presentation Script v2 (7 minutes + buffer)

**Audience:** Casino operators, compliance / AML, risk leadership, board observers.  
**Surface:** `http://localhost:<PORT>/demo/gaming-dashboard.html` (same-origin as `POST /assess`).  
**Build:** Mother Brain v0.1 maqueta — **Ready for G2E demo** (badge in dashboard header/footer).

---

## Agenda timing (what to book)

| Block | Purpose |
|--------|---------|
| **~7:00** | Core walkthrough below (timed beats). |
| **~0:45–1:00** | **Buffer** — clarifying questions, one extra accordion, or a repeat of **Export Report**. |
| **Suggest** | List **8 minutes** on the run-of-show so the room is not rushed; keep hard stops at **9:00** max including intro thanks. |

**Floor target:** finish the scripted beats by **~6:45–7:10** so you still have air before the hard stop.

---

## How to use this document

- **Elapsed** = clock time from **Start**. Use a visible timer (phone or stage clock).  
- **Δ** = duration of the beat (stay within ~10 s; skip **[OPT]** lines if behind).  
- **Say** = suggested wording; adapt to your voice — see **Speaker notes** for pivots.  
- **Show / Click** = dashboard action; **Audience sees** = what the room should notice.  
- **Audience** = primary stakeholder for that line.

Total scripted floor: **~7:00** (sum of Δ ≈ **410 s ~6:50**; small pauses fill a **7:00** slot on stage).

---

## Key messages (weave into the run)

| Stakeholder | Core message |
|-------------|----------------|
| **Operators** | One **`POST /assess`** returns composite tier, **top drivers**, **priority-tagged actions** (`[Gaming-P*]`, dimension tags), **Adaptive Combos**, and **Operator Playbook** lines aligned with server output — triage without tab-hopping. |
| **Compliance / AML** | Every run is **auditable**: **`correlationId`** end-to-end, **`GET /audit-log`**, **`GET /audit-log/stats`**, persisted domain and risk level — same primitives for internal audit and regulator-style review. |
| **Board** | **Explainable, exportable decisions**: live KPIs and tier mix in seconds, **Export Report** for reviewer-grade **Markdown** or **Print → Save as PDF** (cream layout) — no separate “demo stack.” |

---

## Speaker notes — improvisation and tone

- **Voice:** Calm, operator-first, no hype. Name **one concrete outcome per beat** (“tier mix,” “playbook line,” “audit roll-up”).  
- **If interrupted early:** Answer in **15 s**, then bridge: *“I’ll show the evidence for that in two clicks — …”* and jump to the relevant section (**Audit Log** or **Export**).  
- **If the API is slow:** Narrate the spinner on **Run Full Demo** as *“live round-trip — same path your integration would use.”* Never apologize for latency; attribute it to honesty of the call.  
- **If a label is unfamiliar:** Point at the **tier colour** and **priority tag**; defer deep schema to **leave-behind Markdown**.

---

## Stakeholder Q&A — short answers (keep under 20 s each)

### Operators — “Does this replace our case tool?”

**Say:** *“It doesn’t replace your CRM — it **feeds** it. Mother Brain standardizes **assessment + drivers + playbook lines** so your desk opens cases with the same language the API used.”*

### Operators — “What do we do first when tier is Critical?”

**Say:** *“Follow the **Operator Playbook** order — P1 lanes and consoles map to your runbooks; the UI mirrors **`[Gaming-P*]`** priority from the response.”*

### Compliance / AML — “How do we prove what was decided?”

**Say:** *“**`correlationId`** on every response; **`GET /audit-log`** and stats for volumes and tiers; exports embed the headline risk for examiner-style review.”*

### Compliance — “Is the synergy score inflating risk?”

**Say:** *“**Adaptive Combos** surface cross-dimension patterns; synergy is **capped** in scoring — we show the pattern, not a hidden multiplier.”*

### Board — “What are we buying vs building?”

**Say:** *“You’re buying a **contract**: **`POST /assess`** and audit primitives you can wire to existing stacks — the dashboard is proof of the contract, not a separate product silo.”*

### Board — “Roadmap?”

**Say:** *“**v0.1** is a closed maqueta; **Gaming v0.2** adds patterns and enrichment on the **same** API — additive, not a rip-and-replace.”*

---

## Timed beats (~7:00 floor)

| Elapsed | Δ | Say (suggested) | Show / Click | Audience sees | Audience |
|--------|---|-----------------|--------------|---------------|----------|
| **0:00** | **25 s** | “This is **Mother Brain** — MAZALab’s unified risk intelligence: entity-aware scoring, gaming-domain logic, and **explainable** output in one **`POST /assess`**. What you see is **live API**, not a recording.” | Gesture to **header**: title **Mother Brain — Gaming Demo**, **`POST /assess`** chip, **Mother Brain v0.1 — Ready for G2E demo** badge. | Dark casino chrome, gold accents, trust framing. | Board |
| **0:25** | **15 s** | “I’ll hold **English** for this pass; the product is **EN / ES / PT** from the header when you want regional G2E.” | Point to **language** `<select>` (EN / ES / PT). **Do not** switch yet unless scripted below. | Language control visible next to theme. | Board |
| **0:40** | **20 s** | “For projector and board packs I’ll switch to **light theme** — cream and gold, better contrast in a lit ballroom.” | Click **theme toggle** (sun/moon). Confirm **`data-theme="light"`** on `<html>` if asked. | Full palette flip: cream surfaces, readable body copy, chips stay legible. | Board |
| **1:00** | **30 s** | “Four KPIs — **how many runs**, **critical/high count**, **average composite risk**, **last refresh**. Everything below is the same batch.” | Indicate **KPI strip** (four cards). | Numbers at a glance; executive strip. | Board |
| **1:30** | **35 s** | “One control runs **six** gaming scenarios **in parallel** — chargebacks, RG, vendor/AML, clean baseline, multi-entity ring, syndicate shape — all against the running service.” | Click **Run Full Demo**. Wait for spinner → completion. | Button busy state → KPIs and sections populate together. | Operators |
| **2:05** | **20 s** | “That bar is **portfolio shape** — composite **tier** mix across the batch. Concentration shows up immediately.” | Point **Risk tier distribution** (stacked bar + legend). | Colour-stack tells the risk shape story. | Board |
| **2:25** | **40 s** | “**Comparative overview** — one **card per scenario**: subject, entities, score, **tier**, **top drivers**. Scan left to right; it holds on tablet portrait.” | Slow horizontal scroll through **Comparative overview** grid. Optional: tap one card. | Card grid with tier badges and driver lines. | Operators |
| **3:05** | **40 s** | “**Adaptive Combos** — patterns across dimensions from **`gamingInsights`**. First three surfaced; **Show more** opens the ladder. Synergy is **bounded** — insight without runaway scores.” | Point **Adaptive Combos Detected**; expand **Show more** if time. | Combo rows + optional expanded list. | Compliance |
| **3:45** | **40 s** | “**Operator Playbook** — same priority semantics as **`[Gaming-P*]`**: visible queue, **Show more** for depth. SLA, lane, console — desk-ready.” | Point **Operator Playbook**; expand ladder if needed. | Prioritized action cards / lines. | Operators |
| **4:25** | **35 s** | “**Case details** — one accordion: headline, **assessment summary**, **`gamingInsights`** when present. That’s the sentence an analyst defends.” | Expand **one** rich case (e.g. **Chargebacks & velocity** or **Bonus abuse ring**). | Accordion body: narrative + structured insight. | Compliance |
| **5:00** | **35 s** | “**Audit Log Overview** — live roll-up from **`GET /audit-log/stats`**: volumes, tiers, top patterns, windows. Same numbers ops can poll.” | Scroll to **Audit Log Overview**; optional **Refresh Audit Stats**. | Stats cards reflecting backend. | Compliance |
| **5:35** | **30 s** | “**Export Report** — **Quick** and **Full** **Markdown** for Slack / Confluence; **Quick / Full PDF** routes through **Print → Save as PDF** for a **board packet** — cream layout, selectable text.” | Open **Export Report ▾**; hover or open **Quick Report PDF** / **Full Report PDF**; mention **Copy Markdown**. | Dropdown with export paths. | Board |
| **6:05** | **25 s** | **[OPT — language live]** “If useful for this room — watch the chrome:” Switch **language** to **ES** or **PT**, pause **2 s**, switch back **EN**. “Same API; strings swap from our i18n layer.” | Change `<select>`, then revert. *(Skip if low time.)* | Labels update; KPI numbers unchanged. | Board |
| **6:30** | **20 s** | “**Mother Brain v0.1** — maqueta today; **Gaming v0.2** is **additive** on the same contract. I’ll take questions and leave **exports** plus this script.” | Stop timer. Offer **Markdown/PDF** + script path. | Closed loop: product + artifact. | All |

**Sum of Δ ≈ 410 s (~6:50)** + breath between beats ≈ **7:00**. Use **buffer** on the agenda for Q&A (see top).

### [OPT] +60 s (deepen to ~8:00 total)

- Second tab: `http://localhost:<PORT>/audit-log?domain=gaming&limit=10` — read one line: **correlation id** + **level**.  
- Or expand **Key artefacts** under Adaptive Combos.

### [OPT] −60 s (compress to ~6:00)

- Shorten **Comparative overview** beat by **20 s** (single card only).  
- Shorten **Case details** beat by **20 s** (accordion closed — summary only).  
- Drop **language live** beat entirely.

---

## Click-by-click — what the room sees (reference)

Use this if you want a **silent rehearsal** without the clock.

1. **Load page** — Header with product name, **`POST /assess`** chip, G2E badge; optional API URL field (default same-origin **`/assess`**).  
2. **Language dropdown** — Value EN / ES / PT; changing it re-labels section titles and buttons (data stays the same).  
3. **Theme toggle** — Click cycles **dark ↔ light**; light mode raises background luminance and flips text/chip contrast for projectors.  
4. **Run Full Demo** — Primary CTA; brief loading state, then KPI strip fills, tier bar renders, comparative cards populate, combos/playbook/audit sections hydrate.  
5. **Scroll path** — Tier bar → Comparative grid → Adaptive Combos → Operator Playbook → Case accordion → Audit Log Overview → Export Report.  
6. **Export Report ▾** — Menu items for Markdown and PDF variants; PDF uses print stylesheet (cream in light mode).

---

## Projector, light mode, and language — operator checklist

| Situation | What to do | What the room notices |
|-----------|------------|------------------------|
| **Bright ballroom / LED wall** | Set **light theme** **before** guests arrive; browser zoom **110–125%** on presenter laptop. | No “grey-on-grey”; KPIs read from the back row. |
| **Question on dark vs light** | Toggle once slowly: *“Same data — presentation surface.”* | Confirms no demo trickery. |
| **Bilingual audience** | Pre-set **ES** or **PT** **before** **Run Full Demo** if the narrative is non-English; or use the **6:05** live swap to prove i18n without re-running scenarios. | Labels change; numbers and tiers do not. |
| **Post-switch reassurance** | If you switched language mid-demo: *“Correlation ids and export content still align with the API — language is UI.”* | Compliance comfort. |

---

## Closing — call to action and next steps

**Close (say):**

> “Mother Brain v0.1 proves the **contract**: one **`POST /assess`**, explainable drivers, operator actions, and audit surfaces your risk and compliance teams can inspect. Take the **Markdown** or **PDF** export from this session, walk **`GET /audit-log`** with any **`correlationId`** you see, and we’ll align on **Gaming v0.2** enrichment on **your** roadmap — same API, more signal.”

**Next steps (offer as checklist):**

| Owner | Action |
|--------|--------|
| **You (presenter)** | Email **exports** + this script path; offer **15-minute** technical deep-dive with engineering. |
| **Operator sponsor** | Map **Operator Playbook** lines to internal runbooks (lane/console naming). |
| **Compliance** | Sample audit pull: **`GET /audit-log/stats`** + spot **`GET /audit-log/:correlationId`**. |
| **Board / strategy** | Schedule decision on **pilot scope** — which casino systems feed **`POST /assess`** first. |

---

## Cold open (optional 15 s before 0:00)

> “Good morning — MAZALab, **Mother Brain**. In the next **seven minutes** you’ll see **live** assessments against our API: **six** scenarios, **explainable** drivers, **audit lineage**, and a **board-ready** export. I’ll start the clock at the framing beat — timer on screen.”

---

## Open this script

Paths below are **relative to the repository root** (the directory that contains `package.json`).

| | |
|---|---|
| **Relative path** | `demo/package/g2e-presentation-script.md` |

**VS Code:** Press **Ctrl+P** (Windows / Linux) or **Cmd+P** (macOS), type `g2e-presentation-script`, choose the file; or in the **Explorer** sidebar open **demo** → **package** → `g2e-presentation-script.md`.

**File Explorer / Finder:** From the cloned repo folder, open **demo** → **package** → `g2e-presentation-script.md`.

---

## After the session

- Share **Markdown** export or **PDF** from Print.  
- Point stakeholders to repo **`README.md`** → **Ready for G2E** and **`docs/PROJECT_CONTEXT.md`**.  
- Correlation ids in the export tie to **`GET /audit-log/:correlationId`** for line-by-line review.

---

_Script v2 — Mother Brain v0.1 G2E. Last updated: 2026-04-20._
