import { ComponentFixture, TestBed } from '@angular/core/testing'

import { VerticalLayout } from './vertical-layout'
import { ensureBrowserStorage } from '../../../testing/browser-storage'
import { provideRouter } from '@angular/router'
import { ConfirmationService, MessageService } from 'primeng/api'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'

ensureBrowserStorage('localStorage')

describe('VerticalLayout', () => {
  let component: VerticalLayout
  let fixture: ComponentFixture<VerticalLayout>
  let httpMock: HttpTestingController

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerticalLayout],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ConfirmationService,
        MessageService,
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(VerticalLayout)
    component = fixture.componentInstance
    fixture.detectChanges()

    httpMock = TestBed.inject(HttpTestingController)
    httpMock.expectOne((request) => request.urlWithParams.startsWith('assets/version.json')).flush({
      version: 'test',
      branch: 'test',
      commitHash: 'test',
      buildTime: 'test',
    })
    httpMock.expectOne('http://localhost:4000/docs').flush([])
    httpMock.expectOne('http://localhost:4000/espacios').flush([])
  })

  afterEach(() => httpMock.verify())

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
