import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToolbarComponent } from './toolbar.component';
import { ToolbarService } from './toolbar.service';

describe('ToolbarComponent', () => {
  let fixture: ComponentFixture<ToolbarComponent>;
  let component: ToolbarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ToolbarComponent], providers: [ToolbarService] }).compileComponents();
    fixture = TestBed.createComponent(ToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders list controls after inline emphasis controls', () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('button[title]')] as HTMLButtonElement[];
    const titles = buttons.map((button) => button.title);

    expect(titles.indexOf('Lista con viñetas')).toBeGreaterThan(titles.indexOf('Tachado'));
    expect(titles.indexOf('Lista numerada')).toBeGreaterThan(titles.indexOf('Tachado'));
  });

  it('keeps save and property toggle outputs wired', () => {
    const save = vi.fn();
    const toggle = vi.fn();
    component.save.subscribe(save);
    component.toggleProperties.subscribe(toggle);

    fixture.nativeElement.querySelector('[aria-label="Guardar"]').click();
    fixture.nativeElement.querySelector('[aria-label="Ocultar propiedades"]').click();

    expect(save).toHaveBeenCalledOnce();
    expect(toggle).toHaveBeenCalledOnce();
  });
});
