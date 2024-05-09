import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
    private notificationSubject: Subject<NotificationMessage> = new Subject<NotificationMessage>();

    sendMessage(message: NotificationMessage) {
        this.notificationSubject.next(message);
    }

    constructor(private toastrService: ToastrService) {
        this.notificationSubject.subscribe({
            next: message => {
                switch(message.type) {
                    case NotificationType.success :
                        this.toastrService.success(message.message);
                        break;
                    case NotificationType.error :
                        this.toastrService.error(message.message);
                        break;
                    case NotificationType.warning :
                        this.toastrService.warning(message.message);
                        break;
                    case NotificationType.info :
                        this.toastrService.info(message.message);
                        break;
                    default:
                        this.toastrService.info(message.message);
                        break;
                }
            },
            error: err =>{
                console.log('Error while processing toastr message-', err);
            }
        })
    }
}

export type NotificationMessage = {
    message: string;
    type: NotificationType
}

export enum NotificationType {
    success = 0,
    warning = 1,
    error = 2,
    info = 3
}