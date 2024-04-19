import { AfterViewInit, ChangeDetectionStrategy, Component, Input, OnChanges, OnInit } from '@angular/core';
import { CardService } from '../card.service';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() cardType!: string;
  @Input() cardValue!: string;
  @Input() orientation!: string;
  @Input() height: string = "55px";
  @Input() width: string = "50px";
  imageUrl ='';

  constructor(private cardService: CardService){

  }
  ngAfterViewInit(): void {
    
  }


  ngOnInit(): void {
    
  }

  ngOnChanges(): void {
    this.imageUrl = generateImageUrl(this.cardType, this.cardValue);
  }

  onClick(){
    this.cardService.playedCard$.next({ player: this.orientation, cardType: this.cardType, cardValue: this.cardValue});
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
  if(!type || !value) return '';
  let imageUrl = "assets/svg-cards/" + value + '_of_' + type + '.svg';
  return imageUrl;
}

export interface PlayedCard {
  player: string;
  cardType: string,
  cardValue: string
}