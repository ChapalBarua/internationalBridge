export interface PlayedCard {
  player: string;
  card: Card | null;
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
  orientation: Orientation,
  players: Players
}

export interface Players {
  bottom: '',
  left: '',
  top: '',
  right: ''
}

// will be used by server

export type tables = table[];

export type table = {
  roomid: number,
  cards: {
    top: Card[],
    bottom: Card[],
    left: Card[],
    right: Card[]
  },
  players: Players,
  currentRound: number, // running round out of 13 card set (4*13)
  completedGame: number, // how many games are completed
  currentSetColor: string,
  whoSetColor: string //('top', 'bottom', 'left', 'right')
}

export type socketUser = {
  name: string;
  orientation: Orientation;
}

export interface UserTracker { // this is the tracking data of all connected users and active users(joined in room/table)
  connectedUsers : number,
  activeUsers : number
}

export interface ShownCards { // server broadcasts the shown cards to everyone in the room
  user: string,
  orientation: Orientation,
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
 * 
 * 
 * card events
 * ----------------------------------------------------------------------------------
 * shuffle card - provides owner 13 cards for the owner - rest 39 cards are face down
 * show_cards - provides 13 cards for a player to show (when a player shows card)
 */