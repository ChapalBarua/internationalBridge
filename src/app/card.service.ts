import { Injectable, OnInit } from '@angular/core';
import { PlayerComponent } from './player/player.component';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Card, Orientation, PlayedCard, Players, RoomJoin, getShuffledCardsDeck, UserTracker } from './types';
import { Socket } from 'ngx-socket-io';
import { NotificationService, NotificationType } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  activePlayerOrientation!: Orientation; // active user orientation
  playerName = ''; // active user name
  players! : Players;
  cardsOnTable: PlayedCard[] = [];
  localPeerId!: string;

  serverUsers: UserTracker = {
    activeUsers: 0,
    connectedUsers: 0
  };
  // connectedUsers$ = new BehaviorSubject<number>(0);
  // activeUsers$ = new BehaviorSubject<number>(0);


  playedCard$ = new BehaviorSubject<PlayedCard>({player: '', card: null});
  unPlayedCard$ = new BehaviorSubject<PlayedCard>({player: '', card: null});
  roundComplete$ = new BehaviorSubject<boolean>(true);
  shuffle$ = new BehaviorSubject<Card[]>([]);

  constructor(private socket: Socket, private notificationService: NotificationService) {

    // listening to event about creating and joining a room
    this.socket.on('room_created', this.onRoomCreated.bind(this));

    
    // listening to event about joining an existing room
    this.socket.fromEvent<RoomJoin>('room_joined').subscribe((event: RoomJoin)=>{
      console.log(`room ${event.roomId} joined - orientation ${event.orientation} - peer id-`, event.peerId);
      this.notificationService.sendMessage({message: `joined in room ${event.roomId}` , type: NotificationType.success});
      this.afterJoinRoom(event);
    });

    // listening to event about new user connecting to server
    this.socket.fromEvent<UserTracker>('user_connected').subscribe((users: UserTracker)=>{
      this.setServerUsers(users);
    });

    // listening to event about new user disconnected from the server
    this.socket.fromEvent<UserTracker>('user_disconnected').subscribe((users: UserTracker)=>{
      this.setServerUsers(users);
    });

    

    // listening to event about new user has joined the same room
    this.socket.on('user_joined_room',this.onNewUserJoinedRoom.bind(this));

    // listening to event when card is distributed
    this.socket.fromEvent<Card[]>('distribute_cards').subscribe((cards: Card[])=>{
      this.shuffle$.next(cards);
    });
  }

  /**
   * keeps track of connected users to the server
   * @param users 
   */
  setServerUsers(users: UserTracker){
    this.serverUsers= users;
  }

  /**
   * notifies the server that users wants to join a particular room
   * 
   * @param roomId - room where user wants to join
   * @param userName 
   * 
   */
  joinRoom(roomId: string, userName: string){
    this.playerName = userName;
    this.socket.emit('join', {room: roomId, peerUUID: this.localPeerId, userName: userName});
  }


  /**
   * function that executes after server notifies the active user that he successfully joined the room
   * @param event provides information to the new user about his orientation and other users in table
   */
  onRoomCreated(event: RoomJoin){
    console.log(`room ${event.roomId} created - orientation ${event.orientation} - peer id-`, event.peerId);
    this.notificationService.sendMessage({message: `room ${event.roomId} created and joined ` , type: NotificationType.success});
    this.afterJoinRoom(event);
  }

  /**
   * function that executes after server notifies the active user that a new user joined the room
   * @param user - name of the new user who recently joined room (not the active user)
   * @param players - info about existing players in the table
   */
  onNewUserJoinedRoom(user: string, players: Players){
    this.notificationService.sendMessage({message: `user ${user} joined the room ` , type: NotificationType.info});
    this.players = players;
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
