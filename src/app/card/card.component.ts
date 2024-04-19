import { AfterViewInit, ChangeDetectionStrategy, Component, Input, OnChanges, OnInit } from '@angular/core';
import { CardService } from '../card.service';
import { Card, generateImageUrl } from '../types';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() card!: Card;
  @Input() orientation!: string;
  @Input() height: string = "55px";
  @Input() width: string = "50px";
  imageUrl ='';

  constructor(private cardService: CardService){

  }
  ngAfterViewInit(): void {
    
  }


  ngOnInit(): void {
    
  }

  ngOnChanges(): void {
    this.imageUrl = generateImageUrl(this.card);
  }

  onClick(){
    this.cardService.playCard({ player: this.orientation, card: this.card});
  }
}