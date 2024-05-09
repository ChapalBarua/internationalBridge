import { AfterViewInit, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { CallInfo, Card, NextPlay, Orientation, PlayedCard, Serial, ShownCards, getBlankSet } from '../../types/types';
import { PlayerComponent } from './player/player.component';
import { CardService } from '../../service/card.service';
import { BridgeCallComponent } from '../../modals/bridge-call/bridge-call.component';
import { PointsComponent } from '../../modals/points/points.component';
import { MatDialog } from '@angular/material/dialog';
import { ConnectionService } from 'src/app/service/connection.service';

@Component({
  selector: 'app-bridge-table',
  templateUrl: './bridge-table.component.html',
  styleUrl: './bridge-table.component.css'
})
export class BridgeTableComponent implements AfterViewInit{
  title = 'internationalBridge';
  activeCardsSerial: Serial | '' = ''; // indicates which cards can be played by owner. if empty - owner cant play

  nextPlayer: Orientation | string = ''; // sets marker for next player

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

  constructor(
    public cardService: CardService,
    private changeDetector: ChangeDetectorRef,
    private  dialog: MatDialog,
    private connectionService: ConnectionService
  ){
  }

  ngAfterViewInit() {
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
    this.connectionService.onOwnerJoiningRoom$.subscribe(()=>{
      this.playerBottomSerial = this.connectionService.orientationToSerialMapping['bottom']; 
      this.playerTopSerial = this.connectionService.orientationToSerialMapping['top']; 
      this.playerRightSerial=this.connectionService.orientationToSerialMapping['right']; 
      this.playerLeftSerial = this.connectionService.orientationToSerialMapping['left'];
      this.updateUserNames();
    });

    // sets up user serial and name when new user joins or existing user leaves
    this.connectionService.onRoomUsersChange$.subscribe(()=>{
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
        this.deactivateAllCards();
        this.showPointsModal();
      }
    });

    // activates nextplayer cards only if current player is the active player
    this.cardService.nextPlayer$.subscribe((nextPlay)=>{
      if(nextPlay?.clearTable){ // indicates round is complete
        this.deactivateAllCards();
      }
      this.activateCards(nextPlay);
    });

    // show cards of the player
    this.cardService.showCards$.subscribe((event: ShownCards)=>{
      if(event.cards.length>0){
        let cardOrientation = this.connectionService.serialToOrientationMapping[event.serial];
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
      this.setundoAble(playedCard.playedBy === this.connectionService.activePlayerSerial && Object.keys(this.cardService.cardsOnTable).length!=4);
      this.activateCards(playedCard?.next);
      let playedCardOrientation = this.connectionService.serialToOrientationMapping[playedCard.serial];

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
      this.changeDetector.detectChanges();
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
      let playedCardOrientation = this.connectionService.serialToOrientationMapping[unPlayedCard.serial];
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
      this.nextPlayer = this.connectionService.serialToOrientationMapping[nextPlay.nextCards];
      if(this.connectionService.activePlayerSerial === nextPlay.nextPlayer){
        this.activeCardsSerial  = nextPlay.nextCards;
      }else {
        this.activeCardsSerial = '';
      }
    }
    this.changeDetector.detectChanges();
  }

  openDialog(): void {
    if(this.connectionService.activePlayerSerial!='one') return;
    const dialogRef = this.dialog.open(BridgeCallComponent, { disableClose: true, data: this.connectionService.players });

    dialogRef.afterClosed().subscribe((result: CallInfo) => {
      this.cardService.onDecidedCall(result);
    });
  }

  showPointsModal(): void{
    if(this.connectionService.activePlayerSerial!='one') return;
    const dialogRef = this.dialog.open(PointsComponent, { disableClose: true });
    this.changeDetector.detectChanges();

    dialogRef.afterClosed().subscribe((result: any) => {
      this.cardService.gameComplete({...result, setsTakenByTeam1: 0, setsTakenByTeam: 0});
    });
  }

  resetTable(){
    this.setBlankCardsToAll();
    this.deactivateAllCards();
  }

  updateUserNames(){
    this.playerBottomName = this.connectionService.activePlayerName;
    this.playerTopName = this.connectionService.players[this.playerTopSerial] || 'player  three';
    this.playerLeftName = this.connectionService.players[this.playerLeftSerial] || 'player two';
    this.playerRightName = this.connectionService.players[this.playerRightSerial] || 'player four';
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
    deactivateAllCards(){
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
