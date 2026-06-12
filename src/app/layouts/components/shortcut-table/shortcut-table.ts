import { SHORTCUTS } from '@/app/constants/shortcut';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ShortcutDirective } from '@core/directive/shortcut';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-shortcut-table',
  imports: [
    DialogModule,
    ShortcutDirective,
  ],
  templateUrl: './shortcut-table.html',
  styleUrl: './shortcut-table.scss'
})
export class ShortcutTable implements OnInit {
  visible:boolean=false;
  SHORTCUTS = SHORTCUTS;
  atajos:any = [];
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.atajos = Object.entries(SHORTCUTS).map(([clave, definicion]) => ({
        clave,
        combo: definicion.combo,
        descripcion: definicion.descripcion
      }));
      this.cdr.detectChanges();
    }, 0);
  }
  
  mostarInfoShortcut(){
    this.visible = !this.visible;
  }
}
