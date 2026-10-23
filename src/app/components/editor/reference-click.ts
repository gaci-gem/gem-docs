import type { ReferenceTarget } from '@core/services/reference-drawer.service';

export const referenceTargetFromElement = (element: HTMLElement | null): Exclude<ReferenceTarget, null> | null => {
  const reference = element?.closest<HTMLElement>('[data-reference-type]');
  const type = reference?.dataset['referenceType'];
  const id = reference?.dataset['referenceId'];
  return (type === 'user' || type === 'event') && id ? { type, id } : null;
};
