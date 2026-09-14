# Design system

## Principle

PageLingua appears **on top of someone else's page**. The design language is therefore
quiet: one accent colour, one elevation for floating surfaces, no decoration that
competes with the content underneath. The extension should read as part of the
browser, not as a third-party widget.

Three rules the whole system follows:

1. **Tokens or nothing.** Every colour, radius, spacing step and duration is a CSS
   custom property in `src/ui/tokens/tokens.css`. A literal value in a component
   is a review rejection.
2. **Light is the base, dark is a redefinition.** Dark is declared twice — once
   under `prefers-color-scheme`, once under `[data-theme="dark"]` — so the in-app
   switch wins in both directions.
3. **One surface at a time.** The content script draws a single overlay driven by
   one state machine. We never stack popovers over a host page.

## Tokens

| Group     | Tokens                                                                             | Notes                                                                   |
| --------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Surfaces  | `--pl-bg`, `--pl-surface`, `--pl-surface-sunken`, `--pl-surface-hover`     | `surface` is where content sits; `bg` is the page behind it             |
| Text      | `--pl-text`, `--pl-text-muted`, `--pl-text-subtle`, `--pl-text-on-primary` | three levels, no more                                                   |
| Lines     | `--pl-border`, `--pl-border-strong`, `--pl-focus-ring`                       | focus ring is a separate token so it survives theme changes             |
| Accent    | `--pl-primary`, `-hover`, `-soft`, `-soft-border`                                | derived from `--pl-hue: 232` — change the hue, the whole accent moves |
| Status | `--pl-success` / `-warning` / `-danger`, each with a `-soft` variant | soft = background, solid = text/icon |
| Type      | `--pl-text-xs … -xl`, three line-heights, three weights                          | 13px body: extension UI is denser than a web page                       |
| Space     | `--pl-space-1 … -7`                                                              | 4px base                                                                |
| Radius    | `sm 6 · md 10 · lg 14 · full`                                                      | controls `md`, cards `lg`                                               |
| Elevation | `--pl-shadow-sm` / `-md` / `-lg` | `lg` is reserved for the content-script overlay |
| Motion | `--pl-duration-fast` / `-base` / `-slow`, `--pl-ease` | all collapse to 1 ms under `prefers-reduced-motion` |
| Layering | `--pl-z-handle` / `-popover` / `-scrim` | near the top of the 32-bit z-index range, because host pages fight dirty |

Tailwind v4 consumes these through the `@theme inline` block in
`src/ui/theme.css`, so components write `bg-surface text-muted rounded-md` and the
token stays the single source of truth.

## Primitives

- `Button` — `primary | secondary | ghost | danger` × `sm | md`, plus `loading`
  (keeps the accessible name while showing a spinner) and `iconOnly`.
- `Field` / `TextField` / `SelectField` — label, control, hint or error, with
  `aria-describedby` and `aria-invalid` wired automatically. Never hand-roll a
  label; a floating hint that screen readers miss is the bug this prevents.
- `Callout` — `info | success | warning | danger`. `danger` renders `role="alert"`.
- `Card` — titled section with optional header action. The options page is cards.

## Accessibility baseline (non-negotiable)

- Contrast ≥ 4.5:1 for body text and ≥ 3:1 for UI borders, in both themes.
- One visible focus style, keyboard-only (`:focus-visible`), never removed.
- Every action reachable by keyboard; the overlay traps nothing.
- Status changes announced: `aria-live="polite"` on the overlay, `role="alert"`
  on errors, `role="progressbar"` with a real `aria-valuenow` on page translation.
- Motion respects `prefers-reduced-motion`.
- Never colour alone: every status carries an icon or a word.

## Writing (UX copy)

- Say what happened and what to do next. `error_forbidden` names the two things to
  check, rather than saying "access denied".
- Never blame the user, never expose an HTTP status.
- Consistent nouns across locales: _AI product_, _API token_, _credits_, _panel_.
- English is the source; every string is written in English first, then translated.

## Canvas

The visual reference lives as a Claude Design canvas — tokens, components, and the
v1 screens (popup, overlay on a host page, side panel, options/onboarding) in both
themes:

<https://claude.ai/code/artifact/af678ed6-4fb1-40fc-9fa3-b783401b31f2>

Its sources are the artboards in `design/*.dc.html` plus `design/canvas.json`. Edit
those and re-seed to update the canvas; the seeded `.html` is build output and is
git-ignored. The canvas is a mockup of the design system, not its source — when the
two disagree, `src/ui/tokens/tokens.css` wins and the canvas gets updated.
