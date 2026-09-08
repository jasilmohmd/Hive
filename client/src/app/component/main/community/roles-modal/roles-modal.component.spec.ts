import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { RolesModalComponent } from './roles-modal.component';
import { environment } from '../../../../../environments/environment';

describe('RolesModalComponent', () => {
  let component: RolesModalComponent;
  let fixture: ComponentFixture<RolesModalComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolesModalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(RolesModalComponent);
    component = fixture.componentInstance;
    component.communityId = 'c1';
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/role/list/c1`).flush({ roles: [] });
  });

  afterEach(() => httpMock.verify());

  it('should create and load roles', () => {
    expect(component).toBeTruthy();
    expect(component.loading).toBeFalse();
  });

  it('create form requires a name and at least one permission', () => {
    component.startCreate();
    expect(component.form.permissions.size).toBe(1); // VIEW_CONTENT seeded
    component.form.name = '';
    expect(component.canSave).toBeFalse();
    component.form.name = 'Helper';
    expect(component.canSave).toBeTrue();
    component.form.permissions.clear();
    expect(component.canSave).toBeFalse();
  });

  it('togglePermission adds and removes', () => {
    component.startCreate();
    component.togglePermission('MANAGE_CHANNELS');
    expect(component.form.permissions.has('MANAGE_CHANNELS')).toBeTrue();
    component.togglePermission('MANAGE_CHANNELS');
    expect(component.form.permissions.has('MANAGE_CHANNELS')).toBeFalse();
  });
});
