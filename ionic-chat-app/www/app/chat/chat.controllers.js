/**
 * Created by imac on 1/11/16.
 */
(function() {

  angular.module('Chat')
    .controller('RoomsCtrl', function ($scope, socket, $rootScope, $state, AppPopups, localStorage, Chat) {
      var vm = this;

      vm.createNewRoom = createNewRoom;
      vm.goToRoom = goToRoom;
      //$rootScope.currentUser = Storage.getStorageItem('current_user');


      //Check if there is a network connection
      if ($rootScope.client_online) {
        //Refresh rooms list
        socket.emit('get_rooms', {username: $scope.currentUser});
      }
      else {
        //Get Rooms from local storage
        $scope.myRooms = localStorage.getObject('myRooms');//this should be used on the rooms paged so it can be continously refreshed
        $rootScope.userRooms = localStorage.getObject('myRooms');//This should be used globally
      }


      socket.on('my_rooms', function (data) {
        $scope.myRooms = data.rooms;//this should be used on the rooms paged so it can be continously refreshed
        $rootScope.userRooms = data.rooms;//This should be used globally

        //Save New List of Rooms in local storage
        localStorage.setObject('myRooms', data.rooms);

        console.log($rootScope.myRooms);
      });


      //Process "Room Created" Event
      socket.on('room_created', function (data) {
        if (data.success) {
          var room_id = data.room._id;

          console.log(data.room);
          //Add this to the existing rooms if there exists

          if (!$rootScope.myRooms) {
            //Create the rooms array if one doesn't already exist
            $rootScope.myRooms = [];
          }


          $rootScope.myRooms.push(data.room);
          console.log($rootScope.myRooms);

          AppPopups.showAlert(data.message);

          //Go to the message list for this room
          goToRoom(data.room);
        }
      });

      //Check for new Messages coming in
      socket.on('new_message', function (data) {



        //Get the Room Id for this and increase its Badge Count by 1 indicating a new message
        if(_.contains($rootScope.newMessagesIds, data.message._id)){
            return ;
        }
        else{
          $rootScope.newRoomMsgs[data.message.chat_group_id] = $rootScope.newRoomMsgs[data.message.chat_group_id] +1;

          console.log($rootScope.newRoomMsgs);

          $rootScope.newMessagesIds.push(data.message._id);
        }


      });

      function createNewRoom(roomname) {

        var roomObj = {
          user_id : $rootScope.currentUser,
          group_name : roomname,
          type : 'group',
          members : [$rootScope.currentUser]
        };

        Chat.createRoom(roomObj);

        /*console.log(roomname);
        socket.emit('create_room', {username: Storage.getStorageItem('current_user'), roomname: roomname});*/

      }//createNewRoom

      function goToRoom(room) {
        $rootScope.currentRoom = room;
        console.log($rootScope.currentRoom.group_name);
        $state.go('app.room');
      }
    })

    .controller('RoomMessagesCtrl', function ($scope, socket, $rootScope, $state, AppPopups, localStorage, $ionicScrollDelegate, $timeout) {

      var vm = this;
      var roomStoredMsgs = localStorage.getObject($rootScope.currentRoom._id);
      vm.addMessage = addMessage;
      vm.messages = [];
      vm.message_time = message_time;

      //Trigger An event that shows that the user has switched room
      socket.emit('switched_room', {new_room: $rootScope.currentRoom._id});

      //Clear New Messages count for this room
      $rootScope.newRoomMsgs[$rootScope.currentRoom._id] = 0;


      //Check if this room was created by the current user
      $scope.roomOwner = ($rootScope.currentUser == $rootScope.currentRoom.user_id);
      //$scope.roomOwner = (Storage.getStorageItem('current_user') == $rootScope.currentRoom.user_id);

      //console.log($scope.roomOwner);

      //Fetch all Messages if online else, fetch from local storage
      if ($rootScope.client_online) {
        //Send Request for All Messages in this Room
        socket.emit('fetch_messages', {room_id: $rootScope.currentRoom._id});
      }
      else {
        //Retrieve Messages from local storage
        vm.messages = localStorage.getObject($rootScope.currentRoom._id);

        //Scroll to bottom to show recent messages : NB: Timeout was used here to fix the compilation lag of the template
        $timeout(function () {
          $ionicScrollDelegate.$getByHandle('mainScroll').scrollBottom(true);
        }, 500);

      }


      //Refresh Room messages when a connection comes in when room is previously offline

      socket.on('connect', function () {
        console.log($rootScope.currentRoom.group_name);
        //Send Request for All Messages in this Room after 10seconds
        $timeout(function () {
          socket.emit('fetch_messages', {room_id: $rootScope.currentRoom._id});

          //Rejoin the client to this room as previous disconnection has removed the client from this room
          socket.emit('switched_room', {new_room: $rootScope.currentRoom._id});

        }, 5000);


      });


      //Get All Room messages from the socket
      socket.on('room_messages', function (data) {
        vm.messages = data.messages;


        //Scroll to bottom to show recent messages
        $ionicScrollDelegate.$getByHandle('mainScroll').scrollBottom(true);

        //Save the top 50 messages in local storage with the key as the current room id

        var top50Msgs = (data.messages.length < 50) ? data.messages : data.messages.slice(-50);
        localStorage.setObject($rootScope.currentRoom._id, top50Msgs);

        //console.log(vm.messages);
      });


      //Listen for New Messages
      socket.on('new_message', function (data) {
        console.log(data);

        //check if its for this room
        if (data.message.chat_group_id == $rootScope.currentRoom._id) {
          //Append it to the message list
          vm.messages.push(data.message);
          //$scope.$apply();

          //Scroll to bottom to show recent messages
          $ionicScrollDelegate.$getByHandle('mainScroll').scrollBottom(true);

          console.log(vm.messages);
        }
        else {

          //Get the Room Id for this and increase its Badge Count by 1 indicating a new message
          if(_.contains($rootScope.newMessagesIds, data.message._id)){
            return ;
          }
          else{
            $rootScope.newRoomMsgs[data.message.chat_group_id] = $rootScope.newRoomMsgs[data.message.chat_group_id] +1;

            console.log($rootScope.newRoomMsgs);
            $rootScope.newMessagesIds.push(data.message._id);
          }
        }

      });

      function addMessage(message) {

        if (message != '' && message != undefined) {
          console.log(message);
          //build message object
          var messageBody = {
            chat_group_id: $rootScope.currentRoom._id,
            user_id: $rootScope.currentUser,
            //user_id : Storage.getStorageItem('current_user'),
            message: message,
            time_stamp: new Date().getTime(),
            duplicate_msg_id: genRandom(16)
          }

          if ($rootScope.client_online) {
            messageBody.sent_status = true;
            socket.emit('message', messageBody);
          }
          else {
            //Add a 'false' sent status, this messages will be looped over and sent when there is a connection
            messageBody.sent_status = false;
          }


          vm.messages.push(messageBody);

          vm.theMessage = "";

          /*console.log("Before Push :");
           console.log(roomStoredMsgs);*/

          //Push to local storage for the current room
          //roomStoredMsgs.push(messageBody);
          if(_.isEmpty(roomStoredMsgs)){
            roomStoredMsgs = [];
          }

          roomStoredMsgs.push(messageBody);



          //Scroll to bottom to show recent messages
          $ionicScrollDelegate.$getByHandle('mainScroll').scrollBottom(true);





          /*console.log("After Push :");
           console.log(roomStoredMsgs);*/


          //Save Back to Local storage
          localStorage.setObject($rootScope.currentRoom._id, roomStoredMsgs);

          //After Storage
          // console.log(JSON.parse(Storage.getStorageItem($rootScope.currentRoom._id)));

        }//end empty message check


      }//addMessage

      //Returns how long ago a message was sent
      function message_time(time_stamp) {
        return moment(time_stamp).fromNow();
      }//message_time
    })

    .controller('ViewMembersCtrl', function ($scope, socket, $rootScope, $state, AppPopups, Storage, AppLoading) {

      var vm = this;


      //Send Request for All Users Not in this Room
      //socket.emit('get_non_members', {room_members : $rootScope.currentRoom.members});
      socket.emit('get_members', {room_id: $rootScope.currentRoom._id});

      //Get the Non Members of the Room from the Socket
      socket.on('room_members', function (data) {
        $scope.members = data.members;
      });


    })


    .controller('AddRoomMemberCtrl', function ($scope, socket, $rootScope, $state, AppPopups, Storage, AppLoading) {

      var vm = this;
      vm.addNewMember = addNewMember;

      //Send Request for All Users Not in this Room
      //socket.emit('get_non_members', {room_members : $rootScope.currentRoom.members});
      socket.emit('get_non_members', {room_id: $rootScope.currentRoom._id});

      //Get the Non Members of the Room from the Socket
      socket.on('non_members', function (data) {
        $scope.non_members = data.non_members;
      });


      //Get confirmation of the added user
      socket.on('member_added', function (data) {
        AppLoading.hideLoading();
        AppPopups.showAlert(data.message);

        //Return to the Chat room
        $state.go('app.room');
      });


      function addNewMember(newMember) {

        AppLoading.showLoading("Adding : " + newMember.username);

        socket.emit('add_member', {room: $rootScope.currentRoom, member: newMember});
      }//addNewMember


    });
})();
