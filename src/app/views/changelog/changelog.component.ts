import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CHANGELOG } from '@core/services/changelog';

@Component({
  selector: 'app-changelog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="container-fluid py-4" aria-labelledby="changelog-title">
      <div class="container-xl">
        <h1 id="changelog-title" class="h3 mb-4">Novedades</h1>
        @for (entry of changelog; track entry.version) {
          <section class="card mb-3" [attr.aria-labelledby]="'version-' + entry.version">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-baseline gap-3 mb-3">
                <h2 [id]="'version-' + entry.version" class="h5 mb-0">Versión {{ entry.version }}</h2>
                <time class="text-muted" [attr.datetime]="entry.date">{{ entry.date }}</time>
              </div>
              <ul class="mb-0">
                @for (change of entry.changes; track change) {
                  <li>{{ change }}</li>
                }
              </ul>
            </div>
          </section>
        }
      </div>
    </main>
  `,
})
export class ChangelogComponent {
  readonly changelog = CHANGELOG;
}
