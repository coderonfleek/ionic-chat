/**
 * Created by imac on 1/11/16.
 */

$rootScope.client_online = false;

socket.on('connect', function () {
  $rootScope.client_online = true;

  //Use the room keys in from rooms in local storage to search their messages in local storage
  //and send any message with a sent_status of false
  var myRooms = localStorage.getObject('myRooms');

  var roomIds = _.pluck(myRooms, '_id');

  //console.log(roomIds);

  //Get the Messages and send them
  roomIds.forEach(function (roomId) {

    var offline_messages = localStorage.getObject(roomId);

    var unsent_msgs = _.where(offline_messages, {sent_status: false});

    //Loop the unsent messages and send them
    unsent_msgs.forEach(function (msg) {
      msg.sent_status = true;
      socket.emit('message', msg);

      console.log(msg);

      console.log('Sent Message : ' + msg.message);

    });

    //Update the local storage of this chat by calling for its messages
    socket.emit('fetch_new_messages', {room_id: roomId});

  });

  //Listen for Received Messages and update local storage for each room
  socket.on('new_room_messages', function (data) {

    //Save the top 50 messages in local storage with the key as the current room id

    var top50Msgs = (data.messages.length < 50) ? data.messages : data.messages.slice(-50);
    localStorage.setObject(data.room_id, top50Msgs);

  });


  //Emit an event sending the highest timestamp for the messages in each room in local storage and
  //get the new messages count from that room
});

//Get All Users From Server (Not needed in module)
socket.on('client_connected', function (data) {
  console.log(data);
  //$scope.client_status = data.message;
  $rootScope.allusers = data.users;

});

//Listen to new messages globally to increase badge count, TODO:Complete listening for new messages and increasing badge count for each room
socket.on('new_message', function (data) {
  console.log(data);

  var roomId = data.message.chat_group_id;

});

socket.on('disconnect', function () {
  $rootScope.client_online = false;
  $scope.last_seen = new Date();//TODO: Emit this to other users

  console.log($scope.last_seen);

});
