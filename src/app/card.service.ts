import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { Card, Serial, PlayedCard, SerialNameMapping, RoomJoin, ShownCards, UserTracker, Orientation, OrientationSerialMapping } from './types';
import { Socket } from 'ngx-socket-io';
import { NotificationService, NotificationType } from './notification.service';
import { Dictionary } from 'lodash';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  activePlayerSerial: Serial = "one"; // active user serial - one/two/thre/four

  private _activePlayerName : string = 'player one'; // active user name
  get activePlayerName(): string{
    return this._activePlayerName;
  }
  set activePlayerName(playerName: string){
    this._activePlayerName = playerName;
    localStorage.setItem('userName', playerName);
  }

  private _players : SerialNameMapping = { // serial -> name mapping
    one : 'player one',
    two: 'player two',
    three: 'player three',
    four: 'player four'
  };
  
  set players(players: SerialNameMapping){
    this._players = players;
  }
  get players(): SerialNameMapping{
    return this._players;
  }

  private _orientationToSerialMapping : OrientationSerialMapping= {
    bottom: 'one',
    left: 'two',
    top: 'three',
    right: 'four' 
  }

  get orientationToSerialMapping(): OrientationSerialMapping{
    return this._orientationToSerialMapping
  }

  set orientationToSerialMapping(map:  OrientationSerialMapping){
    this._orientationToSerialMapping = map;
    this.serialToOrientationMapping = _.invert(this.orientationToSerialMapping);
  }

  serialToOrientationMapping: Dictionary<string> = {
    one: 'bottom',
    two: 'left',
    three: 'top',
    four: 'right'
  };

  cardsOnTable: PlayedCard[] = [];
  localPeerId!: string;
  roomId!: string;

  serverUsers: UserTracker = {
    activeUsers: 0,
    connectedUsers: 0
  };

  shuffle$ = new BehaviorSubject<Card[]>([]);
  showCards$ = new BehaviorSubject<ShownCards>({  // sets open cards to a player 
    cards: [],
    user: '',
    serial: 'one'
  }); 
  
 
  playedCard$ = new BehaviorSubject<PlayedCard>({serial: 'one', card: null});
  unPlayedCard$ = new BehaviorSubject<PlayedCard>({serial: 'one', card: null});
  roundComplete$ = new BehaviorSubject<boolean>(true);

  onOwnerJoiningRoom$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  onRoomUsersChange$: BehaviorSubject<boolean>  = new BehaviorSubject(true); // notifies others when a user enters leaves room

  constructor(private socket: Socket, private notificationService: NotificationService) {

    // when the owner is connected to the server
    this.socket.on("connect", () => {
      this.notificationService.sendMessage({message: `Connected. Welcome to the Card Game Website` , type: NotificationType.info});
      console.log('connected to the server');
    });
    
    this.socket.on("disconnect", () => {
      this.notificationService.sendMessage({message: `Unfortunately you got disconnected from the server` , type: NotificationType.info});
      this.localPeerId = '';
      this.roomId = '';
      console.log('disconnected from the server');
    });

    // listening to event about creating and joining a room by the owner
    this.socket.on('room_created', this.onRoomCreated.bind(this));

    
    // listening to event about joining an existing room by the owner
    this.socket.fromEvent<RoomJoin>('room_joined').subscribe((event: RoomJoin)=>{
      console.log(`room ${event.roomId} joined - serial ${event.serial} - peer id-`, event.peerId);
      this.notificationService.sendMessage({message: `joined in room ${event.roomId}` , type: NotificationType.success});
      this.afterJoinRoom(event);
    });

    // listening to event about any user connecting to server
    this.socket.fromEvent<UserTracker>('user_connected').subscribe((users: UserTracker)=>{
      this.setServerUsers(users);
    });

    // listening to event about any user disconnected from the server
    this.socket.fromEvent<UserTracker>('user_disconnected').subscribe((users: UserTracker)=>{
      this.setServerUsers(users);
    });
    

    // listening to event about new user joined any room
    this.socket.fromEvent<UserTracker>('user_active').subscribe((users: UserTracker)=>{
      this.setServerUsers(users);
    });

    // listening to event about any user leaving any room
    this.socket.fromEvent<UserTracker>('user_inactive').subscribe((users: UserTracker)=>{
      this.setServerUsers(users);
    });
    

    // listening to event about new user has joined the same room
    this.socket.on('user_joined_room',this.onNewUserJoinedRoom.bind(this));

    // listening to event about a user has left the same room
    this.socket.on('user_left_room',this.onUserLeftRoom.bind(this));

     // listening to event when owner fails to join because the room is full
     this.socket.fromEvent<UserTracker>('capacity_full').subscribe(()=>{
      this.notificationService.sendMessage({message: `Failed to join - the room is full` , type: NotificationType.error});
    });


    // listening to event when card is distributed 
    this.socket.fromEvent<Card[]>('distribute_cards').subscribe((cards: Card[])=>{
      this.shuffle$.next(cards);
    });

    // listening to event when a card is played
    this.socket.fromEvent<PlayedCard>('played_card').subscribe((card: PlayedCard)=>{
      this.playedCard$.next(card);
    });

    // listening to event when a card is unplayed
    this.socket.fromEvent<PlayedCard>('unplayed_card').subscribe((card: PlayedCard)=>{
      this.unPlayedCard$.next(card);
    });

    // listening to event when asked to show cards
    this.socket.fromEvent<ShownCards>('show_cards').subscribe((cards: ShownCards)=>{
      this.showCards$.next(cards);
    });


    // implement capacity full 
  }

  ///////////////// instruction to server functions //////////////////////////////////////////

  /**
   * notifies the server that users wants to join a particular room
   * 
   * @param roomId - room where user wants to join
   * @param userName 
   * 
   */
  joinRoom(roomId: string, userName: string){
    if(this.roomId) return;
    this.socket.emit('join', {room: roomId, peerUUID: this.localPeerId, userName: userName});
  }
  
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
    this.socket.emit('playCard', playedCard);
  }

  /**
   * notifies server that the user has unplayed one particular card
   */
  unPlayCard(){
    this.socket.emit('unplayCard', this.playedCard$.value);
  }

  


