import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private baseUrl = `${environment.apiUrl}/profile`;

  constructor(private http: HttpClient) { }

  // Centralized error handler
  private handleError(error: HttpErrorResponse) {
    const errorMessage =
      error.error?.message || error.message || 'An unknown error occurred';
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Edit the user's profile (update username).
   * Expects { newUserName: string } in the body.
   */
  editProfile(newUserName: string): Observable<any> {
    const url = `${this.baseUrl}/edit_profile`;
    return this.http.put(url, { newUserName }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Change the user's password.
   * Expects { oldPassword: string, newPassword: string } in the body.
   */
  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    const url = `${this.baseUrl}/change_password`;
    return this.http.put(url, { oldPassword, newPassword }).pipe(
      catchError(this.handleError)
    );
  }

  /** Persist profile photo URL from ImageService, or clear when null/empty. */
  updateAvatar(imageUrl: string | null): Observable<void> {
    const url = `${this.baseUrl}/avatar`;
    const body =
      imageUrl === null || imageUrl === ''
        ? { imageUrl: '' }
        : { imageUrl };
    return this.http.put(url, body).pipe(
      map(() => undefined),
      catchError(this.handleError)
    );
  }

}
