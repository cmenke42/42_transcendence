import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { PopupMessageService } from './service/popup-message.service';
import { Observable } from 'rxjs';
import { PopupMessageComponent } from './pages/popup-message/popup-message.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, CommonModule, TranslateModule, PopupMessageComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  
})
export class AppComponent implements OnInit {
  title = 'transcendence_front_end';
  popupMessage$: Observable<{ message: string, type: 'info' | 'success' | 'error' } | null>;
  
  constructor(private translate: TranslateService, private popupMessageService: PopupMessageService) {
      this.popupMessage$ = this.popupMessageService.message$;
    }

  ngOnInit(): void {
    const body=document.body as HTMLElement
    body.setAttribute('data-bs-theme','dark')
  }

  useLanguage(language: string): void {
    this.translate.use(language);
  }

  closePopup() {
    this.popupMessageService.closeMessage();
  }  
}
