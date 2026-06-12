import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ui-card',
  imports: [],
  template: `
    @if (isVisible) {
      <div class="card {{ className }}">
        @if (withTitle) {
          <div class="card-header">
            <h5 class="card-title mb-0">{{ title }}</h5>
          </div>
        }
        <div class="card-body {{ bodyClass }}">
          <ng-content />
        </div>
      </div>
    }
  `,
  styles: `
    .card {
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
    }
    .card-header {
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
    }
    .card-body {
      padding: 1rem;
    }
  `,
})
export class UiCardComponent {
  @Input() withTitle = true;
  @Input() title = '';
  @Input() bodyClass = '';
  @Input() className = '';
  isVisible = true;
}