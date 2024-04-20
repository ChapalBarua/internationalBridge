import { Injectable, OnInit } from '@angular/core';
import { PlayerComponent } from './player/player.component';
import { BehaviorSubject, map } from 'rxjs';
import { Card, PlayedCard, getShuffledCardsDeck } from './types';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class CardService {

  playedCard$ = new BehaviorSubject<PlayedCard>({player: '', card: null});
  unPlayedCard$ = new BehaviorSubject<PlayedCard>({player: '', card: null});
  roundComplete$ = new BehaviorSubject<boolean>(true);
  reshuffle$ = new BehaviorSubject<boolean>(true);
  cardsOnTable: PlayedCard[] = [];

  localPeerId!: string;

  constructor(private socket: Socket) {
    // joining default room 1
    this.joinRoom();

    // listening to event about joining an existing room
    this.socket.fromEvent('room_created').subscribe((event: any)=>{
      this.localPeerId = event.peerId;
      console.log('room created-',this.localPeerId);
    });

    // listening to event about creating and joining a room
    this.socket.fromEvent('room_joined').subscribe((event: any)=>{
      this.localPeerId = event.peerId;
      console.log('room joined-',this.localPeerId);
    });
  }

  joinRoom(roomId: number = 1){
    this.socket.emit('join', {room: roomId, peerUUID: this.localPeerId});
  }

  distributeCards(players: PlayerComponent[]){
    let cards: Card[] = getShuffledCardsDeck();
    let numberOfCards = cards.length;
    let numberOfPlayers = players.length;
    const numberOfCardsPerPlayer = numberOfCards/numberOfPlayers;
    let i=0;
    players.forEach(player=>{
      player.cards = cards.slice(i*numberOfCardsPerPlayer,(i+1)*numberOfCardsPerPlayer);
      i++;
    })
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
    // this.reshuffle$.next(true);
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
