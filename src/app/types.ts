export interface PlayedCard {
  serial: Serial; // this card belongs to whom
  card: Card | null;
  playedBy: Serial;
  next?: NextPlay // may indicate who will play next
}

export interface Card   {
  cardType: CardType | '',
  cardValue: CardValue | ''
};

export const BlankCard: Card = {
  cardType: '',
  cardValue: ''
}

export function getBlankSet():Card[]{
  return new Array(13).fill(BlankCard); 
}

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
  currentPoints: Points, 
  cardHistory: [Card[]] // keep track of cards 13 * 4 cards for a running game
}

export interface Points { //interface of play points
  team1: number, // one + three = team 1, two + four = team2
  team2: number,
  setsTakenByTeam1: number,
  setsTakenByTeam2: number,
  activeGamesByTeam1: number, // did team1 already give a game - helps when points are calculated
  activeGamesByTeam2: number
}

// information about who will play next and which cards
export interface NextPlay {
  nextPlayer: Serial, // player one/two/three/four will play
  nextCards: Serial // serial one/two/three/four cards will play (based on shown cards)
  clearTable?: boolean // on round_complete - other times this will be blank
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
  serial: Serial,
  cards: Card[]
}


/**
 * events appendix
 * ----------------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------------------
 * 
 * connection events (server to client)
 * ----------------------------------------------------------------------------
 * owner - actual client/browser
 * 
 * connect - event about the owner has connected to the server
 * disconnect - event about the owner has disconnected from the server
 * 
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
 * card events (server to client)
 * ----------------------------------------------------------------------------------
 * shuffleCard- provides owner 13 cards for the owner - rest 39 cards are face down
 * standing_call - broadcasts standing call to everyone
 * show_cards - provides 13 cards for a player to show (when a player shows card)
 * 
 * distribute_cards -listening to event when card is distributed 
 * 
 * next_player - listening to announcement of next player to play
 * 
 * played_card - listening to event when server notifies a particular card is played
 * unplayed_card - listening to event when a card is unplayed
 * 
 * can_shuffle - listening to event when can be shuffled
 * 
 * get_updated_points - notifies it is time to input points. also provides updated sets taken after round completed
 * update_points - broadcasts updates points to all in the room
 * 
 * 
 * client to server
 * ------------------------------------------------
 * join - notifies the server that users wants to join a particular room
 * shuffleCard -asks the server to shuffle card
 * playCard - send info to server that user serial 1/2/3/4 has played a particular card
 * unplayCard - notifies server that the user has unplayed one particular card
 * callDecided - notifies server about the decided call
 * roundComplete - notifies server that current round is complete
 * completeGame - notifies server that the game is complete and gives points update for the game
 */


/*** logical flow
 * ---------------------
 * --- after shuffling and call decided - nextplayer(player, card, clearTable) and standing_call (ex.2-hearts) are fired. We clearTable 
 * based since nextPlayer has clearTable field true and activate cards for ext player and playable cards
 * 
 * -- for 1st, 2nd and 3rd played card in the round - server attaches next playable with played card - from which client plays the card
 * and activates next playable and deactivates others
 * 
 * -- for 4th card in the round - server does not attach next playable with played card. Thats how client decideds to show 
 * complete_round button. (since next playable is absent - activated card does not deactivated automatically. thats why we have to
 * deacticate it on the client side whenever a card is played. Otherwise that player may play another card and things mess up)
 * 
 * -- when the complete_round button is pressed - winner card decided. points get updated. We send next playable info with cleartable
 * (nextplayer(player, card, clearTable). We send a seperate event to update the points
 * 
 * -- all rounds run similar way upto round 13
 * 
 * -- on round 13 - when complete_round button is pressed- we send get_updated_points event to user to show points modal. After receiving
 * the event - UI clears the table and user fills up the point for game and submits it. upon submission -  
 * 
 * -- upon receiving completeGame event - server updates and clean up the table including points. Then the user broadcasts 
 * can_shuffle event to client (when UI receives can_shuffle event - it resets table (clears played cards and gives blank cards to all))
 * and also activates shuffle card
 * 
 * thats how this cycle continues
 */