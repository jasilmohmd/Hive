import { TestBed } from '@angular/core/testing';

import { CommunityService } from './community.service';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../environments/environment';

describe('CommunityService', () => {
  let service: CommunityService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/community`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CommunityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('requestToJoinCommunity POSTs to /request/:id', () => {
    service.requestToJoinCommunity('c1').subscribe();
    const req = httpMock.expectOne(`${base}/request/c1`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
  });

  it('approveJoinRequest POSTs memberId and roleId', () => {
    service.approveJoinRequest('c1', 'm1', 'r1').subscribe();
    const req = httpMock.expectOne(`${base}/approve_request/c1`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ memberId: 'm1', roleId: 'r1' });
    req.flush({ success: true });
  });

  it('rejectJoinRequest POSTs memberId', () => {
    service.rejectJoinRequest('c1', 'm1').subscribe();
    const req = httpMock.expectOne(`${base}/reject_request/c1`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ memberId: 'm1' });
    req.flush({ success: true });
  });

  it('leaveCommunity POSTs to /leave/:id', () => {
    service.leaveCommunity('c1').subscribe();
    const req = httpMock.expectOne(`${base}/leave/c1`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
  });

  it('deleteCommunity DELETEs /delete/:id', () => {
    service.deleteCommunity('c1').subscribe();
    const req = httpMock.expectOne(`${base}/delete/c1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });

  it('addTag POSTs /add_tag/:id/:tagId', () => {
    service.addTag('c1', 't1').subscribe();
    const req = httpMock.expectOne(`${base}/add_tag/c1/t1`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
  });

  it('removeTag DELETEs /remove_tag/:id/:tagId', () => {
    service.removeTag('c1', 't1').subscribe();
    const req = httpMock.expectOne(`${base}/remove_tag/c1/t1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });
});
