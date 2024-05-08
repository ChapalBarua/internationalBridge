This is a website for playing International Bridge online (multiplayer with video call). This is the UI of the application. Backend part is written in node which handles socket connection. WebRTC and socket connection is used as method of communication among the users.


Application Architecture-

![Alt text](./Bridge%20Diagram.png "Title")

Services -
-------------------------------------
WebRTc Service - Takes Care of Video Call

Connection Service - Takes care of establising Socket Connection, joining/disconnecting from a room

Card Service - Takes care of Game Play


Socket Events -
------------------------------------------

connection events (server to client)
--------------------------------------
owner indicates actual client/browser
  
connect - event about the owner has connected to the server
disconnect - event about the owner has disconnected from the server
  
room_created - event about creating and joining a room by the owner
room_joined - event about joining an existing room by the owner
  
user_connected - event about any user connecting to server
user_disconnected - event about any user disconnected from the server
  
user_active - listening to event about new user joined any room
user_inactive - listening to event about any user leaving any room
  
user_joined_room - listening to event about new user has joined the same room
user_left_room - listening to event about a user has left the same room
  
capacity_full - listening to event about the owner failed to join a room
  
  
card events (server to client)
---------------------------------
shuffleCard- provides owner 13 cards for the owner - rest 39 cards are face down
standing_call - broadcasts standing call to everyone
show_cards - provides 13 cards for a player to show (when a player shows card)
  
distribute_cards -listening to event when card is distributed 
  
next_player - listening to announcement of next player to play
  
played_card - listening to event when server notifies a particular card is played
unplayed_card - listening to event when a card is unplayed
  
can_shuffle - listening to event when can be shuffled
  
get_updated_points - notifies it is time to input points. also provides updated sets taken after round completed
update_points - broadcasts updates points to all in the room
  
  
client to server
--------------------
join - notifies the server that users wants to join a particular room
shuffleCard -asks the server to shuffle card
playCard - send info to server that user serial 1/2/3/4 has played a particular card
unplayCard - notifies server that the user has unplayed one particular card
callDecided - notifies server about the decided call
roundComplete - notifies server that current round is complete
completeGame - notifies server that the game is complete and gives points update for the game

logical flow
------------------
--- after shuffling and call decided - (type.ts) nextplayer(player, card, clearTable) and standing_call (ex.2-hearts) are fired. We clearTable since nextPlayer has clearTable field true and activate cards for ext player and playable cards
  
-- for 1st, 2nd and 3rd played card in the round - server attaches next playable with played card - from which client plays the card and activates next playable and deactivates others
  
-- for 4th card in the round - server does not attach next playable with played card. Thats how client decideds to show complete_round button. (since next playable is absent - activated card does not deactivated automatically. thats why we have to deacticate it on the client side whenever a card is played. Otherwise that player may play another card and things mess up)
  
-- when the complete_round button is pressed - winner card decided. points get updated. We send next playable info with cleartable (nextplayer(player, card, clearTable)). We send a seperate event to update the points
  
-- all rounds run similar way upto round 13
  
-- on round 13 - when complete_round button is pressed- we send get_updated_points event to user to show points modal. After receiving the event - UI clears the table and user fills up the point for game and submits it.
  
-- upon receiving completeGame event - server updates and clean up the table including points. Then the user broadcasts can_shuffle event to client (when UI receives can_shuffle event - it resets table (clears played cards and gives blank cards to all)) and also activates shuffle card
  
thats how this cycle continues


WebRTC logical flow -client side
----------------------------------  
after joining room - 

   1. sets up peer id - localPeerId = event.peerId
   2. connect site video player with computer -setLocalStream
   3. sends start call msg to server (room_id, peer_id) that gets broadcasted to others

   4. on receiving start_call event - 
        -include them in peerconections with RTCPeerConnection
        -creates an offer to connect - emits webrtc_offer


   5. server forwards it to the newly connected peer

   6. on receiving webrtc_offer client(newly connected) 
        -send IceCandidate information to the sender -webrtc_ice_candidate
        - on receiving the IceCandidate info - the sender sets it up with remote peerId in peerConnections (RTCPeerConnection)
        - Clients also creates an webrtc_answer event - that gets forwarded to the existing peer who offered
        - 

   7. on webrtc_answer - connection establishment is completed


 checkPeerDisconnect - it is a function that is linked with webrtc conection - executes
                    on disconnect