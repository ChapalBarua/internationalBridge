import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Card, Orientation, PlayedCard, Players, RoomJoin, ShownCards, UserTracker } from './types';
import { Socket } from 'ngx-socket-io';
import { NotificationService, NotificationType } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  activePlayerOrientation!: Orientation; // active user orientation
  playerName = ''; // active user name
  private _players! : Players;
  
  set players(players: Players){
    this._players = players;
  }
  get players(): Players{
    return this._players;
  }
  cardsOnTable: PlayedCard[] = [];
  localPeerId!: string;

  serverUsers: UserTracker = {
    activeUsers: 0,
    connectedUsers: 0
  };

  shuffle$ = new BehaviorSubject<Card[]>([]);
  showCards$ = new BehaviorSubject<ShownCards>({
    cards: [],
    user: '',
    orientation: 'left'
  }); 
  
  // sets open cards to a player 
  playedCard$ = new BehaviorSubject<PlayedCard>({player: '', card: null});
  unPlayedCard$ = new BehaviorSubject<PlayedCard>({player: '', card: null});
  roundComplete$ = new BehaviorSubject<boolean>(true);
  


  constructor(private socket: Socket, private notificationService: NotificationService) {

    // listening to event about creating and joining a room by the owner
    this.socket.on('room_created', this.onRoomCreated.bind(this));

    
    // listening to event about joining an existing room by the owner
    this.socket.fromEvent<RoomJoin>('room_joined').subscribe((event: RoomJoin)=>{
      console.log(`room ${event.roomId} joined - orientation ${event.orientation} - peer id-`, event.peerId);
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

    // listening to event when card is distributed
    this.socket.fromEvent<ShownCards>('show_cards').subscribe((cards: ShownCards)=>{
      this.showCards$.next(cards);
    });


    // implement capacity full 
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
   * function that executes after server notifies the owner that a new user joined the room
   * @param user - name of the new user who recently joined room (not the active user)
   * @param players - info about existing players in the table
   */
  onNewUserJoinedRoom(user: string, players: Players){
    this.notificationService.sendMessage({message: `user ${user} joined the room ` , type: NotificationType.info});
    this.players = players;
  }

   /**
   * function that executes after server notifies the owner that a user has left the room
   * @param user - name of the user who left the room
   * @param players - info about existing players in the table
   */
  onUserLeftRoom(user: string, players: Players){
    this.notificationService.sendMessage({message: `user ${user} has left the room ` , type: NotificationType.info});
    this.players = players;
  }

  /**
   * when server notifies a user - about joining a room - user sets up local environment
   */
  afterJoinRoom(event: RoomJoin){
    this.playerName = event.user;
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
