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
import { PrivateChatComponent } from './pages/private-chat/private-chat.component';
import { UserComponent } from './pages/user/user.component';
import { LocalMatchComponentComponent } from './local-match-component/local-match-component.component';
import { OAuthCallbackComponent } from './pages/oauth/oauth.component';
import { ActivateAccountComponent } from './pages/activate-account/activate-account.component';
import { ResetPasswordLinkComponent } from './pages/reset-password-link/reset-password-link.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { ChangeEmailLinkComponent } from './pages/change-email-link/change-email-link.component';
import { ChangeEmailComponent } from './pages/change-email/change-email.component';
import { ChangePasswordComponent } from './pages/change-password/change-password.component';
import { NavbarComponent } from './pages/navbar/navbar.component';
import { LobbyComponent } from './pages/lobby/lobby.component';
import { Component } from '@angular/core';
import { MatchMakingComponent } from './pages/match-making/match-making.component';


export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full'},
    { path: 'login',					component: LoginComponent, canActivate: [loginGuard]},
    { path: 'signup',					component: SignupComponent, canActivate: [loginGuard]},

    { path: 'activate-account/:user_id_b64/:token', 		component: ActivateAccountComponent},
    { path: 'reset-password',								component: ResetPasswordLinkComponent},
    { path: 'reset-password/:user_id_b64/:token',			component: ResetPasswordComponent},
    { path: 'change-email/:user_id_b64/:email_b64/:token',	component: ChangeEmailComponent, }, 

   // { path: 'change-password', component: ChangePasswordComponent, canActivate: [userGuard]},
    { path: 'match',					component: LocalMatchComponentComponent },
    {
        path: 'home',
        component: NavbarComponent,
        canActivate: [userGuard],
        children: [
            { path: '',					component: HomeComponent }, // Home as default
            { path: 'setting',			component: SettingComponent },
            { path: 'private_chat', 	component: PrivateChatComponent },
            { path: 'user/:user_id',	component: UserComponent },
            { path: 'change-email', 	component: ChangeEmailLinkComponent },
            { path: 'change-password',	component: ChangePasswordComponent },
			{ path: 'chat/:username',	component: ChatComponent },
            { path: 'lobby', component: LobbyComponent },
            { path: 'matchmaking/:tournament_id/:nickname', component: MatchMakingComponent},
            { path: 'chat/:tournament_id', component: ChatComponent}
        ]
    },
    // { path: 'chat/:username', component: ChatComponent },
    { path: 'design', component: DesignComponent },
    { path: 'auth-success', component: OAuthCallbackComponent },
    { path: '404', component: NotFoundComponent},
    { path: '**', redirectTo: '/404'},

];

// { path: 'navbar', component: NavbarComponent, canActivate: [userGuard]},
// { path: 'design', component: DesignComponent},
// { path: 'chat/:username', component: ChatComponent, canActivate: [userGuard]},
// { path: 'private_chat', component: PrivateChatComponent, canActivate: [userGuard]},
// { path: 'setting', component: SettingComponent, canActivate: [userGuard]},
// { path : 'home', component: HomeComponent, canActivate: [userGuard]},
// {path: 'user/:user_id', component: UserComponent, canActivate: [userGuard]},
// { path: 'match', component: LocalMatchComponentComponent},
  // Navbar as the shell component
