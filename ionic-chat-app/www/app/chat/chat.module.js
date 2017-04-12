/**
 * Created by imac on 1/11/16.
 */

(function(){

  angular.module('Chat', ['btford.socket-io'])
    .config(function($stateProvider){
      $stateProvider
        .state('app.createroom', {
          url: '/createroom',
          cache:false,
          views: {
            'menuContent': {
              templateUrl: 'templates/chat/createroom.html'
            }
          }
        })
        .state('app.room', {
          url: '/room',
          cache:false,
          views: {
            'menuContent': {
              templateUrl: 'templates/chat/room.html'
            }
          }
        })
        .state('app.addmember', {
          url: '/addmember',
          cache:false,
          views: {
            'menuContent': {
              templateUrl: 'templates/chat/addmember.html'
            }
          }
        })
        .state('app.viewmembers', {
          url: '/viewmembers',
          cache:false,
          views: {
            'menuContent': {
              templateUrl: 'templates/chat/viewmembers.html'
            }
          }
        });
    })

})();
