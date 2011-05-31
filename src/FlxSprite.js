//NOTE: _gfxSprite and _gfx are omitted, because they're only used as a buffer to draw a line
//		We can do this directly with canvas instead, drawing directly to _pixels
//TODO: Fix a couple spots after resource handling added
FlxSprite = new Class({

	Extends: FlxObject,

	initialize: function(X, Y, SimpleGraphic) {
		this.parent(X, Y);
		this.__defineGetter__("pixels", this.getPixels);
		this.__defineSetter__("pixels", this.setPixels);
		this.__defineSetter__("solid", this.setSolid);
		this.__defineSetter__("fixed", this.setFixed);
		this.__defineGetter__("alpha", this.getAlpha);
		this.__defineSetter__("alpha", this.setAlpha);
		this.__defineGetter__("facing", this.getFacing);
		this.__defineSetter__("facing", this.setFacing);
		this.__defineGetter__("color", this.getColor);
		this.__defineSetter__("color", this.setColor);
		this.__defineGetter__("frame", this.getFrame);
		this.__defineSetter__("frame", this.setFrame);
		this.x = X;
		this.y = Y;

		this._flashRect = new Rectangle();
		this._flashRect2 = new Rectangle();
		this._flashPointZero = new Point();
		this.offset = new FlxPoint();
		
		this.scale = new FlxPoint(1,1);
		this._alpha = 1;
		this._color = 0x00ffffff;
		this.blend = null;
		this.antialiasing = false;
		
		this.finished = false;
		this._facing = FlxSprite.RIGHT;
		this._animations = new Array();
		this._flipped = 0;
		this._curAnim = null;
		this._curFrame = 0;
		this._caf = 0;
		this._frameTimer = 0;

		this._mtx = new Matrix();
		this._callback = null;
		//FIXME: We don't use this right now
		if(this._gfxSprite === undefined)
		{
			//this._gfxSprite = new Sprite();
			//this._gfx = this._gfxSprite.graphics;
		}
		
		if(SimpleGraphic === undefined)
			this.createGraphic(8,8);
		else
			this.loadGraphic(SimpleGraphic);

	},

	loadGraphic: function(Graphic, Animated, Reverse, Width, Height, Unique) {

		Animated = (Animated === undefined) ? false : Animated;
		Reverse = (Reverse === undefined) ? false : Reverse;
		Width = isNaN(Width) ? 0 : Width;
		Height = isNaN(Height) ? 0 : Height;
		Unique = (Unique === undefined) ? false : Unique;

		Graphic = Graphic.clone();

		this._bakedRotation = 0;
		this._pixels = FlxG.addBitmap(Graphic,Reverse,Unique); //FIXME random is stopgap for cache
		if(Reverse)
			this._flipped = this._pixels.width>>1;
		else
			this._flipped = 0;
		if(Width == 0)
		{
			if(Animated)
				Width = this._pixels.height;
			else if(this._flipped > 0)
				Width = this._pixels.width*0.5;
			else
				Width = this._pixels.width;
		}
		this.width = this.frameWidth = Width;
		if(Height == 0)
		{
			if(Animated)
				Height = this.width;
			else
				Height = this._pixels.height;
		}
		this.height = this.frameHeight = Height;
		this.resetHelpers();
		return this;
	},

	loadRotatedGraphic: function(Graphic, Rotations, Frame, AntiAliasing, AutoBuffer) {

		Rotations = isNaN(Rotations) ? 16 : Rotations;
		Frame = isNaN(Frame) ? -1 : Frame;
		AntiAliasing = (AntiAliasing === undefined) ? false : AntiAliasing;
		AutoBuffer = (AutoBuffer === undefined) ? false : AutoBuffer;

		//Create the brush and canvas
		var rows = Math.sqrt(Rotations);
		var brush = FlxG.addBitmap(Graphic);
		if(Frame >= 0)
		{
			//Using just a segment of the graphic - find the right bit here
			var full = brush;
			brush = new BitmapData(full.height,full.height);
			var rx = Frame * brush.width;
			var ry = 0;
			var fw = full.width;
			if(rx >= fw)
			{
				ry = Math.floor(rx/fw) * brush.height;
				rx %= fw;
			}
			this._flashRect.x = rx;
			this._flashRect.y = ry;
			this._flashRect.width = brush.width;
			this._flashRect.height = brush.height;
			brush.copyPixels(full,this._flashRect,this._flashPointZero);
		}
		
		var max = brush.width;
		if(brush.height > max)
			max = brush.height;
		if(AutoBuffer)
			max *= 1.5;
		var cols = FlxU.ceil(Rotations/rows);
		this.width = max*cols;
		this.height = max*rows;
		var key = String(Graphic) + ":" + Frame + ":" + width + "x" + height; //FIXME
		var skipGen = FlxG.checkBitmapCache(key);
		this._pixels = FlxG.createBitmap(this.width, this.height, 0, true, key);
		this.width = this.frameWidth = this._pixels.width;
		this.height = this.frameHeight = this._pixels.height;
		this._bakedRotation = 360/Rotations;
		
		//Generate a new sheet if necessary, then fix up the width & height
		if(!skipGen)
		{
			var r = 0;
			var c;
			var ba = 0;
			var bw2 = brush.width*0.5;
			var bh2 = brush.height*0.5;
			var gxc = max*0.5;
			var gyc = max*0.5;
			while(r < rows)
			{
				c = 0;
				while(c < cols)
				{
					this._mtx.identity();
					this._mtx.translate(-bw2,-bh2);
					this._mtx.rotate(ba*0.017453293);
					this._mtx.translate(max * c + gxc, gyc);
					ba += this._bakedRotation;
					this._pixels.draw(brush,this._mtx,null,null,null,AntiAliasing);
					c++;
				}
				gyc += max;
				r++;
			}
		}
		this.frameWidth = this.frameHeight = this.width = this.height = max;
		this.resetHelpers();
		return this;
	},

	createGraphic: function(Width,Height, Color, Unique, Key) {
		Color = isNaN(Color) ? 0xFFFFFFFF : Color;
		Unique = (Unique === undefined) ? false : Unique;
		Key = (Key === undefined) ? null : Key;

		this._bakedRotation = 0;
		this._pixels = FlxG.createBitmap(Width,Height,Color,Unique,Key);
		this.width = this.frameWidth = this._pixels.width;
		this.height = this.frameHeight = this._pixels.height;
		this.resetHelpers();
		return this;
	},

	getPixels: function() {
		return this._pixels;
	},

	setPixels: function(Pixels) {
		this._pixels = Pixels;
		this.width = this.frameWidth = this._pixels.width;
		this.height = this.frameHeight = this._pixels.height;
		this.resetHelpers();
	},

	resetHelpers: function() {

		this._boundsVisible = false;
		this._flashRect.x = 0;
		this._flashRect.y = 0;
		this._flashRect.width = this.frameWidth;
		this._flashRect.height = this.frameHeight;
		this._flashRect2.x = 0;
		this._flashRect2.y = 0;
		this._flashRect2.width = this._pixels.width;
		this._flashRect2.height = this._pixels.height;
		if((this._framePixels == null) || (this._framePixels.width != this.width) || (this._framePixels.height != this.height)) {
			this._framePixels = new BitmapData(this.width,this.height);
		}
		if((this._bbb == null) || (this._bbb.width != this.width) || (this._bbb.height != this.height))
			this._bbb = new BitmapData(this.width,this.height);
		this.origin.x = this.frameWidth*0.5;
		this.origin.y = this.frameHeight*0.5;
		this._framePixels.copyPixels(this._pixels,this._flashRect,this._flashPointZero);
		this.frames = (this._flashRect2.width / this._flashRect.width) * (this._flashRect2.height / this._flashRect.height);
		if(this._ct != null) this._framePixels.colorTransform(this._flashRect,this._ct);
		if(FlxG.showBounds)
			this.drawBounds();
		this._caf = 0;
		this.refreshHulls();
	},

	setSolid: function(Solid) {
		this.parent(Solid);
		var os = this._solid;
		this._solid = Solid;
		if((os != this._solid) && FlxG.showBounds)
			this.calcFrame();
	},

	setFixed: function(Fixed) {
		this.parent(Fixed);
		var of = this._fixed;
		this._fixed = Fixed;
		if((of != this._fixed) && FlxG.showBounds)
			this.calcFrame();
	},

	getFacing: function() {
		return this._facing;
	},
	
	setFacing: function(Direction) {
		var c = this._facing != Direction;
		this._facing = Direction;
		if(c) this.calcFrame();
	},
	
	getAlpha: function() {
		return this._alpha;
	},
	
	setAlpha: function(Alpha) {
		if(Alpha > 1) Alpha = 1;
		if(Alpha < 0) Alpha = 0;
		if(Alpha == this._alpha) return;
		this._alpha = Alpha;
		if((this._alpha != 1) || (this._color != 0x00ffffff))
			this._ct = new ColorTransform((this._color>>16)*0.00392,(this._color>>8&0xff)*0.00392,(this._color&0xff)*0.00392,this._alpha);
		else this._ct = null;
		this.calcFrame();
	},

	getColor: function()
	{
		return this._color;
	},
	
	setColor: function(Color)
	{
		Color &= 0x00ffffff;
		if(this._color == Color) return;
		this._color = Color;
		if((this._alpha != 1) || (this._color != 0x00ffffff))
			this._ct = new ColorTransform((this._color>>16)*0.00392,(this._color>>8&0xff)*0.00392,(this._color&0xff)*0.00392,this._alpha);
		else this._ct = null;
		this.calcFrame();
	},

	draw: function(Brush,X,Y) {
		X = isNaN(X) ? 0 : X;
		Y = isNaN(Y) ? 0 : Y;		

		var b = Brush._framePixels;
		
		//Simple draw
		if(((Brush.angle == 0) || (Brush._bakedRotation > 0)) && (Brush.scale.x == 1) && (Brush.scale.y == 1) && (Brush.blend === null || Brush.blend === undefined))
		{
			this._flashPoint.x = X;
			this._flashPoint.y = Y;
			this._flashRect2.width = b.width;
			this._flashRect2.height = b.height;
			this._pixels.copyPixels(b,this._flashRect2,this._flashPoint,null,null,true);
			this._flashRect2.width = this._pixels.width;
			this._flashRect2.height = this._pixels.height;
			this.calcFrame();
			return;
		}

		//Advanced draw
		this._mtx.identity();
		this._mtx.translate(-Brush.origin.x,-Brush.origin.y);
		this._mtx.scale(Brush.scale.x,Brush.scale.y);
		if(Brush.angle != 0)
			this._mtx.rotate(Brush.angle * 0.017453293);
		this._mtx.translate(X + Brush.origin.x, Y + Brush.origin.y);
		this._pixels.draw(b,this._mtx,null,Brush.blend,null,Brush.antialiasing);
		this.calcFrame();
	},

	//FIXME: Not currently implemented. Depends on Sprite. Either make wrapper or write native alternative
	drawLine: function(StartX,StartY,EndX,EndY,Color,Thickness) {
		Thickness = isNaN(Thickness) ? 1 : Thickness;
	/*
		//Draw line
		_gfx.clear();
		_gfx.moveTo(StartX,StartY);
		_gfx.lineStyle(Thickness,Color);
		_gfx.lineTo(EndX,EndY);
		
		//Cache line to bitmap
		_pixels.draw(_gfxSprite);
		calcFrame();
	*/
	},

	fill: function(Color) {
		this._pixels.fillRect(this._flashRect2,Color);
		if(this._pixels != this._framePixels)
			this.calcFrame();
	},

	updateAnimation: function() {

		if(this._bakedRotation)
		{
			var oc = this._caf;
			var ta = this.angle % 360;
			if(ta < 0)
				ta += 360;
			this._caf = ta/this._bakedRotation;
			if(oc != this._caf)
				this.calcFrame();
			return;
		}
		if((this._curAnim !== undefined && this._curAnim !== null) && (this._curAnim.delay > 0) && (this._curAnim.looped || !this.finished))
		{
			this._frameTimer += FlxG.elapsed;
			while(this._frameTimer > this._curAnim.delay)
			{
				this._frameTimer = this._frameTimer - this._curAnim.delay;
				if(this._curFrame == this._curAnim.frames.length-1)
				{
					if(this._curAnim.looped) this._curFrame = 0;
					this.finished = true;
				}
				else
					this._curFrame++;
				this._caf = this._curAnim.frames[this._curFrame];
				this.calcFrame();
			}
		}
	},

	update: function() {
		this.updateMotion();
		this.updateAnimation();
		this.updateFlickering();
	},

	renderSprite: function() {
		if(FlxG.showBounds != this._boundsVisible)
			this.calcFrame();
		
		this.getScreenXY(this._point);
		this._flashPoint.x = this._point.x;
		this._flashPoint.y = this._point.y;
		
		//Simple render
		this.angle = 0 //FIXME: hack! Ensures simple render TODO: Figure out why angle is NaN
		if(((this.angle == 0) || (this._bakedRotation > 0)) && (this.scale.x == 1) && (this.scale.y == 1) && (this.blend === null || this.blend === undefined))
		{
			FlxG.buffer.copyPixels(this._framePixels,this._flashRect,this._flashPoint,null,null,true);
			return;
		}
		
		//Advanced render
		this._mtx.identity();
		this._mtx.translate(-this.origin.x,-this.origin.y);
		this._mtx.scale(this.scale.x,this.scale.y);
		if(this.angle != 0)
			this._mtx.rotate(this.angle * 0.017453293);
		this._mtx.translate(this._point.x + this.origin.x, this._point.y + this.origin.y);
		FlxG.buffer.draw(this._framePixels,this._mtx,null,this.blend,null,this.antialiasing);
	},

	render: function() {
		this.renderSprite();
	},

	overlapsPoint: function(X, Y, PerPixel) {
		PerPixel = (PerPixel === undefined) ? false : PerPixel;

		X = X + FlxU.floor(FlxG.scroll.x);
		Y = Y + FlxU.floor(FlxG.scroll.y);
		this.getScreenXY(this._point);
		if(PerPixel)
			return this._framePixels.hitTest(new Point(0,0),0xFF,new Point(X-this._point.x,Y-this._point.y));
		else if((X <= this._point.x) || (X >= this._point.x + this.frameWidth) || (Y <= this._point.y) || (Y >= this._point.y + this.frameHeight))
			return false;
		return true;
	},

	//NOTE: virtual function
	onEmit: function() {
	},

	addAnimation: function(Name, Frames, FrameRate, Looped) {
		FrameRate = isNaN(FrameRate) ? 0 : FrameRate;
		Looped = (Looped === undefined) ? true : Looped;

		this._animations.push(new FlxAnim(Name,Frames,FrameRate,Looped));
	},

	addAnimationCallback: function(AnimationCallback) {
		this._callback = AnimationCallback;
	},

	play: function(AnimName,Force) {
		Force = (Force === undefined) ? false : Force;

		if(!Force && (this._curAnim !== null) && (this._curAnim !== undefined) && (AnimName == this._curAnim.name) && (this._curAnim.looped || !this.finished)) return;
		this._curFrame = 0;
		this._caf = 0;
		this._frameTimer = 0;
		var i = 0;
		var al = this._animations.length;
		while(i < al)
		{
			if(this._animations[i].name == AnimName)
			{
				this._curAnim = this._animations[i];
				if(this._curAnim.delay <= 0)
					this.finished = true;
				else
					this.finished = false;
				this._caf = this._curAnim.frames[this._curFrame];
				this.calcFrame();
				return;
			}
			i++;
		}
	},

	randomFrame: function() {
		this._curAnim = null;
		this._caf = Math.floor(FlxU.random()*(this._pixels.width/this.frameWidth));
		this.calcFrame();
	},

	getFrame: function() {
		return this._caf;
	},
	
	setFrame: function(Frame) {
		this._curAnim = null;
		this._caf = Frame;
		this.calcFrame();
	},

	getScreenXY: function(Point) {
		if(Point === undefined) Point = new FlxPoint();
		Point.x = FlxU.floor(this.x + FlxU.roundingError)+FlxU.floor(FlxG.scroll.x * this.scrollFactor.x) - this.offset.x;
		Point.y = FlxU.floor(this.y + FlxU.roundingError)+FlxU.floor(FlxG.scroll.y * this.scrollFactor.y) - this.offset.y;
		return Point;
	},

	calcFrame: function() {

		this._boundsVisible = false;
		var rx = this._caf * this.frameWidth;
		var ry = 0;

		//Handle sprite sheets
		var w = this._flipped ? this._flipped : this._pixels.width;
		if(rx >= w)
		{
			ry = Math.floor(rx/w) * this.frameHeight;
			rx %= w;
		}
		
		//handle reversed sprites
		if(this._flipped && (this._facing == FlxSprite.LEFT))
			rx = (this._flipped<<1) - rx - this.frameWidth;
		
		//Update display bitmap
		this._flashRect.x = rx;
		this._flashRect.y = ry;
		this._framePixels.copyPixels(this._pixels, this._flashRect, this._flashPointZero);
		this._flashRect.x = this._flashRect.y = 0;
		if(this._ct != null) this._framePixels.colorTransform(this._flashRect, this._ct);
		if(FlxG.showBounds)
			this.drawBounds();
		if(this._callback != null) this._callback(this._curAnim.name, this._curFrame, this._caf);
	},

	drawBounds: function()
	{
		this._boundsVisible = true;
		if((this._bbb == null) || (this._bbb.width != this.width) || (this._bbb.height != this.height))
			this._bbb = new BitmapData(this.width,this.height);
		var bbbc = this.getBoundingColor();
		this._bbb.fillRect(this._flashRect,0);
		var ofrw = this._flashRect.width;
		var ofrh = this._flashRect.height;
		this._flashRect.width = Math.floor(this.width);
		this._flashRect.height = Math.floor(this.height);
		this._bbb.fillRect(this._flashRect,bbbc);
		this._flashRect.width = this._flashRect.width - 2;
		this._flashRect.height = this._flashRect.height - 2;
		this._flashRect.x = 1;
		this._flashRect.y = 1;
		this._bbb.fillRect(this._flashRect,0);
		this._flashRect.width = ofrw;
		this._flashRect.height = ofrh;
		this._flashRect.x = this._flashRect.y = 0;
		this._flashPoint.x = Math.floor(this.offset.x);
		this._flashPoint.y = Math.floor(this.offset.y);
		this._framePixels.copyPixels(this._bbb,this._flashRect,this._flashPoint,null,null,true);
	},
	
	unsafeBind: function(Pixels) {
		this._pixels = this._framePixels = Pixels;
	}


});

FlxSprite.LEFT = 0;
FlxSprite.RIGHT = 1;
FlxSprite.UP = 2;
FlxSprite.DOWN = 3;
