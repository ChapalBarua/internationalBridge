import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { Card, Serial, PlayedCard, SerialNameMapping, RoomJoin, ShownCards, UserTracker, Orientation, OrientationSerialMapping, CallInfo, NextPlay, Points } from './types';
import { Socket } from 'ngx-socket-io';
import { NotificationService, NotificationType } from './notification.service';
import { Dictionary } from 'lodash';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  activePlayerSerial: Serial = "one"; // active user serial - one/two/thre/four
  public undoAble = false; // flag for undoing last move

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

  ownerTeamPoints = 0;
  opponentTeamPoints =0;
  ownerTeamSets =0;
  opponentTeamSets =0;
  currentCall ='';
  activeGamesByTeam1 = 0;
  activeGamesByTeam2 = 0;

  serverUsers: UserTracker = {
    activeUsers: 0,
    connectedUsers: 0
  };

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

  onOwnerJoiningRoom$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  onRoomUsersChange$: BehaviorSubject<boolean>  = new BehaviorSubject(true); // notifies others when a user enters leaves room


  ////////////////////web-rtc variables///////////////////////////////////////////

  videoElementsCounter =0;
  videoElements!: any[];
  mediaConstraints = {
    audio: true,
    video:{
      width: { max: 160, ideal: 320 },
      height: { max: 120, ideal: 240 },
      frameRate: 4
    }
  };

  offerOptions = {
    offerToReceiveVideo: 1,
    offerToReceiveAudio: 1,
  };

  peerConnections: any = {};
  localStream!: any;
  rtcPeerConnection: any; // Connection between the local device and the remote peer.

