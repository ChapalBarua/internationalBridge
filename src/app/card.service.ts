import { Injectable } from '@angular/core';
import { Card, PlayerComponent, getShuffledCardsDeck } from './player/player.component';

@Injectable({
  providedIn: 'root'
})
export class CardService {



  constructor() { }

  distributeCards(players: PlayerComponent[]){
    let cards: Card[] = getShuffledCardsDeck();
    let numberOfCards = cards.length;
    let numberOfPlayers = players.length;
    const numberOfCardsPerPlayer = numberOfCards/numberOfPlayers;
    let i=0;
    players.forEach(player=>{
      player.setCard(cards.slice(i*numberOfCardsPerPlayer,(i+1)*numberOfCardsPerPlayer));
      i++;
    })
  }
}
