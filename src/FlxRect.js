FlxRect = new Class({

	Extends: FlxPoint,

	initialize: function(X, Y, Width, Height) {
		this.parent(X, Y);
		this.width = Width;
		this.height = Height;
	    this.__defineGetter__("left", this.getLeft);
	    this.__defineGetter__("right", this.getRight);
	    this.__defineGetter__("top", this.getTop);
	    this.__defineGetter__("bottom", this.getBottom);
	},

	getLeft: function() { return this.x; },
	getRight: function() { return this.x + this.width; },
	getTop: function() { return this.y; },
	getBottom: function() { return this.y + this.height; }

});
