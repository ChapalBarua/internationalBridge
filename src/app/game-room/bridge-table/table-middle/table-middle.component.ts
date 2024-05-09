import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { CardService } from '../../../service/card.service';
import { ConnectionService } from 'src/app/service/connection.service';
import { Orientation, Serial } from 'src/app/types/types';

@Component({
  selector: 'app-table-middle',
  templateUrl: './table-middle.component.html',
  styleUrl: './table-middle.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableMiddleComponent{

  constructor(
    public connectionService: ConnectionService,
    public cardService: CardService,
    public changeDetector: ChangeDetectorRef
  ){
    this.connectionService.middleTableChanges$.subscribe(change=>{
      this.triggerChanges();
    })
  }

  @Input()
  canShuffle = false;

  @Input()
  nextPlayer: Orientation | string = '';

  /**
 * notify server after shuffle button is pressed
 */
  onshuffle(){
    this.canShuffle = false;
    this.cardService.shuffleCard();
  }

  onUndoMove(){
    this.cardService.unPlayCard();
  }

  triggerChanges(){
    this.changeDetector.detectChanges();
  }
}
