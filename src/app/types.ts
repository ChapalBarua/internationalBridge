export interface PlayedCard {
  player: string;
  card: Card | null;
}

export type Card  = {
  cardType: CardType,
  cardValue: CardValue
};

export type Orientation = "left" | "right" | "top" | "bottom";

const cardSuits = ['diamonds', 'clubs', 'hearts', 'spades'] as const;
export type CardType = typeof cardSuits[number];

const cardValues = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'] as const;
export type CardValue = typeof cardValues[number];

export function generateImageUrl(card: Card): string{
    let imageUrl = "assets/svg-cards/" + card.cardValue + '_of_' + card.cardType + '.svg';
    return imageUrl;
}

export function getShuffledCardsDeck(): Card[]{

  let res: Card[] = []; 
    
  for (let type of cardSuits) {
      for (let value of cardValues) {
        res.push({cardType: type, cardValue: value});
      } 
  } 
    
  for (let i = res.length - 1; i > 0; i--) { 
      let j = Math.floor(Math.random() * (i + 1)); 
      [res[i], res[j]] = [res[j], res[i]]; 
  }

  return wellDistributedDeck(res) ? res : getShuffledCardsDeck(); // checks for face card distribution
}

/**
 * 
 * @param cards 52 cards deck
 * @returns if 4 set of 13 cards all have face cards
 */
export function wellDistributedDeck(cards: Card[]): boolean | undefined{
  if(cards.length != 52) {
    console.log('Full 52 cards deck is not provided');
    return;
  }
  return checkFaceCard(cards.slice(0,13)) && checkFaceCard(cards.slice(13,26)) && checkFaceCard(cards.slice(26,39)) && checkFaceCard(cards.slice(39,52))
}
  
export function checkFaceCard(cards: Card[]): boolean{
  let faceCards = cards.filter(card=> cardValues.slice(9,13).includes(card.cardValue));
  return faceCards.length > 0;
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
  players: {
    top: Card[],
    bottom: Card[],
    left: Card[],
    right: Card[]
  }
  currentRound: number, // running round out of 13 card set (4*13)
  completedGame: number, // how many games are completed
  currentSetColor: string,
  whoSetColor: string //('top', 'bottom', 'left', 'right')
}

export type socketUser = {
  name: string;
  orientation: Orientation;
}