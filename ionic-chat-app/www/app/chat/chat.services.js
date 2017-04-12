/**
 * Created by imac on 1/11/16.
 */

(function(){

  angular.module('Chat')
    .factory('socket', function(socketFactory){
      
      var myIoSocket = io.connect("http://localhost:1227");
      
      var socket = socketFactory({
        ioSocket: myIoSocket
      });

      return socket;
    })
    .factory('AppPopups', function($ionicPopup) {
      return {
        showAlert: showAlert,
        confirmDialog : confirmDialog
      };

      function showAlert(title, message) {
        $ionicPopup.alert({
          title: title,
          template: message
        });
      }//showAlert

      function confirmDialog(title, message, yesCallback, noCallback) {
        var confirmPopup = $ionicPopup.confirm({
          title: title,
          template: message
        });

        confirmPopup.then(function(res) {
          if(res) {
            yesCallback(res);
          } else {
            noCallback();
          }
        });
      }//confirmDialog
    })
    .factory('Storage', function ($window){
      var storage = $window.localStorage;


      return {

        setStorageItem: setCacheItem,
        getStorageItem: getCacheItem,
        removeStorageItem : removeCacheItem,
        genRandom : genRandom
      };

      function setCacheItem(ItemName, ItemValue) {
        storage.setItem(ItemName, ItemValue);
      }

      function getCacheItem(ItemName) {
        return storage.getItem(ItemName);
      }

      function removeCacheItem(ItemName){
        storage.removeItem(ItemName);
      }

      function genRandom(length) {
        var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
        return result;
      }
    })
    .factory('AppLoading', function ($ionicLoading) {

      return {
        showLoading: showLoading,
        hideLoading: hideLoading
      };

      function showLoading(template) {
        $ionicLoading.show({
          template: template
        });
      }//showLoading

      function hideLoading() {
        $ionicLoading.hide();
      }//hideLoading

    })
    .factory('localStorage', ['$window', function ($window) {
      return {
        set: function (key, value) {
          $window.localStorage[key] = value;
        },
        get: function (key, defaultValue) {
          return $window.localStorage[key] || defaultValue;
        },
        setObject: function (key, value) {
          $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function (key) {
          return JSON.parse($window.localStorage[key] || '{}');
        }
      }
    }])
    .factory('Chat', ['socket', Chat]);


  function Chat(socket){

    return {
      createRoom : createRoom
    };


    //Creates a Room and sets its default members
    function createRoom(roomObj){
      /*
      roomObj values:-
      * @user_id : User ID or username of the room creator
      * @group_name : Name of the Group
      * @type : Session or Group
      * @members : An array of Member Ids or username (initial members) depending on the standard chosen
      * */

      console.log(roomObj);
      socket.emit('create_room', roomObj);
    }//createRoom


  }//Chat
})();
