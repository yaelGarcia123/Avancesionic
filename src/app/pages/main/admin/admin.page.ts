import { Component, Input, OnInit, } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
    standalone: false,

})
export class AdminPage implements OnInit {

  constructor(private router: Router) { }
  @Input() backbutton!: string;
  ngOnInit() {
  }
navigateToProfile() {
    this.router.navigate(['/profile']);
  }
}
