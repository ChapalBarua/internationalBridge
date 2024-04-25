export interface PlayedCard {
  serial: Serial;
  card: Card | null;
  next?: Serial // may indicate who will play next
}

export interface Card   {
  cardType: CardType | '',
  cardValue: CardValue | ''
};

export const BlankCard: Card = {
  cardType: '',
  cardValue: ''
}

export const BlankSet: Card[] = new Array(13).fill(BlankCard);

// function isCard(object: any): object is Card {
//   return 'fooProperty' in object;
// }

// export interface FaceDownCard {};

// export const BlankCard: FaceDownCard = {};
// export const BlankSet = new Array(13).fill(BlankCard);

export type Orientation = "left" | "right" | "top" | "bottom";
export type Serial = "two" | "four" | "three" | "one";

const cardSuits = ['diamonds', 'clubs', 'hearts', 'spades'] as const;


export type CardType = typeof cardSuits[number];

const cardValues = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'] as const;
export type CardValue = typeof cardValues[number];

export function generateImageUrl(card: Card): string{
    let imageUrl = "assets/svg-cards/" + card.cardValue + '_of_' + card.cardType + '.svg';
    return imageUrl;
}

export function sortCards(cards: Card[]){
  return cards.sort((card1,card2)=>{
    let card1Priority = cardSuits.findIndex(suit=> card1.cardType===suit) * cardValues.length +  cardValues.findIndex(value=>card1.cardValue===value);
    let card2Priority = cardSuits.findIndex(suit=> card2.cardType===suit) * cardValues.length +  cardValues.findIndex(value=>card2.cardValue===value);
    return card2Priority - card1Priority;
  })
}

export interface RoomJoin {
  roomId: string,
  peerId: string,
  user: string,
  serial: Serial, // player identity - 1/2/3/4
  players: SerialNameMapping
}

export interface SerialNameMapping {
  one: string,
  two: string,
  three: string,
  four: string
}

export interface OrientationSerialMapping {
  bottom: Serial,
  left: Serial,
  top: Serial,
  right: Serial
} 

// will be used by server

// details about call
export interface CallInfo {
  color: string,
  call: number,
  personCalled: Serial
}

export type tables = table[];

export type table = {
  roomid: number,
  cards: {
    one: Card[],
    two: Card[],
    three: Card[],
    four: Card[]
  },
  players: SerialNameMapping,
  cardsOnTable: Card[], // list of played cards in current round,
  cardShown: boolean, // indicates if second player has already shown cards or not
  currentRound: number, // running round out of 13 card set (4*13)
  completedGame: number, // how many games are completed
  currentSetColor: string,
  whoSetColor: Serial, //('one', 'two', 'three', 'four')
  whoShowCards: Serial, // ('one', 'two', 'three', 'four')
  currentCall: number, // 1,2,3,4,5,6,7
  whoPlayNext: string, // 'one','two','three','four,'
  usersOnTable: number, // how many users are currently on the table
  currentPoints: { // one + three = team 1, two + four = team2
    team1: number,
    team2: number,
    setsTakenByTeam1: number,
    setsTakenByTeam2: number
  }
}

// information about who will play next and which cards
export interface NextPlay {
  nextPlayer: Serial, // pllayer one/two/three/four will play
  nextCards: Serial // serial one/two/three/four cards will play (based on shown cards)
}

export const NextPlayer = { // helper object to decide who will play next
  one: 'two',
  two: 'three',
  three: 'four',
  four: 'one'
}

export type socketUser = {
  name: string;
  serial: Serial;
}

export interface UserTracker { // this is the tracking data of all connected users and active users(joined in room/table)
  connectedUsers : number,
  activeUsers : number
}

export interface ShownCards { // server broadcasts the shown cards to everyone in the room
  user: string,
  serial: Serial,
  cards: Card[]
}


/**
 * events appendix
 * 
 * connection events
 * ----------------------------------------------------------------------------
 * owner - actual client/browser
 * room_created - event about creating and joining a room by the owner
 * room_joined - event about joining an existing room by the owner
 * 
 * user_connected - event about any user connecting to server
 * user_disconnected - event about any user disconnected from the server
 * 
 * user_active - listening to event about new user joined any room
 * user_inactive - listening to event about any user leaving any room
 * 
 * user_joined_room - listening to event about new user has joined the same room
 * user_left_room - listening to event about a user has left the same room
 * 
 * capacity_full - listening to event about the owner failed to join a room
 * 
 * played_card - listening to event when server notifies a particular card is played
 * 
 * 
 * 
 * card events
 * ----------------------------------------------------------------------------------
 * shuffle card - provides owner 13 cards for the owner - rest 39 cards are face down
 * show_cards - provides 13 cards for a player to show (when a player shows card)
 * playCard - send info to server that serial 1/2/3/4 has played a particular card
 */