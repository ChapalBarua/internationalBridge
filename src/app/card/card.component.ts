import { AfterViewInit, Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent implements OnInit, AfterViewInit {
  ngAfterViewInit(): void {
    
  }
  @Input() cardType!: string;
  @Input() cardValue!: string;
  @Input() orientation!: string;
  @Input() height: string = "55px";
  @Input() width: string = "50px";
  imageUrl ='';

  ngOnInit(): void {
    this.imageUrl = generateImageUrl(this.cardType, this.cardValue);
  }
}

export enum CardSuit {
  Diamonds="Diamonds",
  Clubs = "Clubs",
  Hearts="Hearts",
  Spades="Spades"
}

export enum CardValue {
  Two = "Two",
  Three = "Three",
  Four = "Four",
  Five = "Five",
  Six = "Six",
  Seven = "Seven",
  Eight = "Eight",
  Nine = "Nine",
  Ten = "Ten",
  Jack = "Jack",
  Queen = "Queen",
  King = "King",
  Ace = "Ace"
}

function generateImageUrl(cardType: string, cardValue: string): string{
  let value = '';
  let type = '';

  switch(cardType){
    case CardSuit.Hearts :
      type = 'hearts';
      break;
    case CardSuit.Clubs :
      type = 'clubs';
      break;
    case CardSuit.Diamonds :
      type = 'diamonds';
      break;
    case CardSuit.Spades :
      type = 'spades';
      break;
    default :
      type = '';
  }

  switch(cardValue){
    case CardValue.Ace :
      value = 'ace';
      break;
    case CardValue.King :
      value = 'king';
      break;
    case CardValue.Queen :
      value = 'queen';
      break;
    case CardValue.Jack :
      value = 'jack';
      break;
    case CardValue.Ten :
      value = '10';
      break;
    case CardValue.Nine :
      value = '9';
      break;
    case CardValue.Eight :
      value = '8';
      break;
    case CardValue.Seven :
      value = '7';
      break;
    case CardValue.Six :
      value = '6';
      break;
    case CardValue.Five :
      value = '5';
      break;
    case CardValue.Four :
      value = '4';
      break;
    case CardValue.Three :
      value = '3';
      break;
    case CardValue.Two :
      value = '2';
      break;
    default :
      value = '';
  }
  let imageUrl = "assets/svg-cards/" + value + '_of_' + type + '.svg';
  return imageUrl;
}