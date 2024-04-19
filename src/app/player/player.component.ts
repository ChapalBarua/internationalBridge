import { AfterContentChecked, ChangeDetectorRef, Component, Input, OnInit, QueryList, ViewChildren } from '@angular/core';
import { CardSuit, CardValue, PlayedCard } from '../card/card.component';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit, AfterContentChecked {

  @Input()
  orientation!: string;

  playedCardType = '';
  playedCardValue = '';

  cards!: Card[];


  constructor(private changeDetector: ChangeDetectorRef) { 

  }
  ngAfterContentChecked(): void {
    
  }

  public setCard( cards: Card[]){
    this.cards = sortCards(cards);
    this.changeDetector.detectChanges();
  }
  /**
   * 
   * @param playedCard - takes input of the card played by a player. removes it from hand and place it in the box in front
   */
  public playCard(playedCard: Card){
    this.cards = this.cards.filter(card=> card.cardType != playedCard.cardType || card.cardValue!= playedCard.cardValue);
    this.setPlayedCard(playedCard);
  }

   /**
   * 
   * @param playedCard - takes back a card from board to hand
   */
  public unplayCard(playedCard: Card){
    this.cards = sortCards(this.cards.concat(playedCard));
    this.clearPlayedCard();
    
  }

  /**
   * clear the played card by the player from table
  */
  public clearPlayedCard(){
    this.playedCardType = '';
    this.playedCardValue = '';
    this.changeDetector.detectChanges();
  }

  /**
   * 
   * @param playedCard - played card by the player
   * place the card in front of the player 
   */
  public setPlayedCard(playedCard: Card){
    this.playedCardType = playedCard.cardType;
    this.playedCardValue = playedCard.cardValue;
    this.changeDetector.detectChanges();
  }


  ngOnInit(): void {

  }


}

export type Card  = Pick<PlayedCard, 'cardType' | 'cardValue'>;

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

  return wellDistributedDeck(res) ? res : getShuffledCardsDeck(); // checks for face card distribution
}

/**
 * 
 * @param cards 52 cards deck
 * @returns if 4 set of 13 cards all have face cards
 */
function wellDistributedDeck(cards: Card[]): boolean | undefined{
  if(cards.length != 52) {
    console.log('Full 52 cards deck is not provided');
    return;
  }
  return checkFaceCard(cards.slice(0,13)) && checkFaceCard(cards.slice(13,26)) && checkFaceCard(cards.slice(26,39)) && checkFaceCard(cards.slice(39,52))
}

function checkFaceCard(cards: Card[]): boolean{
  let faceCards = cards.filter(card=> card.cardValue === CardValue.Ace ||  card.cardValue === CardValue.King 
    || card.cardValue === CardValue.Queen || card.cardValue === CardValue.Jack);
  return faceCards.length > 0;
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

