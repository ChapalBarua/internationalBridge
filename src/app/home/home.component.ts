import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { CardService } from '../card.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  hideLoginForm = false;
  public loginForm!: FormGroup;

  constructor(public cardService: CardService, private fb: FormBuilder) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      name: ['', [Validators.required, nameValidator]],
      roomId: ['', Validators.required],
    });
  }

  public onSubmit() {
    this.cardService.joinRoom(this.loginForm.get('roomId')?.value, this.loginForm.get('name')?.value);
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