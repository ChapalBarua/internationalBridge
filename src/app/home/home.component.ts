import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
      name: ['', [Validators.required]],
      roomId: ['', Validators.required],
    });
  }

  public onSubmit() {
    this.cardService.joinRoom(this.loginForm.get('roomId')?.value, this.loginForm.get('name')?.value);
  }
}