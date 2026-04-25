import { AfterViewInit, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { BiddingState, CallInfo, Card, NextPlay, Orientation, PlayedCard, Serial, ShownCards, getBlankSet } from '../../types/types';
import { PlayerComponent } from './player/player.component';
import { CardService } from '../../service/card.service';
import { BridgeCallComponent } from '../../modals/bridge-call/bridge-call.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConnectionService } from 'src/app/service/connection.service';

@Component({
  selector: 'app-bridge-table',
  templateUrl: './bridge-table.component.html',
  styleUrl: './bridge-table.component.css'
})
export class BridgeTableComponent implements AfterViewInit{
  title = 'internationalBridge';
  activeCardsSerial: Serial | '' = ''; // indicates which cards can be played by owner. if empty - owner cant play
  biddingLabels: Record<Serial, string> = {
    one: '',
    two: '',
    three: '',
    four: ''
  };

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

  private biddingDialogRef?: MatDialogRef<BridgeCallComponent, CallInfo | undefined>;

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
      if(canShuffle && this.connectionService.activePlayerSerial === 'one'){
        this.canShuffle = false;
        this.cardService.shuffleCard();
      }
    });
    // activates nextplayer cards only if current player is the active player
    this.cardService.nextPlayer$.subscribe((nextPlay)=>{
      if(nextPlay?.clearTable){ // indicates round is complete
        this.deactivateAllCards();
      }
      this.activateCards(nextPlay);
    });

    this.cardService.biddingState$.subscribe((biddingState)=>{
      this.handleBiddingState(biddingState);
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

  openDialog(biddingState: BiddingState): void {
    if(this.biddingDialogRef){
      return;
    }

    const dialogRef = this.dialog.open(BridgeCallComponent, {
      disableClose: true,
      data: {
        players: this.connectionService.players,
        highestBid: biddingState.highestBid
      },
      panelClass: 'bridge-call-dialog-panel',
      width: 'min(10rem, 44vw)',
      maxWidth: '44vw'
    });
    this.biddingDialogRef = dialogRef;

    dialogRef.afterClosed().subscribe((result: CallInfo | undefined) => {
      this.biddingDialogRef = undefined;
      if(result){
        this.cardService.onDecidedCall({
          ...result,
          personCalled: this.connectionService.activePlayerSerial
        });
      }
    });
  }

  handleBiddingState(biddingState: BiddingState | null){
    this.biddingLabels = biddingState?.playerBids || {
      one: '',
      two: '',
      three: '',
      four: ''
    };

    const isMyTurnToBid = biddingState?.nextBidder === this.connectionService.activePlayerSerial;

    if(!isMyTurnToBid){
      this.biddingDialogRef?.close();
      this.changeDetector.detectChanges();
      return;
    }

    if(biddingState){
      this.openDialog(biddingState);
    }
    this.changeDetector.detectChanges();
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
    notify server after 4 cards are played and round complete button is pressed
  */
  onDoneDeal(){
    this.canCompleteRound = false;
    this.cardService.finishRound();
  }

}
