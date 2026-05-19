import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GameRoomComponent } from './game-room/game-room.component';
import { AuthGuard } from './auth.guard';
import { LoginComponent } from './login/login.component';
import { SupportComponent } from './support/support.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { ProfileComponent } from './profile/profile.component';

const routes: Routes = [
  {path: '', redirectTo: '/login', pathMatch: 'full'},
  {path: 'room', component: GameRoomComponent, canActivate: [AuthGuard]},
  {path: 'login', component: LoginComponent},
  {path: 'support', component: SupportComponent},
  {path: 'privacy', component: PrivacyComponent},
  {path: 'profile', component: ProfileComponent},
  {path: '**', redirectTo: '/login'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
