import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ConnectionService } from '../service/connection.service';
import { ActiveRoomSummary } from '../types/types';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  public loginForm!: FormGroup;
  activeRooms: ActiveRoomSummary[] = [];

  constructor(public connectionService: ConnectionService, private fb: FormBuilder) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      name: ['', [Validators.required, nameValidator]],
      roomId: [''],
    });

    this.connectionService.activeRooms$.subscribe((rooms) => {
      this.activeRooms = rooms;
    });
    this.connectionService.requestActiveRooms();
  }

  public onSubmit() {
    const selectedRoomId = this.loginForm.get('roomId')?.value;
    if (!selectedRoomId) {
      return;
    }

    this.connectionService.joinRoom(selectedRoomId, this.loginForm.get('name')?.value);
  }

  public createRoom() {
    this.connectionService.createRoom(this.loginForm.get('name')?.value);
  }
}

function nameValidator(control: AbstractControl): ValidationErrors | null{
  if(!control.value) return null;
  if(avoidableNames.includes(control.value.toLowerCase())){
    return {
      invalidName: {message: "Invalid User Name"}
    };
  } else return null;
}

const avoidableNames = ["player one", "player two", "player three", "player four", "user one", "user two", "user three", "user four" ];
