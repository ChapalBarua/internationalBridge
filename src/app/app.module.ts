import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ToastrModule } from 'ngx-toastr';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CardComponent } from './card/card.component';
import { PlayerComponent } from './player/player.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { HomeComponent } from './home/home.component';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import {MatDialogModule} from '@angular/material/dialog';
import { BridgeCallComponent } from './bridge-call/bridge-call.component';
import { MatSelectModule } from '@angular/material/select';

const config: SocketIoConfig = { url: 'https://localhost:3000', options: {} };

@NgModule({
  declarations: [
    AppComponent,
    CardComponent,
    PlayerComponent,
    HomeComponent,
    BridgeCallComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
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
  providers: [],
  bootstrap: [HomeComponent]
})
export class AppModule { }
