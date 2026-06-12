import { ComponentFixture, TestBed } from '@angular/core/testing'

import { VerticalLayout } from './vertical-layout'

describe('VerticalLayout', () => {
  let component: VerticalLayout
  let fixture: ComponentFixture<VerticalLayout>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerticalLayout],
    }).compileComponents()

    fixture = TestBed.createComponent(VerticalLayout)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
