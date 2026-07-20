// listen-logout.ts
// Slice 3 (shared-auth-cross-origin): cross-app logout channel listener.
//
// gem-web posts \`{ type: 'logout', at: <ISO> }\` on \`BroadcastChannel('gem-auth')\`
// after \`POST /auth/logout\` resolves (Slice 3.3). gem-docs subscribes and,
// on a 'logout' message, clears the LS/SS tokens + user state and lets the
// auth guard drive navigation back to the public landing on the next route
// activation.
//
// Why BroadcastChannel over a window-event:
// - Same-origin tabs would propagate via \`storage\` events, but gem-web
//   and gem-docs are different origins (.julitorossian.dev subdomains).
//   \`storage\` only fires across same-origin windows.
// - BroadcastChannel is the cross-tab/cross-app cross-origin surface that
//   works without a shared service worker. Browser support: Chromium /
//   Firefox stable, Safari 15+. DR-5 in design.md.
//
// Wired via \`providedIn: 'root'\` with constructor-side \`start()\`. The
// \`App\` component bootstrap registers itself automatically on first
// injection; `provideAppInitializer` in `app.config.ts` does NOT wire this
// (we want the listener to outlive any single boot probe).

import { Injectable, inject } from '@angular/core';
import { AuthService } from '@core/services/auth';
import { UserStorageService } from '@core/services/user-storage';

const CHANNEL_NAME = 'gem-auth';
interface LogoutMessage {
  type: 'logout';
  at: string; // ISO timestamp; not used today but documented in the envelope
}

@Injectable({ providedIn: 'root' })
export class AuthLogoutListener {
  private authService = inject(AuthService);
  private userStorage = inject(UserStorageService);
  private channel: BroadcastChannel | null = null;

  constructor() {
    this.start();
  }

  /**
   * Open the BroadcastChannel and wire the onmessage handler. Wrapped in
   * try/catch because Safari pre-15 throws synchronously when the channel
   * is not supported (DR-5). On those browsers the listener no-ops — gem-docs
   * public landing renders fine without auth (see design § 14).
   */
  start(): void {
    if (this.channel) {
      return;
    }
    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event: MessageEvent<LogoutMessage>) => {
        if (event?.data?.type === 'logout') {
          this.onRemoteLogout();
        }
      };
    } catch {
      this.channel = null;
    }
  }

  /**
   * Drop the session. \`authService.logout()\` would also clear LS (the
   * tokens themselves), but we deliberately call a tighter, scope-limited
   * cleanup here because the 'remote logout' message implies the user has
   * already left gem-web; we don't need to fire another POST /auth/logout
   * (and the gem-api cookie is already cleared by gem-web).
   *
   * The auth guard re-evaluates on the next NavigationEnd — the user is
   * kicked back to gem-web/login via the boot-probe 401 path (Q2).
   */
  private onRemoteLogout(): void {
    for (const key of ['access_token', 'refresh_token']) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
    this.userStorage.clearUsuario();
    this.authService.notifyRemoteLogout();
  }

  /** Tear-down for tests. */
  stop(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}
