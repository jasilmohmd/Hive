import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  private baseUrl = `${environment.apiUrl}/image`;

  constructor(private http: HttpClient) { }

  // Centralized error handler
  private handleError(error: HttpErrorResponse) {
    const errorMessage =
      error.error?.message || error.message || 'An unknown error occurred';
    return throwError(() => new Error(errorMessage));
  }

  uploadImage(file: any, isPublic: boolean): Observable<any> {
    const url = `${this.baseUrl}/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isPublic', String(isPublic));
    return this.http.post<{imageUrl:string}>(url, formData ).pipe(
      map(response => response.imageUrl),
      catchError(this.handleError)
    );
  }

}
