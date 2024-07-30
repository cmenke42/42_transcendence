import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';


/*            USAGE in component:
1.
import { PopupMessageService } from '../../service/popup-message.service';

2.
export class SomeComponent {
  //add to constructor:
  constructor(private popupMessageService: PopupMessageService) {}
3.
  //And call:
    //  showInfoMessage
            this.popupMessageService.showMessage('This is an info message', 'info');
    //  showSuccessMessage
            this.popupMessageService.showMessage('Operation successful!', 'success');
    //  showErrorMessage
           this.popupMessageService.showMessage('An error occurred', 'error');
  
}*/


@Component({
  selector: 'app-popup-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './popup-message.component.html',
  styleUrls: ['./popup-message.component.css']
})
export class PopupMessageComponent {
  @Input() message: string = '';
  @Input() type: 'info' | 'success' | 'error' = 'info';
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }
}
