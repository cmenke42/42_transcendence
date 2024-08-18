import { Routes } from '@angular/router';
import { ActivateAccountComponent } from './pages/activate-account/activate-account.component';
import { ChangeEmailLinkComponent } from './pages/change-email-link/change-email-link.component';
import { ChangeEmailComponent } from './pages/change-email/change-email.component';
import { ChangePasswordComponent } from './pages/change-password/change-password.component';
import { ChatComponent } from './pages/chat/chat.component';
import { HomeComponent } from './pages/home/home.component';
import { LobbyComponent } from './pages/lobby/lobby.component';
import { LoginComponent } from './pages/login/login.component';
import { MatchMakingComponent } from './pages/match-making/match-making.component';
import { NavbarComponent } from './pages/navbar/navbar.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { OAuthCallbackComponent } from './pages/oauth/oauth.component';
import { PongGameComponent } from './pages/pong-game/pong-game.component';
import { PrivateChatComponent } from './pages/private-chat/private-chat.component';
import { ResetPasswordLinkComponent } from './pages/reset-password-link/reset-password-link.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { SettingComponent } from './pages/setting/setting.component';
import { SignupComponent } from './pages/signup/signup.component';
import { UserComponent } from './pages/user/user.component';
import { loginGuard } from './service/login.guard';
import { userGuard } from './service/user.guard';
import { UpdateUserComponent } from './pages/update-user/update-user.component';


export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full'},
    { path: 'login',					component: LoginComponent, canActivate: [loginGuard]},
    { path: 'signup',					component: SignupComponent, canActivate: [loginGuard]},

    { path: 'activate-account/:user_id_b64/:token', 		component: ActivateAccountComponent},
    { path: 'reset-password',								component: ResetPasswordLinkComponent},
    { path: 'reset-password/:user_id_b64/:token',			component: ResetPasswordComponent},
    { path: 'change-email/:user_id_b64/:email_b64/:token',	component: ChangeEmailComponent, }, 

    { path: 'change-email', component: ChangeEmailLinkComponent, canActivate: [userGuard]},
    { path: 'change-password', component: ChangePasswordComponent, canActivate: [userGuard]},


    {
        path: 'home',
        component: NavbarComponent,
        canActivate: [userGuard],
        children: [
            { path: '',					component: HomeComponent }, // Home as default
            { path: 'Users',			component: SettingComponent },
            { path: 'private_chat', 	component: PrivateChatComponent },
            { path: 'user/:user_id',	component: UserComponent },
            { path: 'change-email', 	component: ChangeEmailLinkComponent },
            { path: 'change-password',	component: ChangePasswordComponent },
			{ path: 'chat/:username',	component: ChatComponent },
            { path: 'lobby', component: LobbyComponent },
            { path: 'matchmaking/:tournament_id/:nickname', component: MatchMakingComponent},
            { path: 'chat/:tournament_id', component: ChatComponent},
            { path: 'update-user', component: UpdateUserComponent}
            { path: 'pong-match/:match_type/:match_id', component: PongGameComponent },
        ]
    },
    // { path: 'chat/:username', component: ChatComponent },

    { path: 'auth-success', component: OAuthCallbackComponent },
    { path: '404', component: NotFoundComponent},
    { path: '**', redirectTo: '/404'},

];
