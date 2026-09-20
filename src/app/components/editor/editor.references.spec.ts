import { describe, expect, it } from 'vitest';
import { referenceTargetFromElement } from './reference-click';

describe('editor reference clicks', () => {
  it('extracts user and event targets without treating documents as drawer references', () => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = '<span data-reference-type="user" data-reference-id="user-1"><strong>user</strong></span>'
      + '<span data-reference-type="event" data-reference-id="event-1">event</span>'
      + '<span data-reference-type="doc" data-reference-id="doc-1">doc</span>';

    expect(referenceTargetFromElement(wrapper.querySelector('strong'))).toEqual({ type: 'user', id: 'user-1' });
    expect(referenceTargetFromElement(wrapper.querySelector('[data-reference-type="event"]'))).toEqual({ type: 'event', id: 'event-1' });
    expect(referenceTargetFromElement(wrapper.querySelector('[data-reference-type="doc"]'))).toBeNull();
  });
});
