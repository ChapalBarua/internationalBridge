import { Injectable } from '@angular/core';
import { Card, PlayerComponent, getShuffledCardsDeck } from './player/player.component';
import { BehaviorSubject } from 'rxjs';
import { PlayedCard } from './card/card.component';

@Injectable({
  providedIn: 'root'
})
export class CardService {

  playedCard$ = new BehaviorSubject<PlayedCard>({player: '', cardType: '', cardValue: ''});
  unPlayedCard$ = new BehaviorSubject<PlayedCard>({player: '', cardType: '', cardValue: ''});
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
      player.setCard(cards.slice(i*numberOfCardsPerPlayer,(i+1)*numberOfCardsPerPlayer));
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
}
