import { AfterViewInit, ChangeDetectionStrategy, Component, Input, OnChanges, OnInit } from '@angular/core';
import { CardService } from '../card.service';
import { Card, Serial, generateImageUrl } from '../types';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() card!: Card;
  @Input() faceUp = false;
  @Input() orientation!: string;
  @Input() serial!: Serial;
  @Input() height: string = "55px";
  @Input() width: string = "50px";
  @Input() active = false;

  faceDownCardUrl = "assets/svg-cards/face_down.png";

  imageUrl ='';

  constructor(private cardService: CardService){

  }
  ngAfterViewInit(): void {
    
  }


  ngOnInit(): void {
    
  }

  ngOnChanges(): void {

    this.imageUrl = this.faceUp ? generateImageUrl(this.card): this.faceDownCardUrl;
    
    //this.imageUrl = this.card.cardType ? generateImageUrl(this.card): this.faceDownCardUrl;
  }

  onClick(){
    if(!this.active) return;
    this.cardService.playCard({ serial: this.serial, card: this.card, playedBy: this.cardService.activePlayerSerial});
  }
}