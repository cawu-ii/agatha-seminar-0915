## Context

See proposal.md. Current state: `app/seminar/0915/page.tsx` (lines ~200-215) hardcodes two paragraphs in JSX right after the hero/banner section:

```tsx
<p className="ta__lead reveal">
  當 Agentic AI 進入應用爆發期，真正的關鍵不在「用了多少 AI」，而在能不能把 AI
  嵌進企業既有的產、銷、人、發、財流程，讓它可用、可控、可治理。Agatha
  以雲地整合與治理為底層，協助製造業把單點試用，變成全員可用、可被交付與衡量的日常戰力——讓 AI
  真正驅動生產力與 ROI，落在營運成果上。
</p>
<div className="glass ta__box reveal">
  <p className="en">Who should attend</p>
  <p>
    專為<strong>製造業經營者、IT 與營運決策者</strong>量身打造。9/15，一次看懂「可使用、可管控、可治理」的代理式
    AI，如何成為驅動企業生產力的智慧戰略中心。
  </p>
</div>
```

This is the same class of problem `event-info-cms` and `highlights-cms` already solved (static marketing JSX → CTO/PR-editable DB rows) - not new architecture. **This document leaves a starting point for implementation; the two open questions below need your answer before coding starts, same pattern as the four open questions in the original banner-cms design.**

## Goals / Non-Goals

**Goals (once implemented):**
- CTO/PR can edit both blocks' text from `/admin` and see the change reflected on next landing-page load, no engineer/redeploy needed.
- Landing page fails safe to the current wording if the DB query errors or a row is missing (same pattern as every other CMS-backed section).

**Non-Goals:**
- A general rich-text editor or WYSIWYG. This is plain-text field editing, same level as every other CMS screen in this project (agenda titles, speaker bios, highlight bodies) - none of those support inline formatting either.
- Editing the section eyebrow labels that appear elsewhere on the page (e.g. "Highlights", "Speakers", "Agenda") - those stay hardcoded exactly as they are today. Whether "Who should attend" (this callout's own eyebrow label) follows the same rule is Open Question #2 below.
- Reordering, adding, or removing blocks - exactly these 2 fixed blocks, same "fixed-slot" reasoning as `EventInfo`'s 4 facts.

## Decisions

- **Fixed-slot model, not an orderable list** - same reasoning as `EventInfo` in `banner-cms`'s design.md: there are always exactly these 2 blocks, never more or fewer, so the schema should make "accidentally delete the only intro paragraph" structurally impossible rather than relying on the admin UI to just not offer a delete button.

  ```prisma
  enum IntroCopyField {
    LEAD        // the "當 Agentic AI 進入應用爆發期..." paragraph
    ATTENDEE    // the "Who should attend" callout box
  }

  model IntroCopy {
    id        String         @id @default(uuid())
    field     IntroCopyField @unique
    body      String         // plain text; see Open Question #1 for the ATTENDEE bold span
    updatedAt DateTime       @updatedAt
  }
  ```
  `field @unique` guarantees exactly one row per block, same guarantee `EventInfo.field` already provides. Admin PATCH updates by `field`, never creates/deletes - mirrors `app/api/admin/event-info/[field]/route.ts` almost exactly.

- **Seed on deploy, not a data migration that guesses at content.** A `prisma/seed-intro-copy.ts` (same shape as `seed-event-info.ts`) inserts today's exact wording as the two initial rows, run once via `npm run seed:intro-copy` as part of this change's redeploy steps - so the landing page's rendered output is byte-for-byte unchanged the moment this ships, and the first edit anyone makes is a deliberate one from `/admin`, not an accidental blank field.

## Risks / Trade-offs

- [Risk] Whichever answer Open Question #1 gets, a PR editor typing into a plain `<textarea>` could still paste literal `**`/HTML in an attempt to get bold and have it render as literal punctuation instead of formatting → Mitigation: whatever syntax is chosen (if any) gets one line of help text under the field in the admin UI explaining exactly what's supported, same as how the banner upload screen explains exact pixel requirements next to the file input.

## Open Questions (resolved 2026/08/10)

1. **Bold-span handling → (b) tiny explicit markup subset.** `ATTENDEE.body` is stored as plain text with a `**text**` convention parsed on render into `<strong>` - nothing else (not a general Markdown parser, no other syntax recognized). The admin field's help text spells out exactly this: `用 **文字** 讓文字變粗體，其他符號不會被特殊處理`. Render-side: a small helper (e.g. `renderWithBold(text: string)`) splits on `/\*\*(.+?)\*\*/g` and wraps matched groups in `<strong>`; unmatched `**` (odd count, no closing pair) renders as literal asterisks, not silently dropped or half-applied.

2. **"Who should attend" eyebrow label → stays fixed.** Same treatment as "Highlights"/"Speakers"/"Agenda" - hardcoded JSX, not part of `IntroCopy`. `IntroCopyField` has exactly two values (`LEAD`, `ATTENDEE`), `ATTENDEE.body` is only the body paragraph.
