import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SerialNameMapping } from '../../types/types';

@Component({
  selector: 'app-bridge-call',
  templateUrl: './bridge-call.component.html',
  styleUrl: './bridge-call.component.css',
})
export class BridgeCallComponent {
  CallColorOptions = [
    {name: 'Hearts', value: 'hearts'},
    {name: 'Clubs', value: 'clubs'},
    {name: 'Spades', value: 'spades'},
    {name: 'Diamons', value: 'diamonds'},
    {name: 'No Trump', value: 'nt'}
  ];
  
  CallValueOptions = [
    {name: '1', value: 1},
    {name: '2', value: 2},
    {name: '3', value: 3},
    {name: '4', value: 4},
    {name: '5', value: 5},
    {name: '6', value: 6},
    {name: '7', value: 7}
  ];

  callerOptions: {serial: string, name: string}[] = [];

  selectCall : FormGroup = new FormGroup([]);

  constructor(
    fb: FormBuilder, public dialogRef: MatDialogRef<BridgeCallComponent>, @Inject(MAT_DIALOG_DATA) public data: SerialNameMapping
  ) {
    this.selectCall = fb.group({
      color: 'hearts',
      call: 1,
      personCalled: 'one'
    });

    this.callerOptions = [
      { serial: 'one', name: data['one']},
      { serial: 'two', name: data['two']},
      { serial: 'three', name: data['three']},
      { serial: 'four', name: data['four']},
    ]
  }
}
