import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ILoginCredentials, IRegisterationCredentials, IUser } from '../models/user';
import { catchError, firstValueFrom, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

const ACCESS_TOKEN_KEY = 'hive_access_token';

@Injectable({
  providedIn: 'root',
})
export class UserAuthService {
  private baseUrl = `${environment.apiUrl}/auth`;
  /** Fallback when sessionStorage is empty or blocked. */
  private memoryToken: string | null = null;

  constructor(private http: HttpClient) {}

  persistAccessToken(token: string): void {
    this.memoryToken = token;
    try {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch {
      /* private mode / blocked storage */
    }
  }

  getAccessToken(): string | null {
    try {
      const stored = sessionStorage.getItem(ACCESS_TOKEN_KEY);
      if (stored) return stored;
    } catch {
      /* ignore */
    }
    return this.memoryToken;
  }

  clearAccessToken(): void {
    this.memoryToken = null;
    try {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch {
      /* ignore */
    }
  }

  private handleError(error: HttpErrorResponse) {
    const errorMessage =
      error.error?.message || error.message || 'An unknown error occurred';
    return throwError(() => new Error(errorMessage));
  }

  userRegister(regObj: IRegisterationCredentials): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/register`, regObj).pipe(
      tap((res: unknown) => {
        const token = (res as { token?: string })?.token;
        if (token) this.persistAccessToken(token);
      }),
      catchError(this.handleError)
    );
  }

  userLogin(loginObj: ILoginCredentials): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/login`, loginObj).pipe(
      tap((res: unknown) => {
        const token = (res as { token?: string })?.token;
        if (token) this.persistAccessToken(token);
      }),
      catchError(this.handleError)
    );
  }

  handelLogout(): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/logout`, {}).pipe(
      tap(() => this.clearAccessToken()),
      catchError(this.handleError)
    );
  }

  isUserAuthenticated(): Observable<{ message?: string; token?: string }> {
    return this.http
      .post<{ message?: string; token?: string }>(`${this.baseUrl}/isUserAuthenticated`, {})
      .pipe(
        tap((res) => {
          if (res?.token) this.persistAccessToken(res.token);
        }),
        catchError(this.handleError)
      );
  }

  /** Fetch JWT for Socket.IO using the httpOnly cookie (reliable cross-port). */
  async fetchRealtimeToken(): Promise<string> {
    const res = await firstValueFrom(
      this.http.get<{ token?: string }>(`${this.baseUrl}/realtime-token`)
    );
    const token = res?.token?.trim();
    if (!token) {
      throw new Error('Could not get realtime token. Log out and log in again.');
    }
    this.persistAccessToken(token);
    return token;
  }

  /** @deprecated use fetchRealtimeToken */
  syncRealtimeToken(): Promise<void> {
    return this.fetchRealtimeToken().then(() => undefined);
  }

  sendOtp(email: string, mode: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/send-otp`, { email, mode }).pipe(
      catchError(this.handleError)
    );
  }

  otpVerification(email: string, otp: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/otp_verify`, { email, otp }).pipe(
      catchError(this.handleError)
    );
  }

  setNewPassword(
    email: string,
    newPassword: string,
    confirmPassword: string
  ): Observable<unknown> {
    return this.http
      .post(`${this.baseUrl}/set_new_password`, { email, newPassword, confirmPassword })
      .pipe(catchError(this.handleError));
  }

  getUserDetails() {
    return this.http
      .get<{ message: string; userData: IUser & { _id?: string } | null }>(`${this.baseUrl}/details`)
      .pipe(catchError(this.handleError));
  }
}
