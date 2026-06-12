import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { RouterOutlet, ActivatedRoute } from '@angular/router';
import { filter, mergeMap } from 'rxjs/operators';
import { provideIcons } from '@ng-icons/core';
import * as tablerIcons from '@ng-icons/tabler-icons';
import * as tablerIconsFill from '@ng-icons/tabler-icons/fill';
import * as lucideIcons from '@ng-icons/lucide';
import { AuthService } from '@core/services/auth';
import { LoadingService } from '@core/services/loading.service';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoadingSpinnerComponent, ToastModule],
  providers: [MessageService],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    provideIcons({ ...tablerIcons, ...tablerIconsFill, ...lucideIcons }),
  ],
})
export class App implements OnInit {
  private titleService = inject(Title);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private loadingService = inject(LoadingService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = false;

  ngOnInit(): void {
    // Restore user from storage if token exists
    if (this.authService.isAuthenticated()) {
      this.authService.verifyToken().subscribe();
    }

    // Subscribe to loading state from LoadingService
    this.loadingService.loading$.subscribe((loading) => {
      this.isLoading = loading;
      this.cdr.detectChanges();
    });

    // Set page title on navigation
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        mergeMap(() => {
          let route = this.activatedRoute;
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route.data;
        })
      )
      .subscribe((data: { title?: string }) => {
        if (data['title']) {
          this.titleService.setTitle(data['title'] + ' | GEM Docs');
        }
      });
  }
}