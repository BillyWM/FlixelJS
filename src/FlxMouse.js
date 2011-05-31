//TODO: Implememnt hiding of actual browser cursor.
//	Amazingly, FF, Chrome, Opera all support cursor:none
//	Implement this by setting style.cursor = "none" on the HTML Canvas element for the game
//	IE doesn't support it, of course. Needs a blank .cur cursor
FlxMouse = new Class({

	initialize: function()
	{
		this.x = 0;
		this.y = 0;
		this.screenX = 0;
		this.screenY = 0;
		this._current = 0;
		this._last = 0;
		this.cursor = null;
		this._out = false;
	},

	show: function(Graphic, XOffset, YOffset) {

		XOffset = isNaN(XOffset) ? 0 : XOffset;
		YOffset = isNaN(YOffset) ? 0 : YOffset;

		this._out = true;
		if(Graphic !== undefined)
			this.load(Graphic,XOffset,YOffset);
		else if(this.cursor != null)
			this.cursor.visible = true;
		else
			this.load(null);
	},

	hide: function() {

		if(this.cursor !== null) {
			this.cursor.visible = false;
			this._out = false;
		}
	},

	//FIXME: Needs asset handling. Needs "ImageDefaultCursor" as an asset
	load: function(Graphic, XOffset, YOffset) {
		XOffset = isNaN(XOffset) ? 0 : XOffset;
		YOffset = isNaN(YOffset) ? 0 : YOffset;

		if(Graphic === undefined || Graphic === null)
			Graphic = FlxMouse.ImgDefaultCursor;
		this.cursor = new FlxSprite(this.screenX,this.screenY,Graphic);
		this.cursor.solid = false;
		this.cursor.offset.x = XOffset;
		this.cursor.offset.y = YOffset;
	},

	unload: function()
	{
		if(this.cursor != null)
		{
			if(this.cursor.visible)
				this.load(null);
			else
				this.cursor = null;
		}
	},

	update: function(X, Y, XScroll, YScroll) {
		this.screenX = X;
		this.screenY = Y;
		this.x = screenX-FlxU.floor(XScroll);
		this.y = screenY-FlxU.floor(YScroll);
		if(this.cursor != null)
		{
			this.cursor.x = x;
			this.cursor.y = y;
		}
		if((this._last == -1) && (this._current == -1))
			this._current = 0;
		else if((this._last == 2) && (this._current == 2))
			this._current = 1;
		this._last = this._current;
	},

	reset: function() {
		this._current = 0;
		this._last = 0;
	},

	pressed: function() { return this._current > 0; },
	justPressed:function() { return this._current == 2; },
	justReleased:function() { return this._current == -1; },

	handleMouseDown: function(e) {
		if(this._current > 0) this._current = 1;
		else this._current = 2;
	},

	handleMouseUp: function(e) {
		if(this._current > 0) this._current = -1;
		else this._current = 0;
	},

	handleMouseOut: function(e) {

		if(this.cursor !== null)
		{
			this._out = this.cursor.visible;
			this.cursor.visible = false;
		}
	},

	handleMouseOver: function(e)
	{
		if(this.cursor !== null)
			this.cursor.visible = this._out;
	},

	//NOTE: Flixel expects: UP is positive, DOWN is negative
	//	Reality:
	//		OPERA: Up is -2, down is 2 (event.detail)
	//		FIREFOX: Up is -3, down is 3 (event.detail)
	//		CHOME: Up is +120, down is -120 (event.wheelDelta)
	//Luckily, all 3 can prevent default (no page scrolling)
	//TODO: Ensure that preventing scrolling only applies to in-game window
	//		When the users moves out of the window they should scroll again
	handleMouseWheel: function(e) {

		//NOTE: e is a MooTools event object. Actual event object is on e.event
		//For FF/Opera it's a DOMMouseScroll type event. For Chrome it's a WheelEvent
		
		if (e.event.detail) {
			this.wheel = e.event.detail * -1;
		} else if (e.event.wheelDelta) {
			this.wheel = e.event.wheelDelta / 40;
		}

		e.preventDefault();
	}

});

FlxMouse.ImgDefaultCursor = null;	//FIXME: Just a dummy placeholder
