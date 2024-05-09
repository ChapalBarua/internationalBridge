import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ToastrModule } from 'ngx-toastr';
import { AppRoutingModule } from './app-routing.module';
import { CardComponent } from './game-room/bridge-table/card/card.component';
import { PlayerComponent } from './game-room/bridge-table/player/player.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import {MatDialogModule} from '@angular/material/dialog';
import { BridgeCallComponent } from './modals/bridge-call/bridge-call.component';
import { MatSelectModule } from '@angular/material/select';
import { PointsComponent } from './modals/points/points.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { BridgeTableComponent } from './game-room/bridge-table/bridge-table.component';
import { TableMiddleComponent } from './game-room/bridge-table/table-middle/table-middle.component';
import { GameRoomComponent } from './game-room/game-room.component';
import { GameInfoComponent } from './game-room/game-info/game-info.component';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';

const serverUrl = 'https://www.chapalbarua.com:3000';
const localServerUrl = 'https://localhost:3000';

const localServerUrl2 = 'https://10.0.0.19:3000';

const config: SocketIoConfig = { url: serverUrl, options: { autoConnect: true} };

@NgModule({
  declarations: [
    AppComponent,
    CardComponent,
    PlayerComponent,
    BridgeCallComponent,
    PointsComponent,
    BridgeTableComponent,
    TableMiddleComponent,
    GameRoomComponent,
    GameInfoComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    SocketIoModule.forRoot(config),
    ToastrModule.forRoot({
      positionClass :'toast-top-right'
    })
  ],
  providers: [
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }