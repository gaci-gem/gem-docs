import { ComponentFixture, TestBed } from '@angular/core/testing'

import { ThemeDropdown } from './theme-dropdown'

describe('ThemeDropdown', () => {
  let component: ThemeDropdown
  let fixture: ComponentFixture<ThemeDropdown>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeDropdown],
    }).compileComponents()

    fixture = TestBed.createComponent(ThemeDropdown)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
