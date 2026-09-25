import { ActivatedRouteSnapshot } from '@angular/router';
import { deepestRouteTitle, formatDocumentTitle } from './hive-title.strategy';

/** Minimal snapshot chain: only `data` and `firstChild` are read. */
function chain(...titles: (string | undefined)[]): ActivatedRouteSnapshot {
  let child: ActivatedRouteSnapshot | null = null;
  for (let i = titles.length - 1; i >= 0; i--) {
    child = { data: titles[i] ? { title: titles[i] } : {}, firstChild: child } as unknown as ActivatedRouteSnapshot;
  }
  return child as ActivatedRouteSnapshot;
}

describe('HiveTitleStrategy helpers', () => {
  it('uses the deepest route that declares a title', () => {
    expect(deepestRouteTitle(chain(undefined, 'Friends', 'Pending'))).toBe('Pending');
  });

  it('falls back to an ancestor when the leaf has no title', () => {
    expect(deepestRouteTitle(chain(undefined, 'Community', undefined))).toBe('Community');
  });

  it('formats "<page> · Hive" and leaves the bare brand alone', () => {
    expect(formatDocumentTitle('Discover')).toBe('Discover · Hive');
    expect(formatDocumentTitle('Hive')).toBe('Hive');
    expect(formatDocumentTitle(undefined)).toBe('Hive');
  });
});
