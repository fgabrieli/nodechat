/**
 * nodeChat v0.1
 * 
 * @author Fernando Gabrieli
 */

var ChatController = {
  client : {},
  
  CONNECT_MAX_RETRIES : 3,
  CONNECT_RETRY_INTERVAL : 3 * 1000, // 3 seconds

  ngController : function($scope) {
    var t = ChatController;

    $scope.msgs = [];

    $scope.isRegistered = false;
    
    $scope.names = [];

    $scope.skins = [{ 
        id : 0,
        name : 'default'
      },
      {
        id: 1 ,
        name:'hacker'
      }];
    
    nc.Event.bind(ncCfg.Event.msgReceived, 'ChatController', function(msg) {
      pushMsg({
        type : 'message',
        data : {
          sender : msg.sender,
          text : msg.text
        }
      });
    });

    nc.Event.bind(ncCfg.Event.userJoined, 'ChatController', function(msg) {
      var isMe = (msg.name == $scope.name);
      if (!isMe) {
        pushMsg({
          type : 'userJoined',
          data : {
            name : msg.name
          }
        });

        addName(msg.name);
      } else {
        $scope.isRegistered = true;
        $scope.isLoading = false;
        $scope.$apply();
        
        getChatNames();
      }
    });
    
    function addName(name) {
      $scope.names.push(name);
      $scope.$apply();
    }

    function removeName(name) {
      for (var i = 0; i < $scope.names.length; i++) {
        var isName = ($scope.names[i] == name);
        if (isName) {
          $scope.names.splice(i, 1);
          $scope.$apply();
          break;
        }
      }
    }
    
    function getChatNames() {
      t.client.getNames();
    }

    nc.Event.bind(ncCfg.Event.gotNames, 'ChatController', function(names) {
      $scope.names = names;
      $scope.$apply();
    });

    nc.Event.bind(ncCfg.Event.userLeft, 'ChatController', function(msg) {
      pushMsg({
        type : 'userLeft',
        data : {
          name : msg.name
        }
      });
      
      removeName(msg.name);
    });
    
    function pushMsg(msg) {
      $scope.msgs.push(msg);
      $scope.$apply();

      var msgHeight = $('.message:first').height();
      var msgNum = $('.message').size();
      var scrollTo = (msgNum * msgHeight)
      
      $('.chat').scrollTop(scrollTo);
    }

    $(window).on('beforeunload', function() {
      t.client.end();
    });

    $scope.sendMsg = function() {
      t.client.say($scope.msg);
      $scope.msg = '';
    };

    $scope.onKeyUp = function(e) {
      var KEY_ENTER = 13;

      if (e.keyCode == KEY_ENTER) {
        $scope.sendMsg();
      }
    };

    $scope.register = function() {
      $scope.connectRetries = 1;

      $scope.isSrvUnreachable = false;
      
      connect();
    }
    
    function connect() {
      var t = ChatController;
      
      $scope.isConnecting = true;

      var clientOpts = {
        onConnect : function() {
          t.client.register($scope.name);
          
          $scope.connectRetries = 0;

          $scope.isConnecting = false;
          
          $scope.$apply();
        },
        onError : function() {
          var hasRetries = ($scope.connectRetries < t.CONNECT_MAX_RETRIES);
          if (hasRetries) {
            $scope.connectRetries ++;
            $scope.$apply();
            
            setTimeout(function() {
              console.log("Couldn't connect to server, retrying...");
              
              connect();
            }, t.CONNECT_RETRY_INTERVAL);
          } else {
            console.log('giving up connection, server is down or unreachable');

            $scope.isConnecting = false;
            $scope.isSrvUnreachable = true;
            $scope.$apply();
          }
        },
        onClose : function() {
          if ($scope.isRegistered) {
            console.log('called onclose');
            
            $scope.isRegistered = false;
            $scope.connectRetries = 0;
            $scope.isSrvUnreachable = false;

            connect();
          }
        }
      }
      
      t.client = ChatClientFactory.create(clientOpts);
    }

    $scope.isMessage = function(msg) {
      return (msg.type == 'message');
    }

    $scope.isUserJoin = function(msg) {
      return (msg.type == 'userJoined');
    }

    $scope.isUserLeft = function(msg) {
      return (msg.type == 'userLeft');
    }

    $scope.isMyMsg = function(msg) {
      return (msg.data.sender == $scope.name);
    }

    $scope.changeSkin = function(newSkin) {
      var $skin = $("#skin-stylesheet");
      var hasSkin = ($skin.size() == 1);
      if(hasSkin) {
        $skin.remove();
      }

      var isDefault = (newSkin.id == 0);
      if(!isDefault){
        var cssPath = 'css/skins/';
        var fileName = newSkin.name + '.css';
        var $head = $('head');
        var $link = $('<link>');
        $link.attr('id', 'skin-stylesheet');
        $link.attr('href', cssPath + fileName);
        $link.attr('rel','stylesheet');
        $link.attr('type','text/css');
        $head.append($link);
      }
    }
  }
}

webApp.controller('ChatController', ChatController.ngController);