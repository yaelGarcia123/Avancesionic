import { Component, OnInit, inject } from '@angular/core';
import { ChatService } from 'src/app/services/ChatService';
import { Utils } from 'src/app/services/utils';
import { getAuth } from 'firebase/auth';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
  standalone: false,
})
export class MessagesPage implements OnInit {

  chatSvc = inject(ChatService);
  utils = inject(Utils);

  messages: any[] = [];
  newMessage = '';
  currentUid = '';
  adminUid = '1JXW7KHFWTc130D7nVauoWp0EEt2'; // UID del admin

  ngOnInit() {
    const auth = getAuth();
    this.currentUid = auth.currentUser?.uid || '';

    if (this.currentUid) {
      this.chatSvc.getMessages(this.currentUid, this.adminUid, (msgs) => {
        this.messages = msgs;
      });
    }
  }

  async send() {
    if (!this.newMessage.trim()) return;
    await this.chatSvc.sendMessage(this.adminUid, this.newMessage);
    this.newMessage = '';
  }
}
