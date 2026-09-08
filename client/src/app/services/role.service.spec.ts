import { TestBed } from '@angular/core/testing';

import { RoleService } from './role.service';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../environments/environment';

describe('RoleService', () => {
  let service: RoleService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/role`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RoleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('listRoles GETs /list/:id and unwraps { roles }', () => {
    let result: unknown;
    service.listRoles('c1').subscribe(r => (result = r));
    const req = httpMock.expectOne(`${base}/list/c1`);
    expect(req.request.method).toBe('GET');
    req.flush({ roles: [{ _id: 'r1' }] });
    expect(result).toEqual([{ _id: 'r1' }] as any);
  });

  it('createRole POSTs name + permissions', () => {
    service.createRole('c1', { name: 'Helper', permissions: ['VIEW_CONTENT'] }).subscribe();
    const req = httpMock.expectOne(`${base}/create/c1`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Helper', permissions: ['VIEW_CONTENT'] });
    req.flush({});
  });

  it('updateRole PUTs to /update/:id/:roleId', () => {
    service.updateRole('c1', 'r1', { name: 'X', permissions: ['VIEW_CONTENT'] }).subscribe();
    const req = httpMock.expectOne(`${base}/update/c1/r1`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('deleteRole DELETEs /delete/:id/:roleId', () => {
    service.deleteRole('c1', 'r1').subscribe();
    const req = httpMock.expectOne(`${base}/delete/c1/r1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });

  it('assignRole / unassignRole POST memberId + roleId', () => {
    service.assignRole('c1', 'm1', 'r1').subscribe();
    let req = httpMock.expectOne(`${base}/assign/c1`);
    expect(req.request.body).toEqual({ memberId: 'm1', roleId: 'r1' });
    req.flush({ success: true });

    service.unassignRole('c1', 'm1', 'r1').subscribe();
    req = httpMock.expectOne(`${base}/unassign/c1`);
    expect(req.request.body).toEqual({ memberId: 'm1', roleId: 'r1' });
    req.flush({ success: true });
  });
});
