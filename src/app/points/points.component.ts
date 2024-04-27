import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-points',
  templateUrl: './points.component.html',
  styleUrl: './points.component.css'
})
export class PointsComponent {
  pointsForm : FormGroup = new FormGroup([]);

  constructor(fb: FormBuilder, public dialogRef: MatDialogRef<PointsComponent>) {
    this.pointsForm = fb.group({
      team1: [0, [Validators.required, Validators.pattern(/^\d+$/)]],
      team2: [0, [Validators.required, Validators.pattern(/^\d+$/)]],
      activeGamesByTeam1: [0, [Validators.required, Validators.min(0), Validators.max(1)]],
      activeGamesByTeam2: [0, [Validators.required, Validators.min(0), Validators.max(1)]]
    });
  }
}