///////////////////////// general funstions /////////////////////////////////////////

  /**
   * keeps track of connected users to the server
   * @param users 
   */
    setServerUsers(users: UserTracker){
      this.serverUsers= users;
    }
  

  /**
   * function that executes after server notifies the active user that he successfully joined the room
   * @param event provides information to the new user about his serial and other users in table
   */
  onRoomCreated(event: RoomJoin){
    console.log(`room ${event.roomId} created - serial ${event.serial} - peer id-`, event.peerId);
    this.notificationService.sendMessage({message: `room ${event.roomId} created and joined ` , type: NotificationType.success});
    this.afterJoinRoom(event);
  }

  /**
   * function that executes after server notifies the owner that a new user joined the room
   * @param user - name of the new user who recently joined room (not the active user)
   * @param players - info about existing players in the table
   */
  onNewUserJoinedRoom(user: string, players: SerialNameMapping){
    this.notificationService.sendMessage({message: `user ${user} joined the room ` , type: NotificationType.info});
    this.players = players;
    this.onRoomUsersChange$.next(true);
  }

   /**
   * function that executes after server notifies the owner that a user has left the room
   * @param user - name of the user who left the room
   * @param players - info about existing players in the table
   */
  onUserLeftRoom(user: string, players: SerialNameMapping){
    this.notificationService.sendMessage({message: `user ${user} has left the room ` , type: NotificationType.info});
    this.players = players;
    this.onRoomUsersChange$.next(true);
  }

  /**
   * when server notifies a user(owner) - about joining a room - user sets up local environment
   */
  afterJoinRoom(event: RoomJoin){
    console.log('owner joined-',event);
    this.activePlayerName = event.user;
    this.players = event.players;
    this.localPeerId = event.peerId;
    this.roomId = event.peerId;
    this.activePlayerSerial = event.serial;
    localStorage.setItem('serial', event.serial);
    localStorage.setItem('roomId', event.roomId);
    this.calculateOrientationToSerialMapping();
    this.onOwnerJoiningRoom$.next(true);
  }

  finishRound(){
    this.roundComplete$.next(true);
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

  getNameFromSerial (serial: Serial){
    return this.players[serial];
  }

  calculateOrientationToSerialMapping(){
    let serials: Serial[] = ["one", "two", "three", "four"];
    let names: string[] = [this.players["one"], this.players["two"], this.players["three"], this.players["four"]];
    
    while(serials[0]!=this.activePlayerSerial){ // rotating the arrays until active player comes at the first position
      serials.push(<Serial>serials.shift());
      names.push(<string>names.shift());
    }

    let newOrientationToSerialMapping: OrientationSerialMapping = {
      bottom: serials[0],
      left: serials[1],
      top: serials[2],
      right: serials[3] 
    }

    this.orientationToSerialMapping = newOrientationToSerialMapping;
  }
}