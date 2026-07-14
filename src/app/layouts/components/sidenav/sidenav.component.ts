import { Component, inject } from '@angular/core';
import { DocSidebarComponent } from '../../../components/doc-sidebar/doc-sidebar.component';
import { LayoutService } from '@core/services/layout.service';

@Component({
  selector: 'app-sidenav',
  imports: [DocSidebarComponent],
  template: `
    <div class="sidenav-menu" style="height: 100%">
      <app-doc-sidebar style="height: 100%; display: block" />
    </div>
  `,
})
export class SidenavComponent {
  layoutService = inject(LayoutService);
}