import { ShortcutItem, ShortcutKey, SHORTCUTS } from '@/app/constants/shortcut';
import { Directive, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ShortcutService } from '@core/services/shortcut';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appShortcut]'
})
export class ShortcutDirective implements OnInit, OnDestroy {
  @Input('appShortcut') shortcutItem!: ShortcutItem;
  @Output() appShortcutTrigger = new EventEmitter<void>();

  private sub?: Subscription;

  constructor(private shortcutService: ShortcutService) {}

  ngOnInit(): void {
    if (!this.shortcutItem || !this.shortcutItem.combo) return;
    const combo = this.shortcutItem.combo;//.toUpperCase();

    this.sub = this.shortcutService.onShortcut().subscribe((pressed) => {
      if (pressed === combo) {
        this.appShortcutTrigger.emit();
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}