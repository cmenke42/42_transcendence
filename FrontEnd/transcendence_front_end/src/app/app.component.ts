import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';




@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'transcendence_front_end';

  ngOnInit(): void {
    const body=document.body as HTMLElement
    body.setAttribute('data-bs-theme','dark')
  }
}