// Used ICE servers. Only STUN servers in this case.
  iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  constructor(public socket: Socket, public notificationService: NotificationService) {

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

    this.socket.fromEvent<string>('standing_call').subscribe(standing_call=>{
      this.currentCall = standing_call;
    });


    // listening to announcement of next player to play

    this.socket.fromEvent<NextPlay>('next_player').subscribe((nextPlay: NextPlay)=>{
      this.notificationService.sendMessage({message: `Player ${this.players[nextPlay.nextCards]}'s turn` , type: NotificationType.success});
      this.nextPlayer$.next(nextPlay);
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

    // can_shuffle
    this.socket.fromEvent<boolean>('can_shuffle').subscribe((canShuffle: boolean)=>{
      this.canShuffle$.next(canShuffle);
    });

    // shows points modal
    this.socket.fromEvent('get_updated_points').subscribe(()=>{
      this.getUpdatedPoints$.next(true);
    });

    // server announces round_complete
    this.socket.fromEvent('round_complete').subscribe(()=>{
      this.roundComplete$.next(true);
    });

    // update points based on server feedback
    this.socket.on('update_points', this.onUpdatePoints.bind(this));

    //////////////////////////////////////////////////////////////////////////////////
    ////////////////////////// webrtc events//////////////////////////////////////////

    this.socket.on('start_call', async (event: any) => {
      const remotePeerId = event.senderId;
      console.log(`Socket event callback: start_call. RECEIVED from ${remotePeerId}`);
    
      this.peerConnections[remotePeerId] = new RTCPeerConnection(this.iceServers);
      this.addLocalTracks(this.peerConnections[remotePeerId]);
      this.peerConnections[remotePeerId].ontrack = (event: any) => this.setRemoteStream(event, remotePeerId);
      this.peerConnections[remotePeerId].oniceconnectionstatechange = (event: any) => this.checkPeerDisconnect(event, remotePeerId);
      this.peerConnections[remotePeerId].onicecandidate = (event: any) => this.sendIceCandidate(event, remotePeerId);
      await this.createOffer(this.peerConnections[remotePeerId], remotePeerId);
    });

    /**
     * webrtc_offer message received with the offer and sends the response to the other peer
     */
    this.socket.on('webrtc_offer', async (event: any) => {
      console.log(`Socket event callback: webrtc_offer. RECEIVED from ${event.senderId}`);
      const remotePeerId = event.senderId;

      this.peerConnections[remotePeerId] = new RTCPeerConnection(this.iceServers);
      console.log(new RTCSessionDescription(event.sdp));
      this.peerConnections[remotePeerId].setRemoteDescription(new RTCSessionDescription(event.sdp));
      console.log(`Remote description set on peer ${this.localPeerId} after offer received`);
      this.addLocalTracks(this.peerConnections[remotePeerId]);

      this.peerConnections[remotePeerId].ontrack = (event: any) => this.setRemoteStream(event, remotePeerId)
      this.peerConnections[remotePeerId].oniceconnectionstatechange = (event:any) => this.checkPeerDisconnect(event, remotePeerId);
      this.peerConnections[remotePeerId].onicecandidate = (event:any) => this.sendIceCandidate(event, remotePeerId)
      await this.createAnswer(this.peerConnections[remotePeerId], remotePeerId)
    });

    this.socket.on('webrtc_answer', async (event: any) => {
      console.log(`Socket event callback: webrtc_answer. RECEIVED from ${event.senderId}`)
    
      console.log(`Remote description set on peer ${this.localPeerId} after answer received`)
      this.peerConnections[event.senderId].setRemoteDescription(new RTCSessionDescription(event.sdp))
      //addLocalTracks(peerConnections[event.senderId])
      console.log(new RTCSessionDescription(event.sdp))
    });

    this.socket.on('webrtc_ice_candidate', (event: any) => {
      const senderPeerId = event.senderId;
      console.log(`Socket event callback: webrtc_ice_candidate. RECEIVED from ${senderPeerId}`)
    
      // ICE candidate configuration.
      var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate,
      })
      this.peerConnections[senderPeerId].addIceCandidate(candidate)
    });

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
   * keeps track of connected users to the server
   * @param users 
   */
    setServerUsers(users: UserTracker){
      this.serverUsers= users;
    }

    // function to update displayed points
    onUpdatePoints(currentPoints: Points){
      // decides if active player is team one
      let activePlayerTeamOne = this.activePlayerSerial === 'one' || this.activePlayerSerial === 'three';
  
      // display points and sets taken
      this.ownerTeamPoints = activePlayerTeamOne ? currentPoints.team1 : currentPoints.team2;
      this.opponentTeamPoints = activePlayerTeamOne ? currentPoints.team2: currentPoints.team1;
  
      this.ownerTeamSets = activePlayerTeamOne ? currentPoints.setsTakenByTeam1 : currentPoints.setsTakenByTeam2;
      this.opponentTeamSets = activePlayerTeamOne ? currentPoints.setsTakenByTeam2 : currentPoints.setsTakenByTeam1;

      this.activeGamesByTeam1 = activePlayerTeamOne ? currentPoints.activeGamesByTeam1 : currentPoints.activeGamesByTeam2;
      this.activeGamesByTeam2 = activePlayerTeamOne ? currentPoints.activeGamesByTeam2 : currentPoints.activeGamesByTeam1;

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
    this.roomId = event.roomId;
    this.activePlayerSerial = event.serial;
    localStorage.setItem('serial', event.serial);
    localStorage.setItem('roomId', event.roomId);
    this.calculateOrientationToSerialMapping();
    this.onOwnerJoiningRoom$.next(true);
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


  //////////////////////////////////////////////////////////////////////////
  ////////////////////////webrtc functions ///////////////////////////////

  async setLocalStream() {
    console.log('Local stream set');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(this.mediaConstraints);
    } catch (error) {
      console.error('Could not get user media', error);
    };
  
    this.localStream = stream;
    this.videoElements[this.videoElementsCounter].srcObject = stream;
    this.videoElements[this.videoElementsCounter].volume = 0;
    this.videoElementsCounter++;
    this.socket.emit('start_call', {
      roomId: this.roomId,
      senderId: this.localPeerId
    });
  }

  /**
   * adds a media stream to the received RTCPeerConnection object
   */
  addLocalTracks(rtcPeerConnection: any) {
    this.localStream.getTracks().forEach((track: any) => {
      rtcPeerConnection.addTrack(track, this.localStream);
    });
    console.log("Local tracks added");
  }

  /**
   * Callback when the multimedia stream is received from the remote peer
   */
  setRemoteStream(event: any, remotePeerId: string) {
    console.log('Remote stream set');
    if(event.track.kind == "video") {
      const videoRemote = this.videoElements[this.videoElementsCounter];
      videoRemote.srcObject = event.streams[0];
      videoRemote.setAttribute('autoplay', '');
      videoRemote.style.backgroundColor = "red";
      this.videoElementsCounter++;
    }
  }

  /**
   * Checks if the peer has disconnected when it receives the onicestatechange event of the RTCPeerConnection object
   */
  checkPeerDisconnect(event: any, remotePeerId: string) {
    var state = this.peerConnections[remotePeerId].iceConnectionState;
    console.log(`connection with peer ${remotePeerId}: ${state}`);
    if (state === "failed" || state === "closed" || state === "disconnected") {
      //Remove the video element from the DOM if the peer has been disconnected
      console.log(`Peer ${remotePeerId} has disconnected`);
      this.videoElementsCounter--;
    }
  }

  /**
   * Sends the ICE candidate received from when the onicecandidate event of the RTCPeerConnection object is received
   */
  sendIceCandidate(event: any, remotePeerId: string) {
    if (event.candidate) {
      console.log(`Sending ICE Candidate from peer ${this.localPeerId} to peer ${remotePeerId}`);
      this.socket.emit('webrtc_ice_candidate', {
        senderId: this.localPeerId,
        receiverId: remotePeerId,
        roomId: this.roomId,
        label: event.candidate.sdpMLineIndex,
        candidate: event.candidate.candidate,
      });
    }
  }

  /**
   * Create the offer with the SDP information and send it with the webrtc_offer message
   */
  async createOffer(rtcPeerConnection: any, remotePeerId: any) {
    let sessionDescription;
    try {
      sessionDescription = await rtcPeerConnection.createOffer(this.offerOptions);
      rtcPeerConnection.setLocalDescription(sessionDescription);
    } catch (error) {
      console.error(error);
    }

    console.log(`Sending offer from peer ${this.localPeerId} to peer ${remotePeerId}`)
    this.socket.emit('webrtc_offer', {
      type: 'webrtc_offer',
      sdp: sessionDescription,
      roomId: this.roomId,
      senderId: this.localPeerId,
      receiverId: remotePeerId
    })
  }

  async createAnswer(rtcPeerConnection: any, remotePeerId: string) {
    let sessionDescription;
    try {
      sessionDescription = await rtcPeerConnection.createAnswer(this.offerOptions);
      rtcPeerConnection.setLocalDescription(sessionDescription);
    } catch (error) {
      console.error(error);
    }
  
    console.log(`Sending answer from peer ${this.localPeerId} to peer ${remotePeerId}`);
    this.socket.emit('webrtc_answer', {
      type: 'webrtc_answer',
      sdp: sessionDescription,
      roomId: this.roomId,
      senderId: this.localPeerId,
      receiverId: remotePeerId
    })
  }
}