var ChatEvent = {
  init : function() {
    this.db = require('./ChatDb');
  },

  add : function(chatEvent) {
    var t = ChatEvent;

    console.log(chatEvent);

    var evt = t.db.EventModel();
    evt.type = chatEvent.type;
    evt.data = chatEvent.data;
    evt.save();

//    t.db.EventModel.find(function(err, docs) {
//      console.log(docs);
//    });
  }

}

ChatEvent.init();

module.exports = ChatEvent;