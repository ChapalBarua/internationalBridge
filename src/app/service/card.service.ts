import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Card, PlayedCard, ShownCards, CallInfo, NextPlay, Points, CardsOnTable } from '../types/types';
import { Socket } from 'ngx-socket-io';
import { NotificationService, NotificationType } from './notification.service';
import { ConnectionService } from './connection.service';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  
  public undoAble = false; // flag for undoing last move

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
  playedCard$ = new BehaviorSubject<PlayedCard>({serial: 'one', card: null, playedBy: 'one'});
  unPlayedCard$ = new BehaviorSubject<PlayedCard>({serial: 'one', card: null, playedBy: 'one'});
  nextPlayer$ = new BehaviorSubject<NextPlay | null>(null);
  getUpdatedPoints$ = new BehaviorSubject(false); // observer to notify taking points input

  gameInfoUpdate$ = new Subject();

  constructor(
    public socket: Socket,
    public notificationService: NotificationService,
    private connectionService: ConnectionService) {   

    // listening to event when card is distributed 
    this.socket.fromEvent<Card[]>('distribute_cards').subscribe((cards: Card[])=>{
      this.clearTable();
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

    // listening to event when a card is played
    this.socket.fromEvent<PlayedCard>('played_card').subscribe((card: PlayedCard)=>{
      this.placeCardOnTable(card);
      this.playedCard$.next(card);
    });

    // listening to event when a card is unplayed
    this.socket.fromEvent<PlayedCard>('unplayed_card').subscribe((card: PlayedCard)=>{
      this.removeCardFromTable(card);
      this.unPlayedCard$.next(card);
    });

    // listening to event when asked to show cards
    this.socket.fromEvent<ShownCards>('show_cards').subscribe((cards: ShownCards)=>{
      this.showCards$.next(cards);
    });

    // can_shuffle
    this.socket.fromEvent<boolean>('can_shuffle').subscribe((canShuffle: boolean)=>{
      this.clearTable();
      this.canShuffle$.next(canShuffle);
    });

    // shows points modal
    this.socket.fromEvent('get_updated_points').subscribe(()=>{
      this.clearTable();
      this.getUpdatedPoints$.next(true);
    });

    // server announces round_complete
    this.socket.fromEvent('round_complete').subscribe(()=>{
      this.roundComplete$.next(true);
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
    if(this.placeCardOnTable(playedCard)){ // if there is no card played from that slot - emit event. Else - do nothing
      this.socket.emit('playCard', playedCard);
      if(Object.keys(this.cardsOnTable).length===4){
        setTimeout(()=>{
          this.finishRound();
        },4000);
      }
    }
  }

  /**
   * notifies server that the user has unplayed one particular card
   */
  unPlayCard(){
    this.socket.emit('unplayCard', this.playedCard$.value);
  }

  /**
   * notifies server about the decided call
   */

  onDecidedCall(decidedCall: CallInfo){
    this.socket.emit('callDecided', decidedCall);
  }

  /**
   * provides server updated points
   */
  gameComplete(points: Points){
    this.socket.emit('completeGame', points);
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

  /**
   * @param removableCard - card that is unplayed
   * updates cardsOnTable tracker
   */
  removeCardFromTable(removableCard: PlayedCard){
    let cardOrientation = this.connectionService.serialToOrientationMapping[removableCard.serial];
    delete this.cardsOnTable[cardOrientation as keyof CardsOnTable];
    this.connectionService.middleTableChanges$.next(true);
  }

  clearTable(){
    this.cardsOnTable = {};
    this.connectionService.middleTableChanges$.next(true);
  }

}