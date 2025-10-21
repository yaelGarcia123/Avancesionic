import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';

import { inject, Injectable } from '@angular/core';
import { AuthServ } from '../services/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  firebaseAuth = inject(AuthServ);
  constructor(private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // console.log(next);
    //debugger;
    console.log(state.url);

    if (this.firebaseAuth.authenticated) {
      console.log('VERDADERO');
      return true;
    } else {
      if (state.url !== '/auth') {
        console.log('NAVEGANDO A AUTH');
        this.router.navigate(['auth']);
      }
      console.log('FALSO');
      return false;
    }
  }
}
