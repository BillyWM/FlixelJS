FlxMonitor = new Class({

	initialize: function(Size, Default) {
		Default = isNaN(Default) ? 0 : Default;

		this._size = Size;
		if(this._size <= 0)
			this._size = 1;
		this._itr = 0;
		this._data = new Array(this._size);
		var i = 0;
		while(i < this._size)
			this._data[i++] = Default;
	},

	add: function(Data)
	{
		this._data[this._itr++] = Data;
		if(this._itr >= this._size)
			this._itr = 0;
	},

	average: function()
	{
		var sum = 0;
		var i = 0;
		while(i < this._size)
			sum += this._data[i++];
		return sum/this._size;
	}

});
