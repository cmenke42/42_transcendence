import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PopupMessageService {
  private messageSubject = new BehaviorSubject<{ message: string, type: 'info' | 'success' | 'error' } | null>(null);
  public message$ = this.messageSubject.asObservable();

  showMessage(message: string, type: 'info' | 'success' | 'error' = 'info') {
    this.messageSubject.next({ message, type });
  }

  closeMessage() {
    this.messageSubject.next(null);
  }
}
