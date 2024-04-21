import { AfterContentInit, AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { PlayerComponent } from './player/player.component';
import { CardService } from './card.service';
import { Card, PlayedCard } from './types';

@Component({
  selector: 'app-root',
  template: `
  <div class="position-relative">
    <div class="left-player">
      <div class="left-player-name">Player Two</div>
      <app-player #playerTwo [orientation]="'left'"></app-player>
    </div>
      
    <div class="top-player">
      <div class="top-player-name">Player Three</div>
      <app-player #playerThree [orientation]="'top'"></app-player>
    </div>

    <div class="bottom-player">
      <div class="bottom-player-name">Player One</div>
      <app-player #playerOne [orientation]="'bottom'"></app-player>
    </div>

    <div class="right-player">
      <div class="right-player-name">Player Four</div>
      <app-player #playerFour [orientation]="'right'"></app-player>
    </div>
    <button mat-raised-button   class="roundCompleteButton" (click)="onDoneDeal()">
      Round Complete
    </button>
    <button mat-raised-button  class="undo" (click)="onUndoMove()" [disabled]="undoAble">
      Undo last move
    </button>
    <button mat-raised-button   class="reshuffle" (click)="onshuffle()">
      Shuffle
    </button>
  </div>
  <div class="connectedUsers">
    Connected users to the server -{{ cardService.serverUsers.connectedUsers}}<br>
    Active users to the server -{{ cardService.serverUsers.activeUsers }}
  </div>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit, AfterContentInit{
  
  title = 'internationalBridge';
  
  @ViewChild('playerOne') playerOne!: PlayerComponent;
  @ViewChild('playerTwo') playerTwo!: PlayerComponent;
  @ViewChild('playerThree') playerThree!: PlayerComponent;
  @ViewChild('playerFour') playerFour!: PlayerComponent;

  public undoAble = false; // flag for undoing last move

  public setundoAble(flag: boolean){
    this.undoAble = flag;
    this.changeDetector.detectChanges();
  }

  constructor(public cardService: CardService, private changeDetector: ChangeDetectorRef){
  }

  ngOnInit(): void {
    
  }

  ngAfterViewInit(): void {

    // after a shuffle button is pressed (coming from server) perform operations - clears table and distribute 52 cards to the players
    this.cardService.shuffle$.subscribe((cards: Card[])=>{
      this.clearTable();


      //temporary tracker
      this.playerOne.cards = cards;
      this.playerTwo.cards = cards;
      this.playerThree.cards = cards;
      this.playerFour.cards = cards;
    })

    // after a card is played (coming from server)- perform operations
    this.cardService.playedCard$.subscribe((playedCard: PlayedCard)=>{
      if(!playedCard.card) return;
      this.setundoAble(false);
      switch(playedCard.player){
        case 'left':
          this.playerTwo.playCard(playedCard.card);
          break;
        case 'right':
          this.playerFour.playCard(playedCard.card);
          break;
        case 'bottom':
          this.playerOne.playCard(playedCard.card);
          break;
        case 'top':
          this.playerThree.playCard(playedCard.card);
          break;
      }
    });

    // after undoing last played card (coming from server)- perform operations - remove that card from table and place it in player's hand
    this.cardService.unPlayedCard$.subscribe((unPlayedCard: PlayedCard)=>{
      if(!unPlayedCard.card) return;
      this.setundoAble(true);
      switch(unPlayedCard.player){
        case 'left':
          this.playerTwo.unplayCard(unPlayedCard.card);
          break;
        case 'right':
          this.playerFour.unplayCard(unPlayedCard.card);
          break;
        case 'bottom':
          this.playerOne.unplayCard(unPlayedCard.card);
          break;
        case 'top':
          this.playerThree.unplayCard(unPlayedCard.card);
          break;
      }
    });

    // after a round is complete (coming from server) perform operations - clear table
    this.cardService.roundComplete$.subscribe(complete=>{
      this.clearTable();
    });

    
  }

  ngAfterContentInit(): void {
  }

  /**
    * remove cards from table
  */
  clearTable(){
    this.playerOne.clearPlayedCard();
    this.playerTwo.clearPlayedCard();
    this.playerThree.clearPlayedCard();
    this.playerFour.clearPlayedCard();
    this.cardService.placeCardOnTable
    this.setundoAble(true);
  }




  /**
   * notify server after shuffle button is pressed
   */
  onshuffle(){
    this.cardService.shuffleCard();
  }

  /*
    notify server after undo button is pressed
  */
  onUndoMove(){
    this.cardService.unPlayCard();
  }

  /*
    notify server after 4 cards are played and round complete button is pressed
  */
  onDoneDeal(){
    this.cardService.finishRound();
  }



  
}
