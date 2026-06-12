// import { Notas } from '@/app/views/nota/notas/notas';
import { AfterViewInit, Component, ComponentRef, EventEmitter, Input, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';

@Component({
  selector: 'app-user-notes',
  imports: [
    DrawerModule,
  ],
  template: `
    <p-drawer [(visible)]="visible" position="right" [style]="{width: '50vw'}" [modal]="true" (onHide)="onClose()">
      <ng-template #notasDrawerContainer></ng-template>
    </p-drawer>
  `,
  styles: ''
})
export class UserNotes implements AfterViewInit {
  @Input() visible: boolean = false;
  @Input() eventoId: string | null = null;
  @Input() targetId: string | null = null;
  @Output() closed = new EventEmitter<void>();
  @ViewChild('notasDrawerContainer', { read: ViewContainerRef }) notasDrawerContainer!: ViewContainerRef;
  // notasComponentRef?: ComponentRef<Notas>;

  ngAfterViewInit(): void {
    this.loadEventoComponent();
  }

  ngOnChanges(): void {
    this.loadEventoComponent();
  }

  loadEventoComponent() {
    // if (!this.notasDrawerContainer) return;
    // this.notasDrawerContainer.clear();
    // this.notasComponentRef = this.notasDrawerContainer.createComponent(Notas);
    // // this.notasComponentRef.instance.eventoIdParam = this.eventoId;
    // this.notasComponentRef.instance.targetId = this.targetId || undefined;
    // this.notasComponentRef.changeDetectorRef.detectChanges();
  }

  onClose() {
    // this.closed.emit();
    // if (this.notasComponentRef) {
    //   this.notasComponentRef.destroy();
    //   this.notasComponentRef = undefined;
    // }
    // if (this.notasComponentRef) {
    //   this.notasDrawerContainer.clear();
    // }
  }
}
