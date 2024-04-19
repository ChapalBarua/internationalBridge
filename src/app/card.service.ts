import { Injectable } from '@angular/core';
import { PlayerComponent } from './player/player.component';
import { BehaviorSubject } from 'rxjs';
import { Card, PlayedCard, getShuffledCardsDeck } from './types';

@Injectable({
  providedIn: 'root'
})
export class CardService {

  playedCard$ = new BehaviorSubject<PlayedCard>({player: '', card: null});
  unPlayedCard$ = new BehaviorSubject<PlayedCard>({player: '', card: null});
  roundComplete$ = new BehaviorSubject<boolean>(true);
  reshuffle$ = new BehaviorSubject<boolean>(true);

  cardsOnBoard: Card[] = [];

  constructor() { }

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

  unPlayCard(card?: PlayedCard){
    this.unPlayedCard$.next(card ?? this.playedCard$.value);
  }

  finishRound(){
    this.roundComplete$.next(true);
  }

  shuffleCard(){
    this.reshuffle$.next(true);
  }

  showCard(cards:Card[]){

  }
}
