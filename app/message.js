define([
  // Application.
  "core/app"
],

// Map dependencies from above array.
function(app) {

  // Create a new module.
  var Message = app.module();

  // Default model.
  Message.Model = Backbone.Model.extend({
  	emit : function() {
      app.socket.emit(this.get("type"), this.toJSON());
  	}
  });

  // Default collection.
  Message.Collection = Backbone.Collection.extend({  
    model: Message.Model
  });
 

  // Return the module for AMD compliance.
  return Message;

});