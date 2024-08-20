import { Component, OnInit, OnDestroy } from '@angular/core'; // Import OnDestroy
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PopupMessageService } from '../../service/popup-message.service';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-oauth-callback',
  template: '<p>Intra authentication in process.</p>'
})
export class OAuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private popupMessageService: PopupMessageService,

  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      if (code) {
        this.exchangeCode(code);
      } else {
        console.error('code not found in query params');
        this.router.navigate(['/login']);
      }
    });
  }
  


  exchangeCode(code: string) {
    const validationUrl = 'https://'+environment.HOST_IP+':6010/api/v1/exchange-code/';
    const payload = { code };
    if (code == 'deactivated')
    {      
      this.popupMessageService.showMessage('Your account is deactivated. Please contact the administrator.', 'error');
      this.router.navigate(['/login']);
      return;
    }
     this.http.post(validationUrl, payload).subscribe(
      (response: any) => {
        localStorage.setItem('refresh_token', response.refresh);
        localStorage.setItem('access_token', response.access);
        this.router.navigate(['/home']);
      },
      (error) => {
        console.error('Error exchanging code:', error);
        this.router.navigate(['/login']);
      }
    );
  }

}

