FlxConsole = new Class({

	initialize: function(X, Y, Zoom) {
		
		this.mtrUpdate = new FlxMonitor(16);
		this.mtrRender = new FlxMonitor(16);
		this.mtrTotal = new FlxMonitor(16);
		
		this._lines = new Array();
	},

	update: function() {
		var total = this.mtrTotal.average();
		$('debugFPS').value = (Math.round(1000 / total));
	},

	toggle: function() {},

	log: function() {},

	show: function() {},
	hide: function() {},

});
