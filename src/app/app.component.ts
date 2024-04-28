import { AfterContentInit, AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { PlayerComponent } from './player/player.component';
import { CardService } from './card.service';
import { CallInfo, Card, NextPlay, Orientation, PlayedCard, Serial, SerialNameMapping, ShownCards, getBlankSet } from './types';
import * as _ from 'lodash';
import { MatDialog } from '@angular/material/dialog';
import { BridgeCallComponent } from './bridge-call/bridge-call.component';
import { PointsComponent } from './points/points.component';

@Component({
  selector: 'app-root',
  template: `
  <div class="position-relative">
    <div class="left-player">
      <div class="left-player-name">{{playerLeftName}}</div>
      <app-player #playerLeft [orientation]="'left'" [serial]="playerLeftSerial" [active]="activeCardsSerial===playerLeftSerial"></app-player>
    </div>
      
    <div class="top-player">
      <div class="top-player-name">{{playerTopName}}</div>
      <app-player #playerTop [orientation]="'top'" [serial]="playerTopSerial" [active]="activeCardsSerial===playerTopSerial"></app-player>
    </div>

    <div class="bottom-player">
      <div class="bottom-player-name">{{playerBottomName}}</div>
      <app-player #playerBottom [orientation]="'bottom'" [serial]="playerBottomSerial" [active]="activeCardsSerial===playerBottomSerial"></app-player>
    </div>

    <div class="right-player">
      <div class="right-player-name">{{playerRightName}}</div>
      <app-player #playerRight [orientation]="'right'" [serial]="playerRightSerial" [active]="activeCardsSerial===playerRightSerial"></app-player>
    </div>
    <button mat-raised-button   class="roundCompleteButton" *ngIf="cardService.activePlayerSerial==='one'" [disabled]="!canCompleteRound" (click)="onDoneDeal()">
      Round Complete
    </button>
    <button mat-raised-button  class="undo" (click)="onUndoMove()" [disabled]="!cardService.undoAble">
      Undo last move
    </button>
    <button mat-raised-button *ngIf="cardService.activePlayerSerial==='one'" class="reshuffle" (click)="onshuffle()" [disabled]="!canShuffle">
      Shuffle
    </button>
  </div>
  <div class="connectedUsers">
    Connected users to the server -{{ cardService.serverUsers.connectedUsers}}<br>
    Active users to the server -{{ cardService.serverUsers.activeUsers }}<br><br>
    Current Call - {{cardService.currentCall}} <br><br>
    Sets taken by your team - {{cardService.ownerTeamSets}}<br>
    Sets taken by opponents - {{cardService.opponentTeamSets}}<br><br>
    Your team Points - {{cardService.ownerTeamPoints}}<br>
    Opponent Team Points - {{cardService.opponentTeamPoints}}<br><br>
    Games: &#160; Team 1: {{cardService.activeGamesByTeam1}}, &#160; Team2: {{cardService.activeGamesByTeam2}}
  </div>
  <span></span>
  <video class="video-1" id="video-1" autoplay muted></video>
  <video class="video-2" id="video-2" autoplay muted></video>
  <video class="video-3" id="video-3" autoplay muted></video>
  <video class="video-4" id="video-4" autoplay muted></video>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit, AfterContentInit{
  
  title = 'internationalBridge';
  activeCardsSerial: Serial | '' = ''; // indicates which cards can be played by owner. if empty - owner cant play
  
  @ViewChild('playerBottom') playerBottom!: PlayerComponent;
  @ViewChild('playerLeft') playerLeft!: PlayerComponent;
  @ViewChild('playerTop') playerTop!: PlayerComponent;
  @ViewChild('playerRight') playerRight!: PlayerComponent;

  canShuffle = false; // indicates if cards can be shuffled
  canCompleteRound = false; // indicates if 4 card is played and want to play next round
  playerBottomName: string = 'player one';
  playerBottomSerial: Serial = 'one';

  playerLeftName: string = 'player two';
  playerLeftSerial: Serial = 'two';

  playerTopName: string = 'player  three';
  playerTopSerial: Serial = 'three';

  playerRightName: string = 'player four';
  playerRightSerial: Serial = 'four';

  public setundoAble(flag: boolean){
    this.cardService.undoAble = flag;
    this.changeDetector.detectChanges();
  }

  constructor(public cardService: CardService, private changeDetector: ChangeDetectorRef, private  dialog: MatDialog){
  }

  ngOnInit(): void {
  }

  async ngAfterViewInit(): Promise<void> {
    // setting up webrtc
    let videoElements: any[] = [];
    videoElements[0] = document.getElementById('video-1');
    videoElements[1] = document.getElementById('video-2');
    videoElements[2] = document.getElementById('video-3');
    videoElements[3] = document.getElementById('video-4');
    videoElements[0].volume = 0;
    videoElements[1].volume = 0;
    videoElements[2].volume = 0;
    videoElements[3].volume = 0;
    this.cardService.videoElements = videoElements;

    await this.cardService.setLocalStream();
    
    // after a shuffle button is pressed (coming from server) perform operations - clears table, provide 13 cards to the owner, 39 face down cards to rest
    this.cardService.shuffle$.subscribe((cards: Card[])=>{
      this.canShuffle = false;
      this.resetTable();
      if(cards.length){
        this.playerBottom.cards = cards;
        this.playerBottom.cardShown = true;
        this.openDialog();
      };
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

    // activates canshuffle button after gameCompleted or 4 people have joined
    this.cardService.canShuffle$.subscribe((canShuffle)=>{
      this.resetTable();
      this.canShuffle = canShuffle;
    });

    
    // show points modal when server asks for it- after 13*4 cards are played
    this.cardService.getUpdatedPoints$.subscribe((update)=>{
      if(update){
        this.clearTable();
        this.showPointsModal();
      }
    });

    // activates nextplayer cards only if current player is the active player
    this.cardService.nextPlayer$.subscribe((nextPlay)=>{
      if(nextPlay?.clearTable){ // indicates round is complete
        this.clearTable();
      }
      this.activateCards(nextPlay);
    });

    // show cards of the player
    this.cardService.showCards$.subscribe((event: ShownCards)=>{
      if(event.cards.length>0){
        let cardOrientation = this.cardService.serialToOrientationMapping[event.serial];
        switch(cardOrientation){
          case 'left':
            this.playerLeft.cards = event.cards;
            this.playerLeft.cardShown = true;
            break;
          case 'right':
            this.playerRight.cards = event.cards;
            this.playerRight.cardShown = true;
            break;
          case 'bottom':
            this.playerBottom.cards = event.cards;
            this.playerBottom.cardShown = true;
            break;
          case 'top':
            this.playerTop.cards = event.cards;
            this.playerTop.cardShown = true;
            break;
        }
      }
    })

    // after a card is played (coming from server)- perform operations
    this.cardService.playedCard$.subscribe((playedCard: PlayedCard)=>{
      if(!playedCard.card) return;
      if(!playedCard.next) this.canCompleteRound = true;
      // if this player played last card - activate undo button
      this.setundoAble(playedCard.playedBy === this.cardService.activePlayerSerial);
      this.activateCards(playedCard?.next);
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
      this.setundoAble(false);
      this.canCompleteRound = false;
      let activationInfo: NextPlay = {
        nextPlayer: unPlayedCard.playedBy, // pllayer one/two/three/four will play
        nextCards: unPlayedCard.serial
      }
      this.activateCards(activationInfo);
      let playedCardOrientation = this.cardService.serialToOrientationMapping[unPlayedCard.serial];
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
  }

  activateCards(nextPlay: NextPlay | null | undefined){
    if(!nextPlay) return;
    if(nextPlay){
      if(this.cardService.activePlayerSerial === nextPlay.nextPlayer){
        this.activeCardsSerial  = nextPlay.nextCards;
      }else {
        this.activeCardsSerial = '';
      }
    }
    this.changeDetector.detectChanges();
  }


  openDialog(): void {
    if(this.cardService.activePlayerSerial!='one') return;
    const dialogRef = this.dialog.open(BridgeCallComponent, { disableClose: true, data: this.cardService.players });

    dialogRef.afterClosed().subscribe((result: CallInfo) => {
      this.cardService.onDecidedCall(result);
    });
  }

  showPointsModal(): void{
    if(this.cardService.activePlayerSerial!='one') return;
    const dialogRef = this.dialog.open(PointsComponent, { disableClose: true });

    dialogRef.afterClosed().subscribe((result) => {
      this.cardService.gameComplete({...result, setsTakenByTeam1: 0, setsTakenByTeam: 0});
    });
  }

  ngAfterContentInit(): void {
  }

  resetTable(){
    this.setBlankCardsToAll();
    this.clearTable();
  }

  updateUserNames(){
    this.playerBottomName = this.cardService.activePlayerName;
    this.playerTopName = this.cardService.players[this.playerTopSerial] || 'player  three';
    this.playerLeftName = this.cardService.players[this.playerLeftSerial] || 'player two';
    this.playerRightName = this.cardService.players[this.playerRightSerial] || 'player four';
    this.changeDetector.detectChanges();
  }

  setBlankCardsToAll(){
    this.playerBottom.cardShown = false;
    this.playerLeft.cardShown = false;
    this.playerTop.cardShown = false;
    this.playerRight.cardShown = false;
    this.playerBottom.cards = getBlankSet();
    this.playerLeft.cards = getBlankSet();
    this.playerTop.cards = getBlankSet();
    this.playerRight.cards = getBlankSet();
  }

  /**
    * remove cards from table
  */
  clearTable(){
    this.playerBottom.clearPlayedCard();
    this.playerLeft.clearPlayedCard();
    this.playerTop.clearPlayedCard();
    this.playerRight.clearPlayedCard();
    this.activeCardsSerial ='';
    this.setundoAble(false);
    this.changeDetector.detectChanges();
  }

  /**
   * notify server after shuffle button is pressed
   */
  onshuffle(){
    this.canShuffle = false;
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
    this.canCompleteRound = false;
    this.cardService.finishRound();
  }
}
