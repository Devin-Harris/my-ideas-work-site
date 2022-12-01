import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, Observable, of } from 'rxjs';
import { map, switchMap, catchError, withLatestFrom, tap } from 'rxjs/operators';
import { LocalStorageService } from '../../services/local-storage/local-storage.service';
import * as AuthenticationActions from './authentication.actions';
import { AuthenticationService } from './authentication.service';

@Injectable()
export class AuthenticationEffects {
  signout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthenticationActions.signout),
      switchMap((action): Observable<any> => {
        this.authService.signout();
        return EMPTY;
      })
    )
  );

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthenticationActions.login),
      switchMap(
        (action): Observable<any> =>
          this.authService.login({ email: action.email, password: action.password }).pipe(
            map((response: any) => {
              return AuthenticationActions.loginSuccess({
                ...response,
                routeToMap: action.routeToMap,
              });
            }),
            catchError((error: any) => of(AuthenticationActions.loginFailure({ error })))
          )
      )
    )
  );

  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthenticationActions.loginSuccess),
      switchMap((action): Observable<any> => {
        this.authService.setAccessToken(action.access_token);

        const parsedRoute = this.router.parseUrl(this.router.url);
        if (parsedRoute.queryParams && parsedRoute.queryParams['redirect_uri']) {
          this.router.navigateByUrl(parsedRoute.queryParams['redirect_uri']);
          return EMPTY;
        }

        if (action.routeToMap) {
          this.router.navigateByUrl('/map');
        }

        return EMPTY;
      })
    )
  );

  reauthSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthenticationActions.reAuthenticateSuccess),
      switchMap((action): Observable<any> => {
        this.authService.setAccessToken(action.access_token);
        return EMPTY;
      })
    )
  );

  reAuthenticate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthenticationActions.reAuthenticate),
      switchMap((action): Observable<any> => {
        return this.authService.reAuthenticate().pipe(
          map((response: any) => {
            return AuthenticationActions.reAuthenticateSuccess({
              user: response.user,
              access_token: response.access_token,
            });
          }),
          catchError((error: any) => {
            return of(AuthenticationActions.reAuthenticateFailure({ error }));
          })
        );
      })
    )
  );

  signup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthenticationActions.signup),
      switchMap(
        (action): Observable<any> =>
          this.authService.signup(action.createUserInfo, action.profileImage).pipe(
            map((response: any) => {
              return AuthenticationActions.signupSuccess({
                user: response.user,
                access_token: response.access_token,
              });
            }),
            catchError((error: any) => {
              return of(AuthenticationActions.signupFailure({ error }));
            })
          )
      )
    )
  );

  signupSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthenticationActions.signupSuccess),
      switchMap((action): Observable<any> => {
        this.authService.setAccessToken(action.access_token);
        return EMPTY;
      })
    )
  );

  signupFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthenticationActions.signupFailure),
      switchMap((action): Observable<any> => {
        return EMPTY;
      })
    )
  );

  constructor(
    private actions$: Actions<any>,
    private authService: AuthenticationService,
    private router: Router,
  ) {}
}
