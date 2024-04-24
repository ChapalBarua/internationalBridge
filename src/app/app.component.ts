import { AfterContentInit, AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { PlayerComponent } from './player/player.component';
import { CardService } from './card.service';
import { BlankSet, Card, Orientation, PlayedCard, Serial, SerialNameMapping, ShownCards } from './types';
import * as _ from 'lodash';

@Component({
  selector: 'app-root',
  template: `
  <div class="position-relative">
    <div class="left-player">
      <div class="left-player-name">{{playerLeftName}}</div>
      <app-player #playerLeft [orientation]="'left'" [serial]="playerLeftSerial"></app-player>
    </div>
      
    <div class="top-player">
      <div class="top-player-name">{{playerTopName}}</div>
      <app-player #playerTop [orientation]="'top'" [serial]="playerTopSerial"></app-player>
    </div>

    <div class="bottom-player">
      <div class="bottom-player-name">{{playerBottomName}}</div>
      <app-player #playerBottom [orientation]="'bottom'" [serial]="playerBottomSerial"></app-player>
    </div>

    <div class="right-player">
      <div class="right-player-name">{{playerRightName}}</div>
      <app-player #playerRight [orientation]="'right'" [serial]="playerRightSerial"></app-player>
    </div>
    <button mat-raised-button   class="roundCompleteButton" (click)="onDoneDeal()">
      Round Complete
    </button>
    <button mat-raised-button  class="undo" (click)="onUndoMove()" [disabled]="undoAble">
      Undo last move
    </button>
    <button mat-raised-button class="reshuffle" (click)="onshuffle()">
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
  
  @ViewChild('playerBottom') playerBottom!: PlayerComponent;
  @ViewChild('playerLeft') playerLeft!: PlayerComponent;
  @ViewChild('playerTop') playerTop!: PlayerComponent;
  @ViewChild('playerRight') playerRight!: PlayerComponent;

  playerBottomName: string = 'player one';
  playerBottomSerial: Serial = 'one';

  playerLeftName: string = 'player two';
  playerLeftSerial: Serial = 'two';

  playerTopName: string = 'player  three';
  playerTopSerial: Serial = 'three';

  playerRightName: string = 'player four';
  playerRightSerial: Serial = 'four';


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

    // after a shuffle button is pressed (coming from server) perform operations - clears table, provide 13 cards to the owner, 39 face down cards to rest
    this.cardService.shuffle$.subscribe((cards: Card[])=>{
      this.setBlankCardsToAll();
      this.clearTable();
      if(cards.length){
        this.playerBottom.cards = cards;
        this.playerBottom.cardShown = true;
      }
    });

    // sets up orientation on owner joining the room
    this.cardService.onOwnerJoiningRoom$.subscribe(()=>{
      this.playerBottomSerial = this.cardService.orientationToSerialMapping['bottom']; 
      this.playerTopSerial = this.cardService.orientationToSerialMapping['top']; 
      this.playerRightSerial=this.cardService.orientationToSerialMapping['right']; 
      this.playerLeftSerial = this.cardService.orientationToSerialMapping['left'];
      this.updateUserNames();
    });

    // sets up user serial and name when new user joins or existing user leaves
    this.cardService.onRoomUsersChange$.subscribe(()=>{
      this.updateUserNames();
    });

    // show cards of the player
    this.cardService.showCards$.subscribe((event: ShownCards)=>{
      if(event.cards.length>0){
        
      }
    })

    // after a card is played (coming from server)- perform operations
    this.cardService.playedCard$.subscribe((playedCard: PlayedCard)=>{
      if(!playedCard.card) return;
      this.setundoAble(false);
      let playedCardOrientation = this.cardService.serialToOrientationMapping[playedCard.serial];

      switch(playedCardOrientation){
        case 'left':
          this.playerLeft.playCard(playedCard.card);
          break;
        case 'right':
          this.playerRight.playCard(playedCard.card);
          break;
        case 'bottom':
          this.playerBottom.playCard(playedCard.card);
          break;
        case 'top':
          this.playerTop.playCard(playedCard.card);
          break;
      }
    });

    // after undoing last played card (coming from server)- perform operations - remove that card from table and place it in player's hand
    this.cardService.unPlayedCard$.subscribe((unPlayedCard: PlayedCard)=>{
      if(!unPlayedCard.card) return;
      let playedCardOrientation = this.cardService.serialToOrientationMapping[unPlayedCard.serial];
      this.setundoAble(true);
      switch(playedCardOrientation){
        case 'left':
          this.playerLeft.unplayCard(unPlayedCard.card);
          break;
        case 'right':
          this.playerRight.unplayCard(unPlayedCard.card);
          break;
        case 'bottom':
          this.playerBottom.unplayCard(unPlayedCard.card);
          break;
        case 'top':
          this.playerTop.unplayCard(unPlayedCard.card);
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

  updateUserNames(){
    this.playerBottomName = this.cardService.activePlayerName;
    this.playerTopName = this.cardService.players[this.playerTopSerial] || 'player  three';
    this.playerLeftName = this.cardService.players[this.playerLeftSerial] || 'player two';
    this.playerRightName = this.cardService.players[this.playerRightSerial] || 'player four';
  }

  setBlankCardsToAll(){
    this.playerBottom.cards = BlankSet;
    this.playerLeft.cards = BlankSet;
    this.playerTop.cards = BlankSet;
    this.playerRight.cards = BlankSet;
  }

  /**
    * remove cards from table
  */
  clearTable(){
    this.playerBottom.clearPlayedCard();
    this.playerLeft.clearPlayedCard();
    this.playerTop.clearPlayedCard();
    this.playerRight.clearPlayedCard();
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
