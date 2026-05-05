import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-bid-label',
  templateUrl: './bid-label.component.html',
  styleUrl: './bid-label.component.css'
})
export class BidLabelComponent implements OnChanges {
  @Input() label = '';

  leadingText = '';
  trailingText = '';
  redSuit = false;

  ngOnChanges(): void {
    const match = this.label.match(/^(\d+)([♣♦♥♠]|NT)$/);

    if(!match){
      this.leadingText = this.label;
      this.trailingText = '';
      this.redSuit = false;
      return;
    }

    this.leadingText = match[1];
    this.trailingText = match[2];
    this.redSuit = this.trailingText === '♦' || this.trailingText === '♥';
  }
}
