FlxInput = new Class({

	initialize: function() {
		this._t = 256;	//Constant. Size of map that holds keys
		this._lookup = new Object();
		this._map = new Array(this._t);
	},

	update: function() {
		var i = 0;
		while(i < this._t)
		{
			var o = this._map[i++];
			if(o === undefined) continue;
			if((o.last == -1) && (o.current == -1)) o.current = 0;
			else if((o.last == 2) && (o.current == 2)) o.current = 1;
			o.last = o.current;
		}
	},

	reset: function()
	{
		var i = 0;
		while(i < this._t)
		{
			var o = this._map[i++];
			if(o === undefined) continue;
			this[o.name] = false;
			o.current = 0;
			o.last = 0;
		}
	},

	pressed: function(Key) { return this[Key]; },
	justPressed: function(Key) { return this._map[this._lookup[Key]].current == 2; },
	justReleased: function(Key) { return this._map[this._lookup[Key]].current == -1; },

	handleKeyDown: function(event) {
		var o = this._map[event.code];
		if(o === undefined) return;
		if(o.current > 0) o.current = 1;
		else o.current = 2;
		this[o.name] = true;
	},

	handleKeyUp: function(event)
	{
		var o = this._map[event.code];
		if(o === undefined) return;
		if(o.current > 0) o.current = -1;
		else o.current = 0;
		this[o.name] = false;
	},

	addKey: function(KeyName, KeyCode)
	{
		this._lookup[KeyName] = KeyCode;
		this._map[KeyCode] = { name: KeyName, current: 0, last: 0 };
	}

});
