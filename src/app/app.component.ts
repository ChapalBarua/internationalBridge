import { AfterContentInit, AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { PlayerComponent } from './player/player.component';
import { CardService } from './card.service';

@Component({
  selector: 'app-root',
  template: `
  <div class="position-relative">
    <div class="left-player">
      <div class="left-player-name">Player Two</div>
      <app-player #playerTwo [orientation]="'left'"></app-player>
    </div>
      
    <div class="top-player">
      <div class="top-player-name">Player Three</div>
      <app-player #playerThree [orientation]="'top'"></app-player>
    </div>

    <div class="bottom-player">
      <div class="bottom-player-name">Player One</div>
      <app-player #playerOne [orientation]="'bottom'"></app-player>
    </div>

    <div class="right-player">
      <div class="right-player-name">Player Four</div>
      <app-player #playerFour [orientation]="'right'"></app-player>
    </div>
  </div>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit, AfterContentInit{
   
  title = 'internationalBridge';
  @ViewChild('playerOne') playerOne!: PlayerComponent;
  @ViewChild('playerTwo') playerTwo!: PlayerComponent;
  @ViewChild('playerThree') playerThree!: PlayerComponent;
  @ViewChild('playerFour') playerFour!: PlayerComponent;

  constructor(private cardService: CardService){
    
  }

  ngOnInit(): void {
    
  }

  ngAfterViewInit(): void {
    this.cardService.distributeCards([this.playerOne, this.playerTwo, this.playerThree, this.playerFour]);
  }

  ngAfterContentInit(): void {
  }
  
}
