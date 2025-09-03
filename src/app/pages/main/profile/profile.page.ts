import { Component,inject, OnInit } from '@angular/core';
import { Utils } from 'src/app/services/utils';
import { user } from 'src/app/models/user.model';
import { Firebase } from 'src/app/services/firebase';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
    standalone: false,

})
export class ProfilePage implements OnInit {

   //injectamos los servicios 
  firebaseSvc = inject(Firebase);
  utilsSvc = inject(Utils);

  ngOnInit() {
  }


 



}
