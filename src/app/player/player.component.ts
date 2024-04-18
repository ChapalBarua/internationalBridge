import { AfterContentChecked, ChangeDetectorRef, Component, Input, OnInit, QueryList, ViewChildren } from '@angular/core';
import { CardComponent, CardSuit, CardValue } from '../card/card.component';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit, AfterContentChecked {

  @Input()
  orientation!: string;

  cards!: Card[];

  //@ViewChildren(CardComponent) cards2!:QueryList<CardComponent>;

  constructor(private changeDetector: ChangeDetectorRef) { 
    //this.cards.concat(new CardComponent(CardSuit.Spade, CardValue.Ace));

  }
  ngAfterContentChecked(): void {
    
  }

  public setCard( cards: Card[]){
    this.cards = sortCards(cards);
    this.changeDetector.detectChanges();
  }

  ngOnInit(): void {

  }

  public playCard(){

  }

}

export interface Card {
  cardType: string,
  cardValue: string
}

export function getShuffledCardsDeck(): Card[]{
  
  let types: string[] = Object.keys(CardSuit).filter(value => typeof value === 'string');

  let values: string[] = Object.keys(CardValue).filter(value => typeof value === 'string');

  let res: Card[] = []; 
    
  for (let type of types) {
      for (let value of values) {
        res.push({cardType: type, cardValue: value});
      } 
  } 
    
  for (let i = res.length - 1; i > 0; i--) { 
      let j = Math.floor(Math.random() * (i + 1)); 
      [res[i], res[j]] = [res[j], res[i]]; 
  }

  return res;
}

function sortCards(cards: Card[]){
  return cards.sort((card1,card2)=>{
    let cardTypeSortValue = Object.keys(CardSuit).indexOf(card1.cardType) -Object.keys(CardSuit).indexOf(card2.cardType);
    if(cardTypeSortValue>0) return -1;
    else if(cardTypeSortValue<0) return 1;
    else {
      return Object.keys(CardValue).indexOf(card2.cardValue) - Object.keys(CardValue).indexOf(card1.cardValue);
    }
  })
}

