import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Card, PlayedCard, ShownCards, CallInfo, NextPlay, Points, CardsOnTable, InvalidCardPlay, BiddingState, InvalidBid, BiddingPassedOut, GameScored } from '../types/types';
import { Socket } from 'ngx-socket-io';
import { NotificationService, NotificationType } from './notification.service';
import { ConnectionService } from './connection.service';

@Injectable({
  providedIn: 'root'
})
export class CardService {

  cardsOnTable: CardsOnTable = {};

  ownerTeamPoints = 0;
  opponentTeamPoints =0;
  ownerTeamSets =0;
  opponentTeamSets =0;
  currentCall ='';
  activeGamesByTeam1 = 0;
  activeGamesByTeam2 = 0;

  canShuffle$ = new BehaviorSubject<boolean>(false);
  shuffle$ = new BehaviorSubject<Card[]>([]);
  showCards$ = new BehaviorSubject<ShownCards>({  // sets open cards to a player 
    cards: [],
    serial: 'one'
  });
  
  roundComplete$ = new Subject();
  pendingPlayValidation$ = new BehaviorSubject<boolean>(false);
  playedCard$ = new BehaviorSubject<PlayedCard>({serial: 'one', card: null, playedBy: 'one'});
  nextPlayer$ = new BehaviorSubject<NextPlay | null>(null);
  biddingState$ = new BehaviorSubject<BiddingState | null>(null);
  gameInfoUpdate$ = new Subject();

  constructor(
    public socket: Socket,
    public notificationService: NotificationService,
    private connectionService: ConnectionService) {   

    // listening to event when card is distributed 
    this.socket.fromEvent<Card[]>('distribute_cards').subscribe((cards: Card[])=>{
      this.clearTable();
      this.currentCall = 'No bid yet';
      this.biddingState$.next(null);
      this.shuffle$.next(cards);
    });

    this.socket.fromEvent<string>('standing_call').subscribe(standing_call=>{
      this.currentCall = standing_call;
    });

    // listening to announcement of next player to play
    this.socket.fromEvent<NextPlay>('next_player').subscribe((nextPlay: NextPlay)=>{
      this.notificationService.sendMessage({message: `Player ${this.connectionService.players[nextPlay.nextCards]}'s turn` , type: NotificationType.success});
      if(nextPlay.clearTable){
        this.clearTable();
      }
      this.nextPlayer$.next(nextPlay);
    });

    this.socket.fromEvent<BiddingState | null>('bidding_state').subscribe((biddingState: BiddingState | null)=>{
      this.biddingState$.next(biddingState);

      if(biddingState?.nextBidder){
        const bidderName = this.connectionService.players[biddingState.nextBidder];
        this.notificationService.sendMessage({message: `${bidderName}'s turn to bid`, type: NotificationType.info});
      }
    });

    // listening to event when a card is played
    this.socket.fromEvent<PlayedCard>('played_card').subscribe((card: PlayedCard)=>{
      this.pendingPlayValidation$.next(false);
      this.placeCardOnTable(card);
      this.playedCard$.next(card);

      if(card.playedBy === this.connectionService.activePlayerSerial && Object.keys(this.cardsOnTable).length === 4){
        setTimeout(()=>{
          this.finishRound();
        },4000);
      }
    });

    // listening to event when asked to show cards
    this.socket.fromEvent<ShownCards>('show_cards').subscribe((cards: ShownCards)=>{
      this.showCards$.next(cards);
    });

    this.socket.fromEvent<InvalidCardPlay>('invalid_card_play').subscribe(({ reason }: InvalidCardPlay)=>{
      this.pendingPlayValidation$.next(false);
      this.notificationService.sendMessage({message: reason, type: NotificationType.error});
    });

    this.socket.fromEvent<InvalidBid>('invalid_bid').subscribe(({ reason }: InvalidBid)=>{
      this.notificationService.sendMessage({message: reason, type: NotificationType.error});
    });

    this.socket.fromEvent<BiddingPassedOut>('bidding_passed_out').subscribe(({ message }: BiddingPassedOut)=>{
      this.notificationService.sendMessage({message, type: NotificationType.warning});
    });

    this.socket.fromEvent<GameScored>('game_scored').subscribe(({ message }: GameScored)=>{
      this.notificationService.sendMessage({message, type: NotificationType.success});
    });

    // can_shuffle
    this.socket.fromEvent<boolean>('can_shuffle').subscribe((canShuffle: boolean)=>{
      this.pendingPlayValidation$.next(false);
      this.clearTable();
      this.biddingState$.next(null);
      this.canShuffle$.next(canShuffle);
    });

    // update points based on server feedback
    this.socket.on('update_points', this.onUpdatePoints.bind(this));
  }

  ///////////////// instruction to server functions //////////////////////////////////////////
  
  /**
   * asks the server to shuffle card
   */
  shuffleCard(){
    this.socket.emit('shuffleCard');
  }

  /**
   * notifies server that the user has played one particular card
   */
  playCard(playedCard: PlayedCard){
    if(this.pendingPlayValidation$.value){
      return;
    }

    this.pendingPlayValidation$.next(true);
    this.socket.emit('playCard', playedCard);
  }

  /**
   * notifies server about the decided call
   */

  onDecidedCall(decidedCall: CallInfo){
    this.socket.emit('callDecided', decidedCall);
  }

  /**
   * notifies server that current round is complete
   */
  finishRound(){
    this.socket.emit('roundComplete');
  }

///////////////////////// general functions /////////////////////////////////////////
  /**
   * @param currentPoints - updates displayed points
   */
  onUpdatePoints(currentPoints: Points){
    // decides if active player is team one
    let activePlayerTeamOne = this.connectionService.activePlayerSerial === 'one' || this.connectionService.activePlayerSerial === 'three';

    // display points and sets taken
    this.ownerTeamPoints = activePlayerTeamOne ? currentPoints.team1 : currentPoints.team2;
    this.opponentTeamPoints = activePlayerTeamOne ? currentPoints.team2: currentPoints.team1;

    this.ownerTeamSets = activePlayerTeamOne ? currentPoints.setsTakenByTeam1 : currentPoints.setsTakenByTeam2;
    this.opponentTeamSets = activePlayerTeamOne ? currentPoints.setsTakenByTeam2 : currentPoints.setsTakenByTeam1;

    this.activeGamesByTeam1 = activePlayerTeamOne ? currentPoints.activeGamesByTeam1 : currentPoints.activeGamesByTeam2;
    this.activeGamesByTeam2 = activePlayerTeamOne ? currentPoints.activeGamesByTeam2 : currentPoints.activeGamesByTeam1;

    this.gameInfoUpdate$.next(true);
  }

  /** 
   * @param card - recently played card that is on the table
   * updates cardsOnTable tracker
   * returns true if operation successful
   */
  placeCardOnTable(card: PlayedCard): boolean{
    let cardOrientation = this.connectionService.serialToOrientationMapping[card.serial];
    if(this.cardsOnTable[cardOrientation as keyof CardsOnTable]){
      return false;
    }else {
      this.cardsOnTable[cardOrientation as keyof CardsOnTable] = card;
      this.connectionService.middleTableChanges$.next(true);
      return true;
    }
  }

  clearTable(){
    this.cardsOnTable = {};
    this.connectionService.middleTableChanges$.next(true);
  }

}
