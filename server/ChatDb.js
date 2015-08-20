
var mongoose = require('mongoose');

var ChatDb = {
  DB_HOST : 'localhost',
  DB_NAME : 'nodechat',
  
  init : function() {
    
    mongoose.connect(this.DB_HOST, this.DB_NAME);

    // Schemas

    var Schema = mongoose.Schema;

    var MessageSchema = new Schema({
      name : {
        type : String
      },
      message : {
        type : String
      },
      date : {
        type : Date,
        default : Date.now
      }
    });

    var EventSchema = new Schema({
      type : {
        type : String
      },
      data : {
        type : Object
      },
      date : {
        type : Date,
        default : Date.now
      }
    });

    // Models

    this.MessageModel = mongoose.model('MessageModel', MessageSchema);

    this.EventModel = mongoose.model('EventModel', EventSchema);
  },
  
//  addMessage : function(chatMsg) {
//    var msg = new ChatDb.MessageModel(chatMsg);
//    msg.name = chatMsg.name;
//    msg.message = chatMsg.data.text;
//  },
  
}

ChatDb.init();

module.exports = ChatDb;