import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { UserAuthService } from '../services/user-auth.service';
import { ChatService } from '../services/chat.service';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

/** Where a signed-in user lands when they hit a page meant for signed-out users. */
const SIGNED_IN_HOME = '/main/discover';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardChild implements CanActivate, CanActivateChild {
  constructor(
    private authService: UserAuthService,
    private router: Router,
    private chat: ChatService
  ) {}

  /**
   * The landing page. Public — but a signed-in visitor has no use for it, so
   * send them into the app. (This used to be declared as canActivateChild on
   * a route with no children, which Angular never runs.)
   */
  canActivate(): Observable<boolean | UrlTree> {
    return this.session().pipe(
      map(() => this.router.createUrlTree([SIGNED_IN_HOME])),
      catchError(() => of(true))
    );
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.session().pipe(
      map(() => {
        // Signed in and heading for login/register etc.: nothing to do there.
        if (state.url.startsWith('/auth')) {
          return this.router.createUrlTree([SIGNED_IN_HOME]);
        }

        if (state.url.startsWith('/main')) {
          void this.chat.connectRealtime().catch(() => undefined);
        }
        return true;
      }),
      catchError(() => {
        // Signed out: the auth pages are the only ones open to you.
        if (state.url.startsWith('/auth')) {
          return of(true);
        }
        return of(this.router.createUrlTree(['/auth/login']));
      })
    );
  }

  private session(): Observable<{ message?: string; token?: string }> {
    return this.authService.isUserAuthenticated().pipe(
      tap((response) => {
        if (response?.token) {
          this.authService.persistAccessToken(response.token);
        }
      })
    );
  }
}
