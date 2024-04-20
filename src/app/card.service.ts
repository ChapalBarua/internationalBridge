import { Injectable, OnInit } from '@angular/core';
import { PlayerComponent } from './player/player.component';
import { BehaviorSubject, map } from 'rxjs';
import { Card, Orientation, PlayedCard, Players, RoomJoin, getShuffledCardsDeck } from './types';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  activePlayerOrientation!: Orientation; // active user orientation
  playerName = ''; // active user name
  players! : Players;
  cardsOnTable: PlayedCard[] = [];
  localPeerId!: string;


  playedCard$ = new BehaviorSubject<PlayedCard>({player: '', card: null});
  unPlayedCard$ = new BehaviorSubject<PlayedCard>({player: '', card: null});
  roundComplete$ = new BehaviorSubject<boolean>(true);
  shuffle$ = new BehaviorSubject<Card[]>([]);

  constructor(private socket: Socket) {
    // listening to event about joining an existing room
    this.socket.fromEvent<RoomJoin>('room_created').subscribe((event: RoomJoin)=>{
      console.log(`room ${event.roomId} created - orientation ${event.orientation} - peer id-`, event.peerId);
      this.afterJoinRoom(event);
    });

    // listening to event about creating and joining a room
    this.socket.fromEvent<RoomJoin>('room_joined').subscribe((event: RoomJoin)=>{
      console.log(`room ${event.roomId} joined - orientation ${event.orientation} - peer id-`, event.peerId);
      this.afterJoinRoom(event);
    });

    // listening to event when card is distributed
    this.socket.fromEvent<Card[]>('distribute_cards').subscribe((cards: Card[])=>{
      this.shuffle$.next(cards);
    });
  }

  joinRoom(roomId: string, userName: string){
    this.playerName = userName;
    this.socket.emit('join', {room: roomId, peerUUID: this.localPeerId, userName: userName});
  }

  /**
   * when server notifies a user - about joining a room - user sets up local environment
   */
  afterJoinRoom(event: RoomJoin){
    this.players = event.players;
    this.localPeerId = event.peerId;
    this.activePlayerOrientation = event.orientation;
    localStorage.setItem('orientation', event.orientation);
    localStorage.setItem('roomId', event.roomId);

    console.log(event);
  }

  playCard(playedCard: PlayedCard){
    this.playedCard$.next(playedCard);
  }

  unPlayCard(card?: PlayedCard){
    this.unPlayedCard$.next(card ?? this.playedCard$.value);
  }

  finishRound(){
    this.roundComplete$.next(true);
  }

  shuffleCard(){
    this.socket.emit('shuffleCard');
  }

  showCard(cards:Card[]){
  }

  /**
   * 
   * @param card - recently played card that is on the table
   * updates cardsOnTable tracker
   */
  placeCardOnTable(card: PlayedCard){
    this.cardsOnTable.push(card);
  }

  /**
   * 
   * @param removableCard - card that is unplayed
   * updates cardsOnTable tracker
   */
  removeCardFromTable(removableCard: PlayedCard){
    this.cardsOnTable = this.cardsOnTable.filter(playedCard=>playedCard.card?.cardType != removableCard.card?.cardType || playedCard.card?.cardValue != removableCard.card?.cardValue);
  }

}
