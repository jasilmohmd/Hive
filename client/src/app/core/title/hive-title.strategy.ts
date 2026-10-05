import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';

/**
 * Routes carry their page name in `data.title` (the app shell's <h1> reads the
 * same value), not in Angular's own `title` property — so the default
 * strategy never touched the browser tab and it said "Hive" everywhere.
 *
 * The deepest route that declares a title wins, matching the shell header.
 */
export function deepestRouteTitle(snapshot: ActivatedRouteSnapshot): string | undefined {
  let title: string | undefined;
  let route: ActivatedRouteSnapshot | null = snapshot;
  while (route) {
    const t = route.data?.['title'];
    if (typeof t === 'string' && t.length > 0) title = t;
    route = route.firstChild;
  }
  return title;
}

export function formatDocumentTitle(title: string | undefined): string {
  return !title || title === 'Hive' ? 'Hive' : `${title} · Hive`;
}

@Injectable({ providedIn: 'root' })
export class HiveTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.title.setTitle(formatDocumentTitle(deepestRouteTitle(snapshot.root)));
  }
}
