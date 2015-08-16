/**
 * nc lib
 * 
 * Handle events.
 * 
 * @author Fernando Gabrieli
 */

nc.Event = {
  events : {},
  /**
   * Bind to a new/existing event.
   * 
   * @param {String}
   *          event name (can be a new event or an existing one)
   * @param {String}
   *          id which identifies this binding
   * @param {Function}
   *          callback
   */
  bind : function(eventName, id, callback) {
    if (typeof this.events[eventName] == 'undefined') {
      this.events[eventName] = [];
    }

    this.events[eventName].push({
      'id' : id,
      'fn' : callback
    });
  },
  /**
   * TODO: missing unbind method.
   * 
   * @param {String} event id.
   */
  unbind : function(id) {
    // TODO
  },
  /**
   * Fire an event.
   * 
   * @param {String}
   *          event name
   * @param {Object}
   *          data to pass to the callback
   */
  fire : function(eventName, data) {
    var callbacks = this.events[eventName];
    var hasBindings = (typeof callbacks != 'undefined');
    if (hasBindings) {
      for ( var i = 0; i < callbacks.length; i++) {
        callbacks[i].fn(data);
      }
    }
  }
};