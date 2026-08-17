import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface IUser {
  _id: string;
  userName: string;
  email: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FriendService {

  private baseUrl = `${environment.apiUrl}/friends`;

  constructor(private http: HttpClient) { }

  // Centralized error handler
  private handleError(error: HttpErrorResponse) {
    const errorMessage =
      error.error?.message || error.message || 'An unknown error occurred';
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Searches for users by username.
   * @param username The username to search for.
   * @returns An observable with the list of matching users.
   */
  searchUserByUsername(username: string): Observable<IUser[]> {
    const url = `${this.baseUrl}/search?username=${encodeURIComponent(username)}`;
    return this.http.get<{ users: IUser[] }>(url).pipe(
      map(response => response.users) // Extract the users array
    ).pipe(
      catchError(this.handleError)
    );
  }

  getUserDetails(friendId: string): Observable<IUser> {
    const url = `${environment.apiUrl}/auth/userDetails/${friendId}`;
    return this.http.get<{ userData: IUser | null }>(url).pipe(
      map((response) => response.userData as IUser),
      catchError(this.handleError)
    );
  }

  // Get all friends
  getAllFriends(): Observable<any>{
    const url = `${this.baseUrl}/all`;
    return this.http.get<{ friends: any[] }>(url,{
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    }).pipe(
      map(response => response.friends), // Extract the pendingRequests array
      catchError(this.handleError)
    );
  }

  // Get all Online friends
  getOnlineFriends(): Observable<any>{
    const url = `${this.baseUrl}/online`;
    return this.http.get<{ onlineFriends: any[] }>(url,{
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    }).pipe(
      map(response => response.onlineFriends), // Extract the pendingRequests array
      catchError(this.handleError)
    );
  }

  /**
   * Sends a friend request to the specified user.
   * @param receiverId The ObjectId of the user to add as a friend.
   * @returns An observable for the HTTP request.
   */
  sendFriendRequest(receiverId: string): Observable<any> {
    const url = `${this.baseUrl}/request`;
    return this.http.post(url, { receiverId }).pipe(
      catchError(this.handleError)
    );
  }


  // Get all pending friend requests
  getPendingRequests(): Observable<any> {
    const url = `${this.baseUrl}/pending_requests`;
    return this.http.get<{ pendingRequests: any[] }>(url,{
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    }).pipe(
      map(response => response.pendingRequests), // Extract the pendingRequests array
      catchError(this.handleError)
    );
  }
  

  // Accept a friend request
  acceptRequest(senderId: string): Observable<any> {
    const url = `${this.baseUrl}/accept_request`;
    return this.http.post(url, { senderId }).pipe(
      catchError(this.handleError)
    );
  }

  // Reject a friend request
  rejectRequest(senderId: string): Observable<any> {
    const url = `${this.baseUrl}/reject_request`;
    return this.http.post(url, { senderId }).pipe(
      catchError(this.handleError)
    );
  }

  unfriendUser(friendId: string) {
    const url = `${this.baseUrl}/remove_friend/${friendId}`;  // Pass friendId as a URL param
    return this.http.delete(url).pipe(
      catchError(this.handleError)
    );
  }
  
  
  blockUser(friendId: string) {
    const url = `${this.baseUrl}/block_user`
    return this.http.post(url, {friendId}).pipe(
      catchError(this.handleError)
    );
  }

  unblockUser(friendId: string) {
    const url = `${this.baseUrl}/unblock_user`
    return this.http.post(url, {friendId}).pipe(
      catchError(this.handleError)
    );
  }

  getBlockedUsers(): Observable<IUser[]> {
    const url = `${this.baseUrl}/blocked/`
    return this.http.get<{blockedUsers:IUser[]}>(url).pipe(
      map(response => response.blockedUsers || []),
      catchError(this.handleError)
    );
  }


}
