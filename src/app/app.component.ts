import { AfterContentInit, AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { PlayerComponent } from './player/player.component';
import { CardService } from './card.service';
import { PlayedCard } from './card/card.component';

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
    <button mat-raised-button   class="reshuffle" (click)="onReshuffle()">
      Reshuffle
    </button>
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

  undoAble = false; // flag for undoing last move

  constructor(private cardService: CardService){
    
  }

  ngOnInit(): void {
    
  }

  /**
   * starts a new game
   */
  startGame(){
    // at the begining of game - distributes card to 4 players
    this.onReshuffle();
  }

  ngAfterViewInit(): void {
    this.startGame();

    // after a card is played (coming from server)- perform operations
    this.cardService.playedCard$.subscribe((playedCard: PlayedCard)=>{
      this.undoAble = false;
      switch(playedCard.player){
        case 'left':
          this.playerTwo.playCard(playedCard);
          break;
        case 'right':
          this.playerFour.playCard(playedCard);
          break;
        case 'bottom':
          this.playerOne.playCard(playedCard);
          break;
        case 'top':
          this.playerThree.playCard(playedCard);
          break;
      }
    });

    // after undoing last played card (coming from server)- perform operations - remove that card from table and place it in player's hand
    this.cardService.unPlayedCard$.subscribe((unPlayedCard: PlayedCard)=>{
      this.undoAble = true;
      switch(unPlayedCard.player){
        case 'left':
          this.playerTwo.unplayCard(unPlayedCard);
          break;
        case 'right':
          this.playerFour.unplayCard(unPlayedCard);
          break;
        case 'bottom':
          this.playerOne.unplayCard(unPlayedCard);
          break;
        case 'top':
          this.playerThree.unplayCard(unPlayedCard);
          break;
      }
    });

    // after a round is complete (coming from server) perform operations - clear table
    this.cardService.roundComplete$.subscribe(complete=>{
      this.clearTable();
    });

    // after a reshuffle button is pressed (coming from server) perform operations - clears table and distribute 52 cards to the players
    this.cardService.reshuffle$.subscribe(shuffle=>{
      this.clearTable();
      this.reshuffle();
    })


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
    this.undoAble = true;
  }

  /**
   * clears table and distribute 52 cards to the players
  */
  reshuffle(){
    this.cardService.distributeCards([this.playerOne, this.playerTwo, this.playerThree, this.playerFour]); 
  }


  /**
   * notify server after reshuffle button is pressed
   */
  onReshuffle(){
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
