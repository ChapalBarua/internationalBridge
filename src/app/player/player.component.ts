import { AfterContentChecked, ChangeDetectorRef, Component, Input, OnInit, QueryList, ViewChildren } from '@angular/core';
import { BlankCard, Card, CardType, CardValue, Orientation, Serial, sortCards } from '../types';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit, AfterContentChecked {
  _cardShown = false; // indicates if this player has cards face up

  public get cardShown(): boolean {
    return this._cardShown
  }

  public set cardShown(willShowCards: boolean){
    this._cardShown = willShowCards;
  }

  @Input()
  orientation!: Orientation;

  @Input()
  serial!: Serial;

  // @Input()
  // activePlayer!: Orientation;

  // played card by a player
  private _playedCard!: Card | null;
  public set playedCard(playedCard: Card | null){
    this._playedCard = playedCard;
  }
  public get playedCard(): Card | null{
    return this._playedCard;
  }

  // hand cards of a player
  private _cards: Card[] =[];
  public set cards(cards: Card []){
    this._cards = sortCards(cards);
    this.changeDetector.detectChanges();
  }
  public get cards(): Card[]{
    return this._cards;
  }

  constructor(private changeDetector: ChangeDetectorRef) { 

  }
  ngAfterContentChecked(): void {
    
  }

  /**
   * 
   * @param playedCard - takes input of the card played by a player. removes it from hand and place it in the box in front
  */
  public playCard(playedCard: Card){
    if(!this.validateCard()) return;

    this.setPlayedCard(playedCard);

    if(this.cardShown){
      this.cards = this.cards.filter(card=> card.cardType != playedCard.cardType || card.cardValue!= playedCard.cardValue);
    }else {
      this.cards.pop();
    }
  }

  // logic if want to validate card played by user
  public validateCard(){
    return true;
  }

  /**
   * 
   * @param playedCard - takes back a card from board to hand
 */
  public unplayCard(playedCard: Card){
    this.clearPlayedCard();
    if(this.cardShown){
      this.cards = sortCards(this.cards.concat(playedCard));
    }else {
      this.cards = sortCards(this.cards.concat(BlankCard));
    }
  }

  /**
   * clear the played card by the player from table
  */
  public clearPlayedCard(){
    this.playedCard = null;
    this.changeDetector.detectChanges();
  }

  /**
   * 
   * @param playedCard - played card by the player
   * place the card in front of the player 
  */
  public setPlayedCard(playedCard: Card){
    this.playedCard = playedCard;
    this.changeDetector.detectChanges();
  }

  ngOnInit(): void {

  }
}