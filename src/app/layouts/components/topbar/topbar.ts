import { ChangeDetectorRef, Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgIcon } from '@ng-icons/core'
import { Subject } from 'rxjs'
import { ThemeToggler } from '@layouts/components/topbar/components/theme-toggler/theme-toggler'
import { UserProfile } from '@layouts/components/topbar/components/user-profile/user-profile'
import { LayoutStoreService } from '@core/services/layout-store.service'
import { appLogo } from '@/app/constants'
import { AppLogo } from '@app/components/app-logo'

@Component({
  selector: 'app-topbar',
  imports: [
    NgIcon,
    RouterLink,
    ThemeToggler,
    UserProfile,
    AppLogo,
  ],
  templateUrl: './topbar.html',
  standalone: true
})
export class Topbar {
  constructor(
    public layout: LayoutStoreService,
    // private drawerService: DrawerService,
    protected cdr: ChangeDetectorRef,
  ) { }
  appLogo = appLogo;

  // Estado para el offcanvas
  showUserNotes = false;
  notaSeleccionadaId: string | null = null;
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // this.drawerService.notaDrawer$
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe(state => {
    //     this.showUserNotes = state.visible;
    //     this.notaSeleccionadaId = state.targetId || null;
    //     this.cdr.detectChanges();
    //   });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar() {
    const html = document.documentElement
    const currentSize = html.getAttribute('data-sidenav-size')
    const savedSize = this.layout.sidenavSize


    if (currentSize === 'offcanvas') {
      html.classList.toggle('sidebar-enable')
      this.layout.showBackdrop()
    } else {
      this.layout.setSidenavSize(
        currentSize === 'collapse' ? 'default' : 'collapse'
      )
    }
  }

}
