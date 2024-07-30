import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserProfile } from '../interface/user-profile';

@Injectable({
  providedIn: 'root'
})
export class ProfileUpdateService {
  private profileSource = new BehaviorSubject<UserProfile | null>(null);
  currentProfile = this.profileSource.asObservable();

  updateProfile(profile: UserProfile) {
    this.profileSource.next(profile);
  }


  
}