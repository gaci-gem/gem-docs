import { Injectable, signal } from '@angular/core';

export type ReferenceTarget =
  | { type: 'user'; id: string }
  | { type: 'event'; id: string }
  | null;

@Injectable({ providedIn: 'root' })
export class ReferenceDrawerService {
  private readonly targetSignal = signal<ReferenceTarget>(null);
  readonly target = this.targetSignal.asReadonly();

  openUser(id: string): void { this.targetSignal.set({ type: 'user', id }); }
  openEvent(id: string): void { this.targetSignal.set({ type: 'event', id }); }
  close(): void { this.targetSignal.set(null); }
}
