import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { SidenavComponent } from '@layouts/components/sidenav/sidenav.component'
import { Topbar } from '@layouts/components/topbar/topbar'
import { debounceTime, fromEvent, Subscription } from 'rxjs'
// import { LayoutStoreService } from '@core/services/layout-store.service'
// import { DialogModule } from 'primeng/dialog'
// import { SHORTCUTS } from '@/app/constants/shortcut'
import { ShortcutTable } from "@layouts/components/shortcut-table/shortcut-table";
// import { EventoCronometroComponent } from '@app/components/evento-cronometro';
import { Footer } from '@layouts/components/footer/footer'
// import { DrawerContainerComponent } from '@app/components/drawer-container/drawer-container'
// import { GreetingBannerComponent } from '@app/components/greeting-banner/greeting-banner'
import { DialogService } from 'primeng/dynamicdialog'
import { LayoutStoreService } from '@core/services/layout-store.service'
// import { CHANGELOG } from '@core/services/changelog'
// import { ChangelogModalComponent } from '@views/changelog/changelog-modal'

@Component({
  selector: 'app-vertical-layout',
  imports: [
    RouterOutlet,
    SidenavComponent,
    Topbar,
    ShortcutTable,
    // EventoCronometroComponent,
    Footer,
    // DrawerContainerComponent,
    // GreetingBannerComponent,
  ],
  templateUrl: './vertical-layout.html',
  styles: `
    .content-page {
      position: relative;
    }
  `,
  providers: [DialogService]
})
export class VerticalLayout implements OnInit, OnDestroy {
  // @ViewChild(EventoCronometroComponent) cronometroComponent!: EventoCronometroComponent;

  private dialogService = inject(DialogService);

  constructor(public layout: LayoutStoreService) { }
  resizeSubscription!: Subscription

  ngOnInit() {
    this.onResize()
    this.checkAndShowChangelog()

    this.resizeSubscription = fromEvent(window, 'resize')
      .pipe(debounceTime(200))
      .subscribe(() => this.onResize())
  }

  onResize(): void {
    const width = window.innerWidth

    if (width <= 1140) {
      this.layout.setSidenavSize('offcanvas')
    } else {
      this.layout.setSidenavSize('default')
    }
  }

  private checkAndShowChangelog(): void {
    // Filtrar versiones futuras para obtener la última versión lanzada
    // const releasedVersions = CHANGELOG.filter(entry => !entry.isFuture);
    // const latestVersion = releasedVersions[0]?.version;
    // const lastSeenVersion = localStorage.getItem('lastSeenVersion');

    // if (latestVersion && latestVersion !== lastSeenVersion) {
    //   // Esperar un poco para que la app termine de cargar
    //   setTimeout(() => {
    //     this.dialogService.open(ChangelogModalComponent, {
    //       header: 'Novedades',
    //       width: '600px',
    //       modal: true,
    //       dismissableMask: true,
    //       styleClass: 'changelog-dialog'
    //     });
    //   }, 1000);
    // }
  }

  ngOnDestroy(): void {
    this.resizeSubscription?.unsubscribe()
  }
}
