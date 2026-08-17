import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthGuardChild } from './auth.guard';
import { UserAuthService } from '../services/user-auth.service';
import { ChatService } from '../services/chat.service';

describe('AuthGuardChild', () => {
  let guard: AuthGuardChild;
  let authService: jasmine.SpyObj<UserAuthService>;
  let router: jasmine.SpyObj<Router>;
  let chat: jasmine.SpyObj<ChatService>;

  /** The session check resolves with the session payload when signed in... */
  const authenticated = (token?: string) =>
    of<{ message?: string; token?: string }>({ message: 'ok', token });

  /** ...and errors when not, which is the branch the guard's catchError handles. */
  const notAuthenticated = () => throwError(() => new Error('Not authenticated'));

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj<UserAuthService>('UserAuthService', [
      'isUserAuthenticated',
      'persistAccessToken',
    ]);
    const routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const chatSpy = jasmine.createSpyObj<ChatService>('ChatService', ['connectRealtime']);
    chatSpy.connectRealtime.and.returnValue(Promise.resolve({} as never));

    TestBed.configureTestingModule({
      providers: [
        AuthGuardChild,
        { provide: UserAuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ChatService, useValue: chatSpy },
      ],
    });

    guard = TestBed.inject(AuthGuardChild);
    authService = TestBed.inject(UserAuthService) as jasmine.SpyObj<UserAuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    chat = TestBed.inject(ChatService) as jasmine.SpyObj<ChatService>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access if the user is authenticated and not trying to access /auth routes', (done) => {
    // Arrange
    const mockRoute = {} as ActivatedRouteSnapshot;
    const mockState = { url: '/home' } as RouterStateSnapshot;

    authService.isUserAuthenticated.and.returnValue(authenticated());

    // Act
    guard.canActivateChild(mockRoute, mockState).subscribe((result) => {
      // Assert
      expect(result).toBeTrue();
      expect(router.navigate).not.toHaveBeenCalled();
      done();
    });
  });

  it('should persist a returned token and open the realtime connection for /main routes', (done) => {
    // Arrange
    const mockRoute = {} as ActivatedRouteSnapshot;
    const mockState = { url: '/main/discover' } as RouterStateSnapshot;

    authService.isUserAuthenticated.and.returnValue(authenticated('jwt-token'));

    // Act
    guard.canActivateChild(mockRoute, mockState).subscribe((result) => {
      // Assert
      expect(result).toBeTrue();
      expect(authService.persistAccessToken).toHaveBeenCalledWith('jwt-token');
      expect(chat.connectRealtime).toHaveBeenCalled();
      done();
    });
  });

  it('should block access and redirect to discover if the user is authenticated and trying to access /auth routes', (done) => {
    // Arrange
    const mockRoute = {} as ActivatedRouteSnapshot;
    const mockState = { url: '/auth/login' } as RouterStateSnapshot;

    authService.isUserAuthenticated.and.returnValue(authenticated());

    // Act
    guard.canActivateChild(mockRoute, mockState).subscribe((result) => {
      // Assert
      expect(router.navigate).toHaveBeenCalledWith(['/main/discover']);
      expect(result).toBeFalse();
      done();
    });
  });

  it('should allow access to /auth routes if the user is not authenticated', (done) => {
    // Arrange
    const mockRoute = {} as ActivatedRouteSnapshot;
    const mockState = { url: '/auth/login' } as RouterStateSnapshot;

    authService.isUserAuthenticated.and.returnValue(notAuthenticated());

    // Act
    guard.canActivateChild(mockRoute, mockState).subscribe((result) => {
      // Assert
      expect(result).toBeTrue();
      expect(router.navigate).not.toHaveBeenCalled();
      done();
    });
  });

  it('should block access and redirect to login if the user is not authenticated and trying to access other routes', (done) => {
    // Arrange
    const mockRoute = {} as ActivatedRouteSnapshot;
    const mockState = { url: '/home' } as RouterStateSnapshot;

    authService.isUserAuthenticated.and.returnValue(notAuthenticated());

    // Act
    guard.canActivateChild(mockRoute, mockState).subscribe((result) => {
      // Assert
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
      expect(result).toBeFalse();
      done();
    });
  });
});
