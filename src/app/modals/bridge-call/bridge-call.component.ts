import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BidColor, CallInfo, SerialNameMapping } from '../../types/types';

type BidOption = {
  label: string;
  value: {
    call: number;
    color: BidColor;
  };
};

type BridgeCallDialogData = {
  players: SerialNameMapping;
  highestBid: CallInfo | null;
  canDouble: boolean;
  isDoubled: boolean;
};

@Component({
  selector: 'app-bridge-call',
  templateUrl: './bridge-call.component.html',
  styleUrl: './bridge-call.component.css',
})
export class BridgeCallComponent {
  readonly selectCall: FormGroup;
  readonly bidOptions: BidOption[];
  readonly highestBidLabel: string;
  readonly canDouble: boolean;

  constructor(
    fb: FormBuilder,
    public dialogRef: MatDialogRef<BridgeCallComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BridgeCallDialogData
  ) {
    this.bidOptions = this.getAllBidOptions().filter(option => this.isHigherBid(option.value, data.highestBid));
    this.highestBidLabel = data.highestBid ? this.formatBid(data.highestBid.call, data.highestBid.color, data.isDoubled) : 'No bid yet';
    this.canDouble = data.canDouble;
    this.selectCall = fb.group({
      bidKey: this.bidOptions[0]?.label ?? ''
    });
  }

  onPass(){
    this.dialogRef.close({
      call: this.data.highestBid?.call ?? 1,
      color: this.data.highestBid?.color ?? 'clubs',
      personCalled: 'one',
      pass: true
    });
  }

  onBid(){
    const selectedBid = this.bidOptions.find(option=>option.label === this.selectCall.value.bidKey);
    if(!selectedBid){
      return;
    }

    this.dialogRef.close({
      call: selectedBid.value.call,
      color: selectedBid.value.color,
      personCalled: 'one'
    });
  }

  onDouble(){
    if(!this.data.highestBid || !this.canDouble){
      return;
    }

    this.dialogRef.close({
      call: this.data.highestBid.call,
      color: this.data.highestBid.color,
      personCalled: 'one',
      double: true
    });
  }

  private getAllBidOptions(): BidOption[]{
    const colors: { label: string, value: BidColor }[] = [
      { label: 'Clubs', value: 'clubs' },
      { label: 'Diamonds', value: 'diamonds' },
      { label: 'Hearts', value: 'hearts' },
      { label: 'Spades', value: 'spades' },
      { label: 'No Trump', value: 'nt' }
    ];

    const options: BidOption[] = [];
    for(let call = 1; call <= 7; call++){
      for(const color of colors){
        options.push({
          label: this.formatBid(call, color.value),
          value: {
            call,
            color: color.value
          }
        });
      }
    }

    return options;
  }

  private isHigherBid(proposedBid: { call: number, color: BidColor }, currentBid: CallInfo | null){
    if(!currentBid){
      return true;
    }

    return proposedBid.call > currentBid.call ||
      (proposedBid.call === currentBid.call && this.getBidRank(proposedBid.color) > this.getBidRank(currentBid.color));
  }

  private getBidRank(color: BidColor){
    return {
      clubs: 0,
      diamonds: 1,
      hearts: 2,
      spades: 3,
      nt: 4
    }[color];
  }

  private formatBid(call: number, color: BidColor, isDoubled = false){
    const labels = {
      clubs: '♣',
      diamonds: '♦',
      hearts: '♥',
      spades: '♠',
      nt: 'NT'
    };

    return `${call}${labels[color]}${isDoubled ? ' X' : ''}`;
  }
}
