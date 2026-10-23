import { describe, expect, it } from 'vitest';
import { ReferenceDrawerService } from './reference-drawer.service';

describe('ReferenceDrawerService', () => {
  it('opens and closes discriminated user and event targets', () => {
    const service = new ReferenceDrawerService();
    expect(service.target()).toBeNull();

    service.openUser('user-1');
    expect(service.target()).toEqual({ type: 'user', id: 'user-1' });

    service.openEvent('event-1');
    expect(service.target()).toEqual({ type: 'event', id: 'event-1' });

    service.close();
    expect(service.target()).toBeNull();
  });
});
