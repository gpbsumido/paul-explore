# Interviewee topics — markdown template

This is the shape I feed prep notes in. The deck is organised **by job
interview** first, and each interview owns its topics. Write an interview in the
markdown below, then tell Claude: **"transform this into
`src/lib/interviewee/interviews.data.ts`"** and it becomes an `Interview`
(schema in `types.ts`).

Everything on the site is driven by that one array, so the deck, the interview
pages, the topic pages, the related cards and the keyboard nav all come from
this format for free.

## Format

```md
# <Interview title, e.g. "Sardine Interview 2: Hiring manager">
id: <lowercase-slug>            # URL segment, must be unique
summary: <role and context line, shown under the interview heading>

## <Topic title>
id: <lowercase-slug>            # unique within THIS interview
summary: <one line for the card and the topic heading>
related: <slug>, <slug>         # ids of sibling topics in this interview (optional)

### <A question, as it might be asked>
- <a headline bullet point>     # `points` — always shown
- <another headline bullet>
> <deeper detail>               # `details` — expandable, optional, one per line
> <more detail>

### <The next question>
- <point>
```

## How it maps

| Markdown | Field |
| --- | --- |
| `#` heading | interview `title` |
| `##` heading | topic `title` |
| `id:` | `id` (slug; interview ids globally unique, topic ids unique within the interview) |
| `summary:` | `summary` |
| `related:` | `related` (comma-separated ids that must resolve to topics in the same interview) |
| `###` heading | `entries[].question` |
| `-` bullet | `entries[].points[]` (at least one per question) |
| `>` quote | `entries[].details[]` (optional, shown behind "Show detail") |

## Rules the tests enforce

- Every interview `id` is unique; every topic `id` is unique within its interview.
- Every `related` id points at a topic in the same interview; a topic never relates to itself.
- Every topic has at least one question, and every question at least one point.

Paste a batch, run `pnpm test src/lib/interviewee`, and a bad reference fails a
test instead of shipping a dead card.
