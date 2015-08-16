/**
 * nodeChat v0.1 
 * 
 * @author Fernando Gabrieli
 */

var ChatServer = {
  LISTEN_ADDRESS : '0.0.0.0',
  LISTEN_PORT : 8734,

  serverWs : {},
  
  clients : [],

  start : function() {
    var success = true;
    
    var t = ChatServer;

    try {
      t.serverWs = t.getWebSocket();
    } catch(e) {
      console.log(e);
      success = false;
    }

    if (success) {
      console.log('Server started');
      
      t.serverWs.on('connection', t.onConnection);
      
      ChatMsgHandler.init(this);
    }
    
    return success;
  },
  
  getWebSocket : function() {
    var WebSocketServer = require('ws').Server;

    var wss = new WebSocketServer({
      address : this.LISTEN_ADDRESS,
      port : this.LISTEN_PORT
    });
    
    return wss;
  },

  onConnection : function(cliWs) {
    var t = ChatServer;
    
    console.log('client connected');
    
    var client = t.addClient(cliWs);

    cliWs.on('message', function(msgJson) {
      ChatMsgHandler.process(client, msgJson);
    });

    cliWs.on('close', function() {
      console.log('connection closed for', client.getName(), client);
      
      t.broadcast({
        type : 'chatUnregister',
        data : {
          name : client.getName()
        }
      });
      
      t.removeClient(client);
    });
    
    cliWs.on('error', function(err) {
      console.log('received error', err, 'from client', client.getName(), client, 'removing...');
      t.removeClient(client);
    });
  },

  addClient : function(ws) {
    var client = new ChatClient(ws);

    this.clients.push(client);

    return client;
  },

  removeClient : function(client) {
    var t = ChatServer;

    for (var i = 0; i < t.clients.length; i++) {
      if (client == t.clients[i]) {
        console.log('removing client', t.clients[i].getName());
        t.clients.splice(i, 1);
        break;
      }
    }
  },

  broadcast : function(msg) {
    var t = ChatServer;

    // messages from server always go with seq = 0
    msg.seq = 0;
    
    var msgJson = JSON.stringify(msg);
    for (var i = 0; i < t.clients.length; i++) {
      var cli = t.clients[i];
      var ws = cli.getSocket();
      
      try {
        ws.send(msgJson);
      } catch (e) {
        console.log(e, 'closing connection for', cli.getName());
        t.removeClient(cli);
      }
    }
  },

  send : function(destClient, msg) {
    var ws = destClient.getSocket();
    var msgJson = JSON.stringify(msg);
    ws.send(msgJson);
  }

}

// "Class" for chat clients
function ChatClient(wSocket) {
  var registered = false;

  var name = '';

  var t = this;

  t.setName = function(cliName) {
    name = cliName;
  }

  t.getName = function() {
    return name;
  }

  t.getSocket = function() {
    return wSocket;
  }

  t.register = function() {
    registered = true;
  }

  t.isRegistered = function() {
    return registered;
  }
}

var ChatMsgHandler = {

  server : {},

  /**
   * initialize msg handler
   * 
   * @param Object
   *         web socket server
   */
  init : function(serverWs) {
    var t = ChatMsgHandler;
    t.server = serverWs;
  },

  // static
  process : function(client, msgJson) {
    var t = ChatMsgHandler;

    console.log(msgJson);

    var msg = JSON.parse(msgJson);

    var msgType = msg.type;
    var handler = t[msgType];
    var hasHandler = (typeof handler != 'undefined');
    if (hasHandler) {
      handler(client, msg);

      t.sendAck(client, msg);
    }
  },

  sendAck : function(client, msg) {
    var t = ChatMsgHandler;

    t.server.send(client, {
      type : 'chatAck',
      seq : msg.seq
    });
  },

  chatRegister : function(client, msg) {
    var t = ChatMsgHandler;
    
    console.log('chatRegister', msg);

    client.setName(msg.data.name);
    
    console.log('client', msg.data.name, 'has been registered');

    client.register();
    
    t.server.broadcast({
      type : 'chatRegister',
      data : {
        name : msg.data.name
      }
    });
  },

  chatMessage : function(client, msg) {
    var t = ChatMsgHandler;

    if (client.isRegistered()) {
      t.server.broadcast({
        type : 'chatMessage',
        data : {
          sender : client.getName(),
          text : msg.data.text
        }
      });
    }
  }

  // add more handlers here by declaring functions with the msg type as their name

}

module.exports = ChatServer;
