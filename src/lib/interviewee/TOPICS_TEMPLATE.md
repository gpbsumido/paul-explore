# Interviewee topics — markdown template

This is the shape I feed prep notes in. Write a topic in the markdown below, then
tell Claude: **"transform this into `src/lib/interviewee/topics.data.ts`"** and it
becomes an `IntervieweeTopic` (schema in `types.ts`).

Everything on the site is driven by that one array, so the deck, the topic pages,
the related cards and the keyboard nav all come from this format for free.

## Format

```md
## <Topic title>
id: <lowercase-slug>            # URL segment, must be unique
summary: <one line for the card and the topic heading>
related: <slug>, <slug>         # ids of sibling topics (optional)

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
| `##` heading | `title` |
| `id:` | `id` (slug, unique, `[a-z0-9-]`) |
| `summary:` | `summary` |
| `related:` | `related` (comma-separated ids that must resolve to real topics) |
| `###` heading | `entries[].question` |
| `-` bullet | `entries[].points[]` (at least one per question) |
| `>` quote | `entries[].details[]` (optional, shown behind "Show detail") |

## Rules the tests enforce

- Every `id` is unique and a lowercase slug.
- Every `related` id points at a topic that exists; a topic never relates to itself.
- Every topic has at least one question, and every question at least one point.

Paste a batch, run `pnpm test src/lib/interviewee`, and a bad reference fails a
test instead of shipping a dead card.
