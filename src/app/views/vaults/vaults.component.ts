import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { VaultService } from '@core/services/vault.service';
import { Vault } from '@core/interfaces/vault';

@Component({
  selector: 'app-vaults',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonModule, DialogModule, InputTextModule, TextareaModule],
  template: `
    <main class="container py-4">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <h1 class="mb-0">Vaults</h1>
        <button pButton type="button" label="Create vault" icon="pi pi-plus" (click)="showCreateDialog.set(true)"></button>
      </div>
      <div class="list-group">
        @for (vault of vaults(); track vault.id) {
          <button class="list-group-item list-group-item-action" (click)="select(vault)">{{ vault.name }}</button>
        }
      </div>
      <p-dialog header="Create vault" [(visible)]="showCreateDialog" [modal]="true" [draggable]="false" [resizable]="false" [style]="{ width: 'min(32rem, calc(100vw - 2rem))' }" (onHide)="resetForm()">
        <form [formGroup]="form" (ngSubmit)="create()" class="d-flex flex-column gap-3" aria-label="Create vault">
          <input pInputText formControlName="name" placeholder="Name" aria-label="Vault name" autofocus />
          <textarea pTextarea formControlName="description" placeholder="Description (optional)" aria-label="Vault description" rows="4"></textarea>
          <div class="d-flex justify-content-end gap-2">
            <button pButton type="button" label="Cancel" severity="secondary" (click)="showCreateDialog.set(false)"></button>
            <button pButton type="submit" label="Create vault" [disabled]="form.invalid || saving()"></button>
          </div>
        </form>
      </p-dialog>
    </main>
  `,
})
export class VaultsComponent {
  private service = inject(VaultService);
  private router = inject(Router);
  vaults = signal<Vault[]>([]);
  saving = signal(false);
  showCreateDialog = signal(false);
  form = new FormGroup({ name: new FormControl('', { nonNullable: true, validators: [Validators.required] }), description: new FormControl('', { nonNullable: true }) });

  constructor() { this.service.initialize().subscribe(vaults => this.vaults.set(vaults)); }
  select(vault: Vault): void { this.service.select(vault); this.router.navigate(['/docs']); }
  create(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.service.create(this.form.getRawValue()).subscribe({
      next: (vault) => { this.service.select(vault); this.showCreateDialog.set(false); this.router.navigate(['/docs']); },
      error: () => this.saving.set(false),
    });
  }
  resetForm(): void { this.form.reset({ name: '', description: '' }); this.saving.set(false); }
}
