import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap'
import { userDropdownItems } from '@layouts/components/data'

@Component({
  selector: 'app-user-profile',
  imports: [NgbCollapseModule],

  templateUrl: './user-profile.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class UserProfileComponent {
  menuItems = userDropdownItems
}
