import { ComponentFixture, TestBed } from '@angular/core/testing'

import { SidenavComponent } from './sidenav.component'
import { ensureBrowserStorage } from '../../../../testing/browser-storage'
import { ConfirmationService, MessageService } from 'primeng/api'

ensureBrowserStorage('localStorage')

describe('SidenavComponent', () => {
  let component: SidenavComponent
  let fixture: ComponentFixture<SidenavComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidenavComponent],
      providers: [ConfirmationService, MessageService],
    }).compileComponents()

    fixture = TestBed.createComponent(SidenavComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
