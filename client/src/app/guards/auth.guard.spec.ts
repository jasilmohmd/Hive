import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { AuthGuardChild } from './auth.guard';  // Replace with your actual path
import { UserAuthService } from '../services/user-auth.service';  // Replace with your actual path

describe('AuthGuardChild', () => {
  let guard: AuthGuardChild;
  let authService: jasmine.SpyObj<UserAuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('UserAuthService', ['isUserAuthenticated']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuardChild,
        { provide: UserAuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AuthGuardChild);
    authService = TestBed.inject(UserAuthService) as jasmine.SpyObj<UserAuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access if the user is authenticated and not trying to access /auth routes', (done) => {
    // Arrange
    const mockRoute = {} as ActivatedRouteSnapshot;
    const mockState = { url: '/home' } as RouterStateSnapshot;
    
    authService.isUserAuthenticated.and.returnValue(of(true));  // Simulating authenticated user

    // Act
    guard.canActivateChild(mockRoute, mockState).subscribe((result) => {
      // Assert
      expect(result).toBeTrue();
      done();
    });
  });

  it('should block access and redirect to home if the user is authenticated and trying to access /auth routes', (done) => {
    // Arrange
    const mockRoute = {} as ActivatedRouteSnapshot;
    const mockState = { url: '/auth/login' } as RouterStateSnapshot;
    
    authService.isUserAuthenticated.and.returnValue(of(true));  // Simulating authenticated user

    // Act
    guard.canActivateChild(mockRoute, mockState).subscribe((result) => {
      // Assert
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
      expect(result).toBeFalse();
      done();
    });
  });

  it('should allow access to /auth routes if the user is not authenticated', (done) => {
    // Arrange
    const mockRoute = {} as ActivatedRouteSnapshot;
    const mockState = { url: '/auth/login' } as RouterStateSnapshot;
    
    authService.isUserAuthenticated.and.returnValue(of(false));  // Simulating unauthenticated user

    // Act
    guard.canActivateChild(mockRoute, mockState).subscribe((result) => {
      // Assert
      expect(result).toBeTrue();
      done();
    });
  });

  it('should block access and redirect to login if the user is not authenticated and trying to access other routes', (done) => {
    // Arrange
    const mockRoute = {} as ActivatedRouteSnapshot;
    const mockState = { url: '/home' } as RouterStateSnapshot;
    
    authService.isUserAuthenticated.and.returnValue(of(false));  // Simulating unauthenticated user

    // Act
    guard.canActivateChild(mockRoute, mockState).subscribe((result) => {
      // Assert
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      expect(result).toBeFalse();
      done();
    });
  });
});
