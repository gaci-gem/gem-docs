# Editor References and UX Contract

This document is the quick reference for the editor's internal references,
autosave behavior, and contextual drawers. The implementation lives in the
editor component and uses the official Tiptap Suggestion utility rather than a
parallel text parser.

## Quick path

1. Type `@`, `#`, or `[[` in the editor.
2. Filter the suggestions and use ArrowUp/ArrowDown, `Tab`, or the mouse.
3. Click a document reference to navigate, or click a user/event reference to
   open its detail drawer.
4. Save or wait for autosave; references must remain readable after reload.

## Reference syntax

| Trigger | Target | Visible form | Stored form |
|---|---|---|---|
| `@` | User | `@Full Name` | `@usuario:<id>` |
| `#` | Event | `#Event title` | `@evento:<id>` |
| `[[` | Internal document | `Document title` | `[[<id>|<label>]]` |

The user and event stored forms preserve compatibility with legacy documents.
Labels and colors are resolved from the current catalogs after content loads;
they are not persisted as styling data.

## Suggestion behavior

- `@tiptap/suggestion` owns matching, lifecycle, filtering, and keyboard
  dismissal.
- Angular renders the popup through the standalone
  `SuggestionListComponent`, positioned from Tiptap's `clientRect`.
- `Tab` selects the highlighted item. `Enter` remains available to the editor
  and is intentionally not intercepted.
- `Escape` closes the active suggestion.
- `[[query` uses Suggestion's official `findSuggestionMatch` extension point
  because the utility's normal `char` option accepts one character.

## Rendering and navigation

References render as emphasized, colored, underlined text rather than filled
tags. User references use `Usuario.color`; event references use
`tipo.color` from `/evento/completo?cerrado=all`. Weight and underline remain
present so color is never the only indicator.

- Document click → Angular navigation to `/docs/<id>`.
- User click → `ReferenceDrawerService.openUser(id)`.
- Event click → `ReferenceDrawerService.openEvent(id)`.
- Images and external links keep their existing editor behavior.

The global `ReferenceDrawerComponent` is mounted in the authenticated vertical
layout. It loads user details with `UsuarioService.getByIdCompleto` and event
details with `EventoService.getByIdCompleto` (`GET /evento/:id/completo`). It
owns loading, error, responsive sizing, and accessible close behavior. The
editor emits a reference target and does not depend on PrimeNG directly.

## Persistence and autosave

- Reference nodes define Markdown tokenizer/parser and serializer hooks so
  references round-trip without becoming `[reference]` after reload.
- Catalog hydration updates labels/colors with `preventUpdate`; it must not
  mark the document dirty or trigger a false autosave.
- Autosave includes title and content and exposes `dirty`, `saving`, `saved`,
  and `error` states.
- Manual and autosave requests are serialized so a new document cannot receive
  concurrent duplicate `POST` requests. After creation, later saves use `PUT`.

## Verification checklist

- [x] `@`, `#`, and `[[` suggestions filter and select with `Tab`.
- [x] References preserve IDs and readable labels after save/reload.
- [x] User and event colors are hydrated from current data.
- [x] Document clicks navigate; user/event clicks open the drawer.
- [x] Autosave and manual save do not create duplicate documents.
- [x] Focused editor/reference tests pass.
- [x] Development and production builds pass.

## Next step

Keep manual browser validation for references and drawers in the
`feat/ux-polish` branch before committing or promoting the work.
