/**
 * nodeChat v0.1
 * 
 * @author Fernando Gabrieli
 */

var ChatController = {
  client : {},
  
  CONNECT_MAX_RETRIES : 3,
  CONNECT_RETRY_INTERVAL : 3 * 1000, // 3 seconds

  ngController : function($scope, $sce) {
    var t = ChatController;
    
    $scope.isEmoticonPanelDisplayed = false;

    $scope.msgs = [];
    //set vars for msg history
    $scope.msgHistory = [];
    $scope.lastPositionHistory;
    $scope.MAX_INPUT_HISTORY = 20;

    
    $scope.emoticonList = [
                           {name: "smile", code: ":)"},
                           {name: "sad", code: ":("},
                           {name: "like", code: "(y)"},
                           {name: "angel", code: "0:-)"},
                           {name: "nyam", code: ":3"},
                           {name: "wtf", code: "o.O"},
                           {name: "cry", code: ":'("},
                           {name: "devil", code: "3>)"},
                           {name: "surprised", code: ":o"},
                           {name: "nerd", code: "8-)"},
                           {name: "happy", code: ":D"},
                           {name: "pain", code: ">:( "},
                           {name: "heart", code: "<3"},
                           {name: "kiss", code: ":*"},
                           {name: "aww", code: "^_^"},
                           {name: "juaz", code: ":v"},
                           {name: "nestor", code: "<*)"},
                           {name: "poop", code: ":poop:"},
                           {name: "shark", code: ":shark:"},
                           {name: "seriously", code: "-_-"},
                           {name: "fashion", code: "B|"},
                           {name: "hehe", code: ":p"},
                           {name: "mmm", code: ":C"},
                           {name: "lol", code: ">:o "},
                           {name: "wink", code: ";)"},
                           {name: "robot", code: ":robot:"},
                           {name: "aguantaa", code: ":aguantaa:", thumbnail: "aguantaa-thumbnail"},
                           {name: "aguantaa-text", code: ":aguanta2:", thumbnail: "aguantaa-text-thumbnail"}
                          ];
    
    $scope.emoticonName = '';

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
      // We got to search for emoticons
      if(msg.data.text) {
    	  msg.data.text = $scope.parseMsgForEmoticons(msg.data.text);    	
    	  msg.data.text = $scope.verifyYouTubeVideo(msg.data.text);
      }
      
      $scope.msgs.push(msg);
      $scope.$apply();

      var msgHeight = $('.message:first').height();
      var msgNum = $('.message').size();
      var scrollTo = (msgNum * msgHeight)
      
      $('.chat').scrollTop(scrollTo);
    }

    function saveMsgInHistory(msg){
      $scope.msgHistory.push(msg);
      var historyLength = $scope.msgHistory.length;
      if(historyLength > $scope.MAX_INPUT_HISTORY){
        $scope.msgHistory.splice(0,1);
      }
      console.log($scope.msgHistory);
    }

    $(window).on('beforeunload', function() {
      t.client.end();
    });

    $scope.sendMsg = function() {
      t.client.say($scope.msg);
      saveMsgInHistory($scope.msg);
      $scope.msg = '';
      $scope.lastPositionHistory = $scope.msgHistory.length;
    };

    $scope.parseMsgForEmoticons = function(text) {
    	
    	for(var i = 0; i < $scope.emoticonList.length; i++) {
    		var iconElem = wrapper = $('<div>');
    		var emoticon = $scope.emoticonList[i];
    		var type = emoticon.name;
    		iconElem.addClass('emoticon chat-emoticon ' + type);
    		var iconHtml = ($('<div>').append(iconElem)).html();
    		
    		wrapper.attr('data-ng-bind-html', iconHtml);    		
			var index = text.indexOf($scope.emoticonList[i].code);				

    		while(index != -1) {
    			var emoticonLength = index + emoticon.code.length;
    			var wrapperText = ($('<div>').append(wrapper)).html()
    			text = text.substring(0, index) + wrapperText + text.substring(emoticonLength, text.length);    		
    			index = text.indexOf($scope.emoticonList[i].code);
    		}
    	}
    	
    	return text;
    }
    
    $scope.verifyYouTubeVideo = function(text) {
    	var urlRegex = new RegExp(/youtube\.com(.+)v=([^&]+)/);
    	var codeRegex = new RegExp(/=([a-zA-Z\-0-9]+)/gi);
    	
    	if(text.match(urlRegex)) {
    		var videoElem = $('<video>');
    		var videoURL = text.match(urlRegex);
    		var videoCode = videoURL[2];

    		videoElem.attr('height', 150);
    		videoElem.attr('width', 200);    		
    		
    		var embedURL = '//www.youtube.com/embed/' + videoCode;
    		videoElem.attr('src', embedURL);
    		
    		videoElem = ($('<video>').append(videoElem)).html();
    		text = $sce.trustAsHtml('<iframe width="300" height="150" src="'+ embedURL + '" frameborder="0" allowfullscreen></iframe>');
    	}
    	return text;
    }
    
    $scope.toggleSmileDialog = function() {
    	$scope.isEmoticonPanelDisplayed = !$scope.isEmoticonPanelDisplayed;
    };
    
    $scope.insertEmoticon = function(emoticon) {
    	if(typeof $scope.msg == "undefined") {
    		$scope.msg = '';
    	}
    	$scope.msg += ' ' + emoticon.code;
    	$scope.toggleSmileDialog();
    }
    
    $scope.showEmoticonName = function(name) {
    	$scope.emoticonName = name;
    }

    $scope.onKeyUp = function(e) {
      var KEY_ENTER = 13;

      if (e.keyCode == KEY_ENTER) {
        $scope.sendMsg();
      }
    };

    $scope.onKeyDown = function(e) {
      //Navigate history
      var KEY_UP = 38;
      var KEY_DOWN = 40;
      var historyLength = $scope.msgHistory.length
      if (e.keyCode == KEY_UP || e.keyCode == KEY_DOWN) {
        e.preventDefault();
        var sum;
        var isUp = (e.keyCode == KEY_UP);
        console.log(isUp);
        if(isUp){
          sum = -1;
        } else {
          sum = 1;
        }

        $scope.lastPositionHistory = $scope.lastPositionHistory + sum;  
        //set limits
        if($scope.lastPositionHistory < 0){
          $scope.lastPositionHistory = 0;
        }
        if($scope.lastPositionHistory > historyLength)
        {
          $scope.lastPositionHistory = historyLength;
        }

        console.log($scope.lastPositionHistory);

        $scope.msg = $scope.msgHistory[$scope.lastPositionHistory];
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

webApp.controller('ChatController', ['$scope', '$sce', ChatController.ngController]);
