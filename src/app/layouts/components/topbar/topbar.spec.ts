import { ComponentFixture, TestBed } from '@angular/core/testing'

import { Topbar } from './topbar'
import { provideRouter } from '@angular/router'
import { ensureBrowserStorage } from '../../../../testing/browser-storage'

ensureBrowserStorage('localStorage')

describe('Topbar', () => {
  let component: Topbar
  let fixture: ComponentFixture<Topbar>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Topbar],
      providers: [provideRouter([])],
    }).compileComponents()

    fixture = TestBed.createComponent(Topbar)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
