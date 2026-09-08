import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { catchError, map, Observable, throwError } from 'rxjs';
import { IRole } from '../models/role';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private baseUrl = `${environment.apiUrl}/role`;

  constructor(private http: HttpClient) { }

  // Centralized error handler
  private handleError(error: HttpErrorResponse) {
    const errorMessage =
      error.error?.message || error.message || 'An unknown error occurred';
    return throwError(() => new Error(errorMessage));
  }

  getUserRoles(communityId:string): Observable<IRole[]>{
    const url = `${this.baseUrl}/user/${communityId}`;
        return this.http.get<{ roles: IRole[] }>(url, {
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        }).pipe(
          map(response => response.roles), // Extract the pendingRequests array
          catchError(this.handleError)
        );
  }

  /** All roles defined in a community (members only). */
  listRoles(communityId: string): Observable<IRole[]> {
    const url = `${this.baseUrl}/list/${communityId}`;
    return this.http.get<{ roles: IRole[] }>(url, {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    }).pipe(
      map(response => response.roles),
      catchError(this.handleError)
    );
  }

  /** Create a custom role. Requires MANAGE_ROLES. `permissions` must be non-empty. */
  createRole(communityId: string, data: { name: string; permissions: string[] }): Observable<IRole> {
    const url = `${this.baseUrl}/create/${communityId}`;
    return this.http.post<IRole>(url, data).pipe(catchError(this.handleError));
  }

  /** Update a custom role's name / permissions. Default roles are rejected server-side. */
  updateRole(
    communityId: string,
    roleId: string,
    data: { name: string; permissions: string[] }
  ): Observable<IRole> {
    const url = `${this.baseUrl}/update/${communityId}/${roleId}`;
    return this.http.put<IRole>(url, data).pipe(catchError(this.handleError));
  }

  /** Delete a custom role. Also detaches it from every member server-side. */
  deleteRole(communityId: string, roleId: string): Observable<{ success: boolean }> {
    const url = `${this.baseUrl}/delete/${communityId}/${roleId}`;
    return this.http.delete<{ success: boolean }>(url).pipe(catchError(this.handleError));
  }

  /** Give an existing member a role. Requires MANAGE_ROLES. */
  assignRole(communityId: string, memberId: string, roleId: string): Observable<{ success: boolean }> {
    const url = `${this.baseUrl}/assign/${communityId}`;
    return this.http.post<{ success: boolean }>(url, { memberId, roleId }).pipe(catchError(this.handleError));
  }

  /** Remove a role from a member. Rejected if it's their last role. */
  unassignRole(communityId: string, memberId: string, roleId: string): Observable<{ success: boolean }> {
    const url = `${this.baseUrl}/unassign/${communityId}`;
    return this.http.post<{ success: boolean }>(url, { memberId, roleId }).pipe(catchError(this.handleError));
  }

}
