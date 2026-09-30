import { ComponentFixture, TestBed } from '@angular/core/testing'

import { UserProfile } from './user-profile'
import { provideRouter } from '@angular/router'
import { ensureBrowserStorage } from '../../../../../../testing/browser-storage'

ensureBrowserStorage('localStorage')

describe('UserProfile', () => {
  let component: UserProfile
  let fixture: ComponentFixture<UserProfile>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserProfile],
      providers: [provideRouter([])],
    }).compileComponents()

    fixture = TestBed.createComponent(UserProfile)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
