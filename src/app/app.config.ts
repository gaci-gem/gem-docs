import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import { ConfirmationService, MessageService } from 'primeng/api';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { authInterceptor } from '@core/interceptors/auth-interceptor';
import { loadingInterceptor } from '@core/interceptors/loading-interceptor';
import { credentialsInterceptor } from '@core/interceptors/credentials-interceptor';
import { AuthBoot } from '@core/auth/boot';
import { Observable } from 'rxjs';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    // Slice 3 (shared-auth-cross-origin): credentials-interceptor runs BEFORE
    // auth-interceptor so the withCredentials flag rides on the cloned
    // request. loading-interceptor is outermost (loading spinner UX).
    provideHttpClient(
      withInterceptors([loadingInterceptor, credentialsInterceptor, authInterceptor]),
    ),
    provideAnimations(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.my-app-dark',
        },
      },
    }),
    ConfirmationService,
    MessageService,
    // Slice 3 (shared-auth-cross-origin): app-initializer fires the cookie
    // boot probe and BLOCKS route activation until it completes. The auth
    // guard fires AFTER the probe, so it never redirects prematurely.
    provideAppInitializer(() => {
      const result = inject(AuthBoot).run();
      // Return the Observable so Angular awaits it before route evaluation
      if (result instanceof Observable) return result;
      return;
    }),
  ],
};
