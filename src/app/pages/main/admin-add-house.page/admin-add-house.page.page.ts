import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-admin-add-house.page',
  templateUrl: './admin-add-house.page.page.html',
  styleUrls: ['./admin-add-house.page.page.scss'],
  standalone: false,
})
export class AdminAddHousePagePage implements OnInit {

  @Input() allUsers: any[] = []; // receive users from AdminPage
  filteredUsers: any[] = []; // filtered list of users
  searchTerm: string = '';

  newHouse = { // define an object for the new house
    number: '',
    userId: '',
    active: true
  };

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    // initialize with all users
    this.filteredUsers = [...this.allUsers];
  }

  dismiss() {
    // close the modal without returning data
    this.modalCtrl.dismiss();
  }

  save() {
    // validate that house number and user are selected
    if (!this.newHouse.number || !this.newHouse.userId) {
      return;
    }
    // close the modal and return the new house data
    this.modalCtrl.dismiss(this.newHouse);
  }

  filterUsers() {
    // filter users based on search term (name or email)
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.allUsers.filter(user =>
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  }
}
