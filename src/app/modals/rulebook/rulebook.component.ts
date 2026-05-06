import { Component } from '@angular/core';

type RuleSection = {
  title: string;
  items: string[];
};

@Component({
  selector: 'app-rulebook',
  templateUrl: './rulebook.component.html',
  styleUrl: './rulebook.component.css'
})
export class RulebookComponent {
  readonly sections: RuleSection[] = [
    {
      title: 'Basics',
      items: [
        'International Bridge is a four-player partnership trick-taking game played with a standard 52-card deck.',
        'Players sitting opposite each other are partners. In this app, Players 1 and 3 form one team, and Players 2 and 4 form the other.',
        'Each hand deals 13 cards to every player.',
        'Every deal has three parts: the auction, the play, and the scoring.'
      ]
    },
    {
      title: 'Auction',
      items: [
        'Bidding moves clockwise, and the opening bidder rotates from hand to hand.',
        'A bid names a level from 1 to 7 and a denomination: ♣, ♦, ♥, ♠, or NT.',
        'At the same level, the rank order is ♣, then ♦, then ♥, then ♠, then NT.',
        'A new bid must be higher than the current highest bid, either by level or by denomination at the same level.',
        'If nobody has bid yet, four straight passes cause a redeal and the last passer\'s team loses 50 points.',
        'Once there is a valid highest bid, three straight passes end the auction.'
      ]
    },
    {
      title: 'Contract, Declarer, And Dummy',
      items: [
        'The final bid becomes the contract.',
        'The declarer is the first player from the winning partnership who bid the denomination of the final contract.',
        'The player to declarer\'s left makes the opening lead.',
        'Immediately after the opening lead, declarer\'s partner will show their hand, also called dummy.',
        'Declarer controls both the declarer hand and the dummy hand during play.'
      ]
    },
    {
      title: 'Play Of The Hand',
      items: [
        'A trick consists of four cards, one from each player, played clockwise.',
        'If the contract is a suit contract, that suit is trump. In NT there is no trump suit.',
        'Players must follow the lead suit whenever they still hold a card in that suit.',
        'If a player cannot follow suit, they may play any card. In a suit contract, that includes trump.',
        'If one or more trump cards are played in a trick, the highest trump wins the trick.',
        'If no trump card is played, the highest card in the suit led wins the trick.',
        'The winner of a trick leads to the next trick.',
        'In this app, trump may not be led until it has been broken, unless the hand on lead contains only trump cards.'
      ]
    },
    {
      title: 'Making The Contract',
      items: [
        'The declaring side must win at least 6 plus the bid level in total tricks to make the contract.',
        'For example, 1-level contracts need 7 tricks, 2-level contracts need 8, and 7-level contracts need all 13.',
        'If the declaring side fails to win enough tricks, the contract is set.'
      ]
    },
    {
      title: 'App Scoring',
      items: [
        'This app uses its own running-score system inspired by bridge, not standard duplicate scoring.',
        'If the contract fails, the declaring side loses 50 points for each undertrick.',
        'If the contract makes, the declaring side scores for total tricks won: ♣ = 6 per trick above book, ♦ = 7, ♥ = 8, ♠ = 9, NT = 10.',
        'Only the declaring side receives contract points or contract penalties.',
        'The scoreboard is cumulative across hands.'
      ]
    },
    {
      title: 'Honors In This App',
      items: [
        'In a suit contract, honors are A, K, Q, J, and 10 of trump. In NT, honors are the four aces.',
        'If one player holds all 5 trump honors, that team gets 100 honors points.',
        'If one player holds 4 trump honors, that team gets 80 plus 10 for each additional trump honor held by partner.',
        'Otherwise, the partnership with more honors scores 10 points per honor. Equal honors score nothing.',
        'In NT, one player holding all 4 aces scores 100. Otherwise, the partnership with more aces scores 10 points per ace.'
      ]
    },
    {
      title: 'Games And Bonuses In This App',
      items: [
        'If the declaring side makes a contract worth more than 30 contract points, that side earns one active game.',
        'When a side reaches two active games, it scores a RUB bonus of 250 points and both active game counters reset.',
        'If the declaring side makes the contract and wins 12 tricks, it gets an LS bonus of 50 points.',
        'If the declaring side makes the contract and wins all 13 tricks, it gets a GS bonus of 100 points.',
        'Tricks won in the current hand reset after scoring, but team totals continue to carry forward.'
      ]
    }
  ];
}
