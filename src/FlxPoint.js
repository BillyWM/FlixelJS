FlxPoint = new Class({

	initialize: function(X, Y) {
		X = isNaN(X) ? 0 : X;
		Y = isNaN(Y) ? 0 : Y;

		this.x = X;
		this.y = Y;
	}

});
