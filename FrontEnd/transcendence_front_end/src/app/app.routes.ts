import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { SignupComponent } from './pages/signup/signup.component';
import { userGuard } from './service/user.guard';
import { DesignComponent } from './pages/design/design.component';
import { loginGuard } from './service/login.guard';
import { SettingComponent } from './pages/setting/setting.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { ChatComponent } from './pages/chat/chat.component';
import { LocalMatchComponentComponent } from './local-match-component/local-match-component.component';


export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full'},
    { path: 'login', component: LoginComponent, canActivate: [loginGuard]},
    { path: 'signup', component: SignupComponent},
    { path : 'home', component: HomeComponent, canActivate: [userGuard]},
    { path: 'setting', component: SettingComponent},
    { path: 'design', component: DesignComponent},
    { path: '404', component: NotFoundComponent},
    { path: 'chat', component: ChatComponent},
    { path: 'match', component: LocalMatchComponentComponent},
    // otherwise redirect to home
    { path: '**', redirectTo: '/404'},

];
