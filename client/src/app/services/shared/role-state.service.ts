import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { IRole } from '../../models/role';
import { RoleService } from '../role.service';

@Injectable({
  providedIn: 'root'
})
export class RoleStateService {
  private userRolesSubject = new BehaviorSubject<IRole[]>([]);
  userRoles$ = this.userRolesSubject.asObservable();

  private permissionsSubject = new BehaviorSubject<string[]>([]);
  permissions$ = this.permissionsSubject.asObservable();

  constructor(private roleService: RoleService) {}

  /**
   * Load user roles for the given community and update the internal state.
   */
  loadUserRoles(communityId: string): Observable<IRole[]> {
    return this.roleService.getUserRoles(communityId).pipe(
      tap(roles => {
        // Emit a new copy to force change detection if needed
        this.userRolesSubject.next([...roles]);
        // Extract unique permissions from all roles.
        const permissionSet = new Set<string>();
        roles.forEach(role => {
          role.permissions.forEach(permission => permissionSet.add(permission));
        });
        this.permissionsSubject.next(Array.from(permissionSet));
      }),
      // No roles = no permissions: every gated control stays hidden, which is
      // the safe failure. The server enforces permissions regardless.
      catchError(() => of([]))
    );
  }

  /** Drop cached roles/permissions so stale data doesn't linger across sessions (e.g. on logout). */
  clear(): void {
    this.userRolesSubject.next([]);
    this.permissionsSubject.next([]);
  }
}
