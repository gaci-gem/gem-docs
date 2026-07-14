/**
 * Minimal ambient type declarations for `turndown-plugin-gfm`.
 *
 * The npm package does not ship its own types and there is no
 * `@types/turndown-plugin-gfm` on DefinitelyTyped. This file declares just
 * the symbols we actually use so the compiler stops complaining about
 * implicit `any`. The function follows turndown's plugin contract: receive
 * a service instance and return the (possibly extended) service.
 */
declare module 'turndown-plugin-gfm' {
  import type TurndownService from 'turndown';

  /**
   * Registers all GFM extensions (tables, strikethrough, task list items)
   * on the supplied TurndownService instance. Returns the same instance
   * so it can be chained after `new TurndownService(...).use(gfm)`.
   */
  export function gfm(service: TurndownService): TurndownService;
}
