import { Component } from '@angular/core'
import { LayoutStoreService } from '@core/services/layout-store.service'
import { NgIcon } from '@ng-icons/core'

@Component({
  selector: 'app-theme-toggler',
  imports: [NgIcon],
  templateUrl: './theme-toggler.html',
  standalone: true
})
export class ThemeToggler {
  constructor(public layout: LayoutStoreService) {}

  toggleTheme() {
    if (this.layout.theme === 'light') {
      this.layout.setTheme('dark')
    } else {
      this.layout.setTheme('light')
    }
  }
}
