import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import ICommunity from '../models/community';
import { ITag } from '../models/tag';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommunityService {

  private baseUrl = `${environment.apiUrl}/community`;

  constructor(private http: HttpClient) { }

  // Centralized error handler
  private handleError(error: HttpErrorResponse) {
    const errorMessage =
      error.error?.message || error.message || 'An unknown error occurred';
    return throwError(() => new Error(errorMessage));
  }

  createCommunity(data: Partial<ICommunity>): Observable<Partial<ICommunity>> {
    const url = `${this.baseUrl}/create`;
    return this.http.post(url, { data }).pipe(
      catchError(this.handleError)
    );
  }

  getCommunitiesByUser(): Observable<ICommunity[]> {
    const url = `${this.baseUrl}/user`
    return this.http.get<{ communities: ICommunity[] }>(url).pipe(
      map(response => response.communities),
      catchError(this.handleError)
    );
  }

  listCommunities(): Observable<ICommunity[]> {
    const url = `${this.baseUrl}/`;
    return this.http.get<{ communities: ICommunity[] }>(url).pipe(
      map((response) => response.communities),
      catchError(this.handleError)
    );
  }

  getCommunityById(id: string): Observable<ICommunity> {
    const url = `${this.baseUrl}/${id}`
    return this.http.get<{ community: ICommunity }>(url).pipe(
      map(response => response.community),
      catchError(this.handleError)
    );
  }

  // Get all Tags
  getAllTags(): Observable<ITag[]> {
    const url = `${this.baseUrl}/tags`;
    return this.http.get<{ tags: ITag[] }>(url, {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    }).pipe(
      map(response => response.tags), // Extract the pendingRequests array
      catchError(this.handleError)
    );
  }

  geTagById(id: string): Observable<ITag> {
    const url = `${this.baseUrl}/tag/${id}`;
    return this.http.get<{ tag: ITag }>(url, {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    }).pipe(
      map(response => response.tag), // Extract the pendingRequests array
      catchError(this.handleError)
    );
  }

  addMember(communityId: string, memberId: string, roleId: string) {
    const url = `${this.baseUrl}/member/add/${communityId}`;
    return this.http.post(url, { memberId, roleId }).pipe(
      catchError(this.handleError)
    );
  }

  removeMember(communityId: string, memberId: string) {
    const url = `${this.baseUrl}/member/remove/${communityId}`;
    return this.http.post(url, { memberId }).pipe(
      catchError(this.handleError)
    );
  }

  /** Kick a member — the narrower KICK_MEMBERS path (vs removeMember's MANAGE_MEMBERS). */
  kickMember(communityId: string, memberId: string): Observable<{ success: boolean }> {
    const url = `${this.baseUrl}/kick/${communityId}`;
    return this.http.post<{ success: boolean }>(url, { memberId }).pipe(
      catchError(this.handleError)
    );
  }

  /** Send a join request for a (private) community. */
  requestToJoinCommunity(communityId: string): Observable<{ success: boolean }> {
    const url = `${this.baseUrl}/request/${communityId}`;
    return this.http.post<{ success: boolean }>(url, {}).pipe(
      catchError(this.handleError)
    );
  }

  /** Approve a pending join request, assigning the given role to the new member. */
  approveJoinRequest(
    communityId: string,
    memberId: string,
    roleId: string
  ): Observable<{ success: boolean }> {
    const url = `${this.baseUrl}/approve_request/${communityId}`;
    return this.http.post<{ success: boolean }>(url, { memberId, roleId }).pipe(
      catchError(this.handleError)
    );
  }

  /** Reject a pending join request. */
  rejectJoinRequest(
    communityId: string,
    memberId: string
  ): Observable<{ success: boolean }> {
    const url = `${this.baseUrl}/reject_request/${communityId}`;
    return this.http.post<{ success: boolean }>(url, { memberId }).pipe(
      catchError(this.handleError)
    );
  }

  /** Leave a community. Rejected server-side if the caller is the owner. */
  leaveCommunity(communityId: string): Observable<{ success: boolean }> {
    const url = `${this.baseUrl}/leave/${communityId}`;
    return this.http.post<{ success: boolean }>(url, {}).pipe(
      catchError(this.handleError)
    );
  }

  /** Delete a community (and its roles/channels). Requires MANAGE_COMMUNITY. */
  deleteCommunity(communityId: string): Observable<{ success: boolean }> {
    const url = `${this.baseUrl}/delete/${communityId}`;
    return this.http.delete<{ success: boolean }>(url).pipe(
      catchError(this.handleError)
    );
  }

  /** Attach an existing tag to a community. Requires MANAGE_TAG. */
  addTag(communityId: string, tagId: string): Observable<{ success: boolean }> {
    const url = `${this.baseUrl}/add_tag/${communityId}/${tagId}`;
    return this.http.post<{ success: boolean }>(url, {}).pipe(
      catchError(this.handleError)
    );
  }

  /** Remove a tag from a community. Requires MANAGE_TAG. */
  removeTag(communityId: string, tagId: string): Observable<{ success: boolean }> {
    const url = `${this.baseUrl}/remove_tag/${communityId}/${tagId}`;
    return this.http.delete<{ success: boolean }>(url).pipe(
      catchError(this.handleError)
    );
  }

  updateCommunity(
    communityId: string,
    data: Partial<ICommunity>
  ): Observable<ICommunity> {
    const url = `${this.baseUrl}/update/${communityId}`;
    return this.http
      .put<{ updatedCommunity: ICommunity }>(url, { data })
      .pipe(
        map((res) => res.updatedCommunity),
        catchError(this.handleError)
      );
  }

}
