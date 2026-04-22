import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { ConnectionService } from './connection.service';

@Injectable({
  providedIn: 'root'
})
export class WebrtcService {

  videoElements!: any[];
  callJoined = false;
  callJoining = false;
  remoteVideoSlots: Record<string, number> = {};
  mediaConstraints = {
    audio: true,
    video:{
      width: { max: 160, ideal: 320 },
      height: { max: 120, ideal: 240 },
      frameRate: 4
    }
  };

  offerOptions = {
    offerToReceiveVideo: 1,
    offerToReceiveAudio: 1,
  };

  peerConnections: any = {};
  localStream!: any;
  rtcPeerConnection: any; // Connection between the local device and the remote peer.

// Used ICE servers. Only STUN servers in this case.
  iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  constructor(private socket: Socket, private connecTionService: ConnectionService) {
    this.socket.on('start_call', async (event: any) => {
      if (!this.callJoined) {
        return;
      }

      const remotePeerId = event.senderId;
      // console.log(`Socket event callback: start_call. RECEIVED from ${remotePeerId}`);
    
      this.peerConnections[remotePeerId] = new RTCPeerConnection(this.iceServers);
      this.addLocalTracks(this.peerConnections[remotePeerId]);
      this.peerConnections[remotePeerId].ontrack = (event: any) => this.setRemoteStream(event, remotePeerId);
      this.peerConnections[remotePeerId].oniceconnectionstatechange = (event: any) => this.checkPeerDisconnect(event, remotePeerId);
      this.peerConnections[remotePeerId].onicecandidate = (event: any) => this.sendIceCandidate(event, remotePeerId);
      await this.createOffer(this.peerConnections[remotePeerId], remotePeerId);
    });

    /**
     * webrtc_offer message received with the offer and sends the response to the other peer
     */
    this.socket.on('webrtc_offer', async (event: any) => {
      if (!this.callJoined) {
        return;
      }

      // console.log(`Socket event callback: webrtc_offer. RECEIVED from ${event.senderId}`);
      const remotePeerId = event.senderId;

      this.peerConnections[remotePeerId] = new RTCPeerConnection(this.iceServers);
      // console.log(new RTCSessionDescription(event.sdp));
      this.peerConnections[remotePeerId].setRemoteDescription(new RTCSessionDescription(event.sdp));
      // console.log(`Remote description set on peer ${this.connecTionService.localPeerId} after offer received`);
      this.addLocalTracks(this.peerConnections[remotePeerId]);

      this.peerConnections[remotePeerId].ontrack = (event: any) => this.setRemoteStream(event, remotePeerId)
      this.peerConnections[remotePeerId].oniceconnectionstatechange = (event:any) => this.checkPeerDisconnect(event, remotePeerId);
      this.peerConnections[remotePeerId].onicecandidate = (event:any) => this.sendIceCandidate(event, remotePeerId)
      await this.createAnswer(this.peerConnections[remotePeerId], remotePeerId)
    });

    this.socket.on('webrtc_answer', async (event: any) => {
      if (!this.callJoined || !this.peerConnections[event.senderId]) {
        return;
      }

      // console.log(`Socket event callback: webrtc_answer. RECEIVED from ${event.senderId}`)
    
      // console.log(`Remote description set on peer ${this.connecTionService.localPeerId} after answer received`)
      this.peerConnections[event.senderId].setRemoteDescription(new RTCSessionDescription(event.sdp))
      //addLocalTracks(peerConnections[event.senderId])
      // console.log(new RTCSessionDescription(event.sdp))
    });

    this.socket.on('webrtc_ice_candidate', (event: any) => {
      if (!this.callJoined) {
        return;
      }

      const senderPeerId = event.senderId;
      // console.log(`Socket event callback: webrtc_ice_candidate. RECEIVED from ${senderPeerId}`)
    
      // ICE candidate configuration.
      var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate,
      })
      this.peerConnections[senderPeerId]?.addIceCandidate(candidate)
    });
  }

  async setLocalStream() {
    if (this.callJoined || this.callJoining) {
      return;
    }

    this.callJoining = true;
    // console.log('Local stream set');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(this.mediaConstraints);
    } catch (error) {
      console.error('Could not get user media', error);
      alert(`Could not access camera/microphone: ${error instanceof Error ? error.message : String(error)}`);
      this.callJoining = false;
      return;
    }

    this.localStream = stream;
    const localVideoElement = this.videoElements[0];
    localVideoElement.srcObject = stream;
    localVideoElement.volume = 0;
    localVideoElement.muted = true;
    this.callJoined = true;
    this.callJoining = false;
    this.socket.emit('start_call', {
      roomId: this.connecTionService.roomId,
      senderId: this.connecTionService.localPeerId
    });
  }

  /**
   * adds a media stream to the received RTCPeerConnection object
   */
  addLocalTracks(rtcPeerConnection: any) {
    this.localStream.getTracks().forEach((track: any) => {
      rtcPeerConnection.addTrack(track, this.localStream);
    });
    // console.log("Local tracks added");
  }

  /**
   * Callback when the multimedia stream is received from the remote peer
   */
  setRemoteStream(event: any, remotePeerId: string) {
    // console.log('Remote stream set');
    if (event.track.kind == 'video') {
      const slotIndex = this.remoteVideoSlots[remotePeerId] ?? this.getNextRemoteVideoSlot();
      if (slotIndex === -1) {
        return;
      }

      this.remoteVideoSlots[remotePeerId] = slotIndex;
      const videoRemote = this.videoElements[slotIndex];
      videoRemote.srcObject = event.streams[0];
      videoRemote.setAttribute('autoplay', '');
      videoRemote.style.backgroundColor = 'transparent';
    }
  }

  /**
   * Checks if the peer has disconnected when it receives the onicestatechange event of the RTCPeerConnection object
   */
  checkPeerDisconnect(event: any, remotePeerId: string) {
    var state = this.peerConnections[remotePeerId].iceConnectionState;
    // console.log(`connection with peer ${remotePeerId}: ${state}`);
    if (state === "failed" || state === "closed" || state === "disconnected") {
      console.log(`Peer ${remotePeerId} has disconnected`);
      this.clearRemoteVideo(remotePeerId);
      this.peerConnections[remotePeerId]?.close();
      delete this.peerConnections[remotePeerId];
    }
  }

  dropCall() {
    this.callJoining = false;
    this.callJoined = false;

    Object.keys(this.peerConnections).forEach((remotePeerId) => {
      this.peerConnections[remotePeerId]?.close();
      this.clearRemoteVideo(remotePeerId);
      delete this.peerConnections[remotePeerId];
    });

    this.localStream?.getTracks()?.forEach((track: MediaStreamTrack) => {
      track.stop();
    });
    this.localStream = undefined;
    this.clearVideoElement(0);
  }

  /**
   * Sends the ICE candidate received from when the onicecandidate event of the RTCPeerConnection object is received
   */
  sendIceCandidate(event: any, remotePeerId: string) {
    if (event.candidate) {
      // console.log(`Sending ICE Candidate from peer ${this.connecTionService.localPeerId} to peer ${remotePeerId}`);
      this.socket.emit('webrtc_ice_candidate', {
        senderId: this.connecTionService.localPeerId,
        receiverId: remotePeerId,
        roomId: this.connecTionService.roomId,
        label: event.candidate.sdpMLineIndex,
        candidate: event.candidate.candidate,
      });
    }
  }

  /**
   * Create the offer with the SDP information and send it with the webrtc_offer message
   */
  async createOffer(rtcPeerConnection: any, remotePeerId: any) {
    let sessionDescription;
    try {
      sessionDescription = await rtcPeerConnection.createOffer(this.offerOptions);
      rtcPeerConnection.setLocalDescription(sessionDescription);
    } catch (error) {
      console.error(error);
    }

    console.log(`Sending offer from peer ${this.connecTionService.localPeerId} to peer ${remotePeerId}`)
    this.socket.emit('webrtc_offer', {
      type: 'webrtc_offer',
      sdp: sessionDescription,
      roomId: this.connecTionService.roomId,
      senderId: this.connecTionService.localPeerId,
      receiverId: remotePeerId
    })
  }

  async createAnswer(rtcPeerConnection: any, remotePeerId: string) {
    let sessionDescription;
    try {
      sessionDescription = await rtcPeerConnection.createAnswer(this.offerOptions);
      rtcPeerConnection.setLocalDescription(sessionDescription);
    } catch (error) {
      console.error(error);
    }
  
    // console.log(`Sending answer from peer ${this.connecTionService.localPeerId} to peer ${remotePeerId}`);
    this.socket.emit('webrtc_answer', {
      type: 'webrtc_answer',
      sdp: sessionDescription,
      roomId: this.connecTionService.roomId,
      senderId: this.connecTionService.localPeerId,
      receiverId: remotePeerId
    })
  }

  private getNextRemoteVideoSlot(): number {
    const occupiedSlots = new Set(Object.values(this.remoteVideoSlots));
    for (let index = 1; index < this.videoElements.length; index++) {
      if (!occupiedSlots.has(index)) {
        return index;
      }
    }

    return -1;
  }

  private clearRemoteVideo(remotePeerId: string) {
    const slotIndex = this.remoteVideoSlots[remotePeerId];
    if (slotIndex === undefined) {
      return;
    }

    this.clearVideoElement(slotIndex);
    delete this.remoteVideoSlots[remotePeerId];
  }

  private clearVideoElement(index: number) {
    const videoElement = this.videoElements[index];
    if (!videoElement) {
      return;
    }

    videoElement.pause?.();
    videoElement.srcObject = null;
    videoElement.removeAttribute('src');
    videoElement.load?.();
    videoElement.style.backgroundColor = 'transparent';
  }
}
