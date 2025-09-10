import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-headeradmin',
  templateUrl: './headeradmin.component.html',
  styleUrls: ['./headeradmin.component.scss'],
  standalone:false
})
export class HeaderadminComponent  implements OnInit {

  constructor(private router: Router) { }
    @Input() title!: string;

@Input() backbutton!: string;
  ngOnInit() {}
navigateToProfile() {
    this.router.navigate(['/profile']);
  }
}
