import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ConnectionService } from '../service/connection.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  public loginForm!: FormGroup;

  constructor(public connectionService: ConnectionService, private fb: FormBuilder) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      name: ['', [Validators.required, nameValidator]],
      roomId: ['', Validators.required],
    });
  }

  public onSubmit() {
    this.connectionService.joinRoom(this.loginForm.get('roomId')?.value, this.loginForm.get('name')?.value);
  }
}

function nameValidator(control: AbstractControl): ValidationErrors | null{
  if(avoidableNames.includes(control.value.toLowerCase())){
    return {
      invalidName: {message: "Invalid User Name"}
    };
  } else return null;
}

const avoidableNames = ["player one", "player two", "player three", "player four", "user one", "user two", "user three", "user four" ];