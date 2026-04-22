import { AfterViewInit, ChangeDetectorRef, Component } from '@angular/core';
import { WebrtcService } from '../../service/webrtc.service';
import { ConnectionService } from 'src/app/service/connection.service';
import { CardService } from 'src/app/service/card.service';

@Component({
  selector: 'app-game-info',
  templateUrl: './game-info.component.html',
  styleUrl: './game-info.component.css'
})
export class GameInfoComponent implements AfterViewInit{

  constructor(
    public webRtcService: WebrtcService,
    public connectionService: ConnectionService,
    public cardService: CardService,
    private changeDetector: ChangeDetectorRef
  ){
    this.cardService.gameInfoUpdate$.subscribe(change=>{
      this.triggerChanges();
    })
  }

  async ngAfterViewInit(): Promise<void> {
    // setting up webrtc
    let videoElements: any[] = [];
    videoElements[0] = document.getElementById('video-1');
    videoElements[1] = document.getElementById('video-2');
    videoElements[2] = document.getElementById('video-3');
    videoElements[3] = document.getElementById('video-4');
    this.webRtcService.videoElements = videoElements;
  }

  triggerChanges(){
    this.changeDetector.detectChanges();
  }

  async joinCall(): Promise<void> {
    await this.webRtcService.setLocalStream();
    this.triggerChanges();
  }

  dropCall(): void {
    this.webRtcService.dropCall();
    this.triggerChanges();
  }
}
