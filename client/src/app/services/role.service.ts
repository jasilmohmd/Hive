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

}
