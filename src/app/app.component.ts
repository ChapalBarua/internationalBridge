import { Component } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(private swUpdate: SwUpdate) {
    if(!this.swUpdate.isEnabled){
      return;
    }

    this.swUpdate.versionUpdates.subscribe((event) => {
      if(event.type === 'VERSION_READY'){
        window.location.reload();
      }
    });
  }
}
