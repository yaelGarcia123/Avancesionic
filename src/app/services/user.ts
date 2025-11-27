import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { UserSystem } from '../models/UserSystem';
import { Utils } from './utils';

@Injectable({
  providedIn: 'root',
})
export class UserServ {
  utilsSvc = inject(Utils);
  currentUser = new BehaviorSubject<UserSystem>(null as unknown as UserSystem);

  async redirectByRole() {
    const user = this.currentUser.value;
    console.log('User data:', user);
    
    if (user?.admin) {
      this.utilsSvc.routerLink('/main/admin');
    } else if (user?.manager) {
      this.utilsSvc.routerLink('/main/manager-tickets');
    } else {
      this.utilsSvc.routerLink('/main/home');
    }
  }
}