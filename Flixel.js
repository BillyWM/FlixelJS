/*
	References:
		http://ejohn.org/blog/javascript-getters-and-setters/
		http://dev.enekoalonso.com/2009/07/20/setters-getters-on-mootools-classes/
			Keyboard input:
		http://msdn.microsoft.com/en-us/scriptjunkie/ff928319.aspx
			Potential IE9 compatibility:
		http://blogs.msdn.com/b/ie/archive/2010/09/07/transitioning-existing-code-to-the-es5-getter-setter-apis.aspx
			

	NOTES:

		For compatibility with MooTools,
			getters and setters must use __defineGetter__ and __defineSetter__ rather
			than the get and set keywords.
		Always declare Javascript strings with an initial value if the first operation
			you're going to do to them is something besides assignment
*/

//Compatibility function that gives IE9 some hope of working
//FROM: http://blogs.msdn.com/b/ie/archive/2010/09/07/transitioning-existing-code-to-the-es5-getter-setter-apis.aspx
//emulate legacy getter/setter API using ES5 APIs
String.prototype.pad = function(len, chr, side) {
	chr = (chr === undefined) ? " " : chr;

	var t = len - this.length;
	var padstr = "";
	while (t > 0) {
		padstr += chr;
		t--;
	}
	switch (side) {
		case 'left': return padstr + this; break;
		case 'right': return this + padstr; break;
	}
}

try {
   if (!Object.prototype.__defineGetter__ &&
        Object.defineProperty({},"x",{get: function(){return true}}).x) {
      Object.defineProperty(Object.prototype, "__defineGetter__",
         {enumerable: false, configurable: true,
          value: function(name,func)
             {Object.defineProperty(this,name,
                 {get:func,enumerable: true,configurable: true});
      }});
      Object.defineProperty(Object.prototype, "__defineSetter__",
         {enumerable: false, configurable: true,
          value: function(name,func)
             {Object.defineProperty(this,name,
                 {set:func,enumerable: true,configurable: true});
      }});
   }
} catch(defPropException) {/*Do nothing if an exception occurs*/};

//NOTE: Opera doesn't support createImageData (but we might not need it after all)
if (!CanvasRenderingContext2D.prototype.createImageData) {

	CanvasRenderingContext2D.prototype.createImageData = function(sw, sh) {

		var c = document.createElement('canvas');
		c.width = sw; c.height = sh;
		data = c.getContext('2d').getImageData(0, 0, sw, sh);
		c = null;
		return data;
	}
}

//imitates the flash.x.y package hierarchy where needed
flash = {};

//flash.utils package
flash.utils = new Class({

	initialize: function() {
		var d = new Date();
		this.startTimer = d.getTime();
	},

	getTimer: function() {
		var d = new Date();
		return (d.getTime() - this.startTimer);
	}

});

flash.utils = new flash.utils();

//Each asset is an instance of the Asset class. Global "assets" variable holds reference to
//	all of them. Instead of passing a classname to certain Flixel methods, you pass
//	and asset object - asset.example - and its properties are at
//		asset.example.name, asset.example.src, etc
/*

	Audio: audio/mpeg (mp3), audio/webm, audio/ogg, application/ogg
	Video: video/webm, video/ogg
	images: image/jpeg, image/gif, image/png, image/bmp

*/
Asset = new Class({
	initialize: function(assetName, assetSrc, assetType, mime) {
		this.name = assetName;
		this.src = assetSrc;
		this.type = assetType;
		this.mime = mime;
	}
});

Assets = new Class({

	initialize:  function() {
		this.mimeList = {};
		this.images = {};
		this.sounds = {};

		this.assetList = new Array();
		this.assetCount = 0;
		this.loadCount = 0;

		//public callbacks
		this.onAssetLoaded = null;
		this.onAllLoaded = null;
	},

	//Valid types: audio, image, csv, text
	//mime is optional and reserved for future use
	add: function(name, src, type, mime) {
		this.assetList.push(new Asset(name, src, type, mime));
	},

	loadAll: function() {
		for (var i in this.assetList) {
			var item = this.assetList[i];

			if (item instanceof Asset) {
				switch(item.type) {
					case 'image':
						item.image = new Image();
						item.image.relatedItem = item;
						item.image.index = i;
						item.image.onload = this.imageLoaded;
						item.image.src = item.src;
					break;

					case 'audio':
					break;
				}
			}
		}
	},

	imageLoaded: function(e) {
		var i = this.index;
		var item = this.relatedItem;

		Assets.images[item.name] = BitmapData.fromImage(item.image);
		Assets.loadCount++;
	},


});

Assets = new Assets;

Point = new Class({

	initialize: function(X, Y) {
		X = isNaN(X) ? 0 : X;
		Y = isNaN(Y) ? 0 : Y;

		this.x = X;
		this.y = Y;
	}

});

Rectangle = new Class({

	Extends: Point,

	initialize: function(X, Y, Width, Height) {
		Width = isNaN(Width) ? 0 : Width;
		Height = isNaN(Height) ? 0 : Height;

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

//Not a full implementation of the Matrix class. Exists to pass a matrix to bitmapData.draw
//	which passes the properties onto Canvas in its setTransform method:
//		setTransform(m11, m12, m21, m22, dx, dy)
//Not implemented: invert, transformPoint, deltaTransformPoint, createGradientBox
//NOTE: identity, rotate, scale, translate, concat return void in Flash.
//		Here they return this, for optional chaining
Matrix = new Class({

	initialize: function(a, b, c, d, tx, ty) {
		this.a = isNaN(a) ? 1 : a;
		this.b = isNaN(b) ? 0 : b;
		this.c = isNaN(c) ? 0 : c;
		this.d = isNaN(d) ? 1 : d;
		this.tx = isNaN(tx) ? 0 : tx;
		this.ty = isNaN(ty) ? 0 : ty;
		this.u = 0;
		this.v = 0;
		this.w = 1;

	},

	identity: function() {
		this.a = 1;
		this.b = 0;
		this.c = 0;
		this.d = 1;
		this.tx = 0;
		this.ty = 0;
		this.u = 0;
		this.v = 0;
		this.w = 1;

		return this;
	},

	rotate: function(angle) {
		var cos = Math.cos(angle);
		var sin = Math.sin(angle);
		var mrotate = new Matrix(cos, sin, -sin, cos, 0, 0);
		this.concat(mrotate);

		return this;
	},

	scale: function(sx, sy) {
		var mscale = new Matrix(sx, 0, 0, sy, 0, 0);
		this.concat(mscale);

		return this;
	},

	translate: function(dx, dy) {
		var mtrans = new Matrix(1, 0, 0, 1, dx, dy);
		this.concat(mtrans);

		return this;
	},

	clone: function() {
		return new Matrix(this.a, this.b, this.c, this.d, this.tx, this.ty);
	},

	//"Concatenates a matrix with the current matrix, effectively combining the
	//		geometric effects of the two.
	//In mathematical terms, concatenating two matrixes is the same as combining them
	//		using matrix multiplication."
	concat: function(m2) {
		//"This method replaces the source matrix with the concatenated matrix."
		var mcon = this.multiply(m2);
		this.a = mcon.a;
		this.b = mcon.b;
		this.c = mcon.c;
		this.d = mcon.d;
		this.tx = mcon.tx;
		this.ty = mcon.ty;

		return this;
	},

	//"Using the createBox() method lets you obtain the same matrix as you would if you
	//		applied the identity(), rotate(), scale(), and translate() methods in succession."
	createBox: function(scaleX, scaleY, rotation, tx, ty) {
		rotation = isNaN(rotation) ? 0 : rotation;
		tx = isNaN(tx) ? 0 : tx;
		ty = isNaN(ty) ? 0 : ty;

		this.identity();
		if (rotation != 0) {
			this.rotate(rotation); 
		}
		this.scale(scaleX, scaleY);
		if (tx != 0 || ty != 0) {
			this.translate(tx, ty);
		}
	},

	//Not a flash method. Helper for performing other transforms
	//m2: The matrix to multiply this one with
	//		[this.a	this.c	this.tx]	[m2.a	m2.c	m2.tx]
	//		[this.b	this.d	this.ty]	[m2.b	m2.d	m2.ty]
	//		[this.u	this.v	 this.w]	[m2.u	m2.v	 m2.w]
	multiply: function(m2) {
		var mfinal = new Matrix();

		//first row
		mfinal.a = (this.a * m2.a) + (this.c * m2.b) + 0;
		mfinal.c = (this.a * m2.c) + (this.c * m2.d) + 0;
		mfinal.tx = (this.a * m2.tx) + (this.c * m2.ty) + this.tx;

		//second row
		mfinal.b = (this.b * m2.a) + (this.d * m2.b) + 0;
		mfinal.d = (this.b * m2.c) + (this.d * m2.d) + 0;
		mfinal.ty = (this.b * m2.tx) + (this.d * m2.ty) + this.ty;

		return mfinal;
	},

});

// example as3 output: (a=0.1220703125, b=0, c=0, d=0.1220703125, tx=150, ty=150)
//NOTE: goes here to override MooTools' own toString
Matrix.prototype.toString = function() {
	return "(a=" + this.a + ", b=" + this.b + ", c=" + this.c +
			", d=" + this.d + ", tx=" + this.tx + ", ty=" + this.ty + ")";
};

//TODO: hitTest (needed by FlxSprite.overlapsPoint)
BitmapData = new Class({

		//NOTE: FillColor is ARGB like Flash, but canvas uses RGBA

	initialize: function(Width, Height, Transparent, FillColor) {
		Transparent = (Transparent === undefined) ? true : Transparent;
		FillColor = (FillColor === undefined) ? 0xFFFFFFFF : FillColor;

		//pre-process FillColor to ensure correct behavior
		//FIXME: For now we set the fill to fully transparent if Transparent is true
		/*FillColor = FillColor.toString(16).pad(8, 0, "left");
		if (Transparent) {
			FillColor = parseInt("00" + FillColor.substr(2, 6), 16);
			console.log("fixed color", FillColor);
		}*/
		

		this.transparent = Transparent;
		this.width = Width;
		this.height = Height;
		this._data = Array();		//pixel data array
		this._canvas = document.createElement('canvas');
		this._canvas.width = this.width;
		this._canvas.height = this.height;
		this.context = this._canvas.getContext('2d');

		//FIXME: Temporarily disabled fill in researching alpha problems
		this.context.save();
			var a;
		this.context.fillStyle = a = this.makeRGBA(FillColor);
			//console.log(a, this.context.fillStyle); //DEBUG
		this.context.fillRect(0, 0, this.width, this.height);
			//document.body.appendChild(this._canvas).setAttribute('title', a); //DEBUG
		this.rect = new Rectangle(0, 0, this.width, this.height);
		this.context.restore();
	},

	//FIXME: This returns "premultiplied" (affected by alpha) pixels, not "unmultiplied" as Flash specifies
	getPixel: function(X, Y) {
		var d = this.context.getImageData(X, Y, 1, 1).data;
		return ( (d[0] << 16) | (d[1] << 8) | (d[2]) );
	},

	//FIXME: alphaBitmapData, alphaPoint are ignored. mergeAlpha temporarily ignored
	copyPixels: function(sourceBitmapData, sourceRect, destPoint, alphaBitmapData, alphaPoint, mergeAlpha) {

		/*var d = sourceBitmapData.context.getImageData(
			sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height
		);

		this.context.putImageData(d, destPoint.x, destPoint.y);*/

		//NOTE: Alternate implementation to get alpha right. Copying pixels is not correct because we don't blend
		//	alpha with the new canvas
		var s = sourceRect;
		var d = destPoint;
		this.context.clearRect(s.x, s.y, s.width, s.height);
		this.context.drawImage(sourceBitmapData._canvas, s.x, s.y, s.width, s.height, d.x, d.y, s.width, s.height);
	},

	setPixel: function(X, Y, Color) {

		//is a 1x1 rect faster than manipulating the data? No idea
		this.context.fillStyle = this.makeRGBA(Color);
		this.context.fillRect(X, Y, 1, 1);		
	},

	fillRect: function (rect, color) {
		this.context.save();
		this.context.clearRect(rect.x, rect.y, rect.width, rect.height);
		this.context.fillStyle = this.makeRGBA(color);
		this.context.fillRect(rect.x, rect.y, rect.width, rect.height);
		this.context.restore();
	},

	colorTransform: function(rect, colorTransform) {
		var ct = colorTransform;
		var d = this.context.getImageData(rect.x, rect.y, rect.width, rect.height);
		var r, g, b, a;

		for (var i = 0; i<d.data.length; i+=4) {
				//figure out new component values
			r = (d.data[i] * ct.redMultiplier) + ct.redOffset;
			g = (d.data[i+1] * ct.greenMultiplier) + ct.greenOffset;
			b = (d.data[i+2] * ct.blueMultiplier) + ct.blueOffset;
			a = (d.data[i+3] * ct.alphaMultiplier) + ct.alphaOffset;

			//clamp values. Not pretty but faster than function calls
			r = (r > 255) ? 255 : r;		r = (r < 0) ? 0 : r;
			g = (g > 255) ? 255 : g;		g = (g < 0) ? 0 : g;
			b = (b > 255) ? 255 : b;		b = (b < 0) ? 0 : b;
			a = (a > 255) ? 255 : a;		a = (a < 0) ? 0 : a;

			//assign new values
			d.data[i  ] = r;
			d.data[i+1] = g;
			d.data[i+2] = b;
			d.data[i+3] = a;
		}

		this.context.putImageData(d, rect.x, rect.y);

	},

	//NOTE: Only source and matrix are used
	draw: function(source, matrix, colorTransform, blendMode, clipRect, smoothing) {

		this.context.save();

		//Perform a transform (scale, rotation, or translation) only if a matrix is passed
		if (matrix !== undefined && matrix !== null) {
			var m = matrix;
			this.context.setTransform(m.a, m.b, m.c, m.d, m.tx, m.ty);
		}

		//If a clip rect is specified then draw only a portion of the source image
		if (clipRect !== undefined && clipRect !== null) {
			var r = clipRect;
			this.context.drawImage(source._canvas, r.x, r.y, r.width, r.height, 0, 0, r.width, r.height);
		} else {
			this.context.drawImage(source._canvas, 0, 0);
		}

		this.context.restore();
		
	},

	//NOTE: This is not a Flash BitmapData function. This is a helper function.
	//makes a CSS color for Canvas fillStyles, e.g. rgb(128, 64, 64, 0.7);
	makeRGBA: function(Color) {
		var f = Color.toString(16).pad(8, "0", "left");
		var a = parseInt(f.substr(0, 2), 16) / 255;
		var r = parseInt(f.substr(2, 2), 16);
		var g = parseInt(f.substr(4, 2), 16);
		var b = parseInt(f.substr(6, 2), 16);

		return ("rgba(" + r + "," + g + "," + b + "," + a + ")");
	},

	clone: function() {
		var b = new BitmapData(this.width, this.height, this.transparent, 0x00000000);
		b.draw(this);

		return b;
	},


});

//NOTE: JS-specific static function to turn HTMLImageElemnt objects into BitmapData objects
BitmapData.fromImage = function(img) {

	var b = new BitmapData(img.width, img.height, true, 0x00000000);
	b.context.drawImage(img, 0, 0);

	return b;

};

//Doesn't really need to do anything, just hold some properties
ColorTransform = new Class({

	initialize: function(redMultiplier, greenMultiplier, blueMultiplier, alphaMultiplier,
		redOffset, greenOffset, blueOffset, alphaOffset) {

		this.redMultiplier = isNaN(redMultiplier) ? 1.0 : redMultiplier;
		this.greenMultiplier = isNaN(greenMultiplier) ? 1.0 : greenMultiplier;
		this.blueMultiplier = isNaN(blueMultiplier) ? 1.0 : blueMultiplier;
		this.alphaMultiplier = isNaN(alphaMultiplier) ? 1.0 : alphaMultiplier;
		this.redOffset = isNaN(redOffset) ? 0 : redOffset;
		this.greenOffset = isNaN(greenOffset) ? 0 : greenOffset;
		this.blueOffset = isNaN(blueOffset) ? 0 : blueOffset;
		this.alphaOffset = isNaN(alphaOffset) ? 0 : alphaOffset;

	}

});


//=========================Beginning of Flixel classes======================================

FlxPoint = new Class({

	initialize: function(X, Y) {
		X = isNaN(X) ? 0 : X;
		Y = isNaN(Y) ? 0 : Y;

		this.x = X;
		this.y = Y;
	}

});

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

FlxList = new Class({

	initialize: function() {
		this.object = null;
		this.next = null;
	}

});

FlxQuadTree = new Class({

	Extends: FlxRect,

	initialize: function(X, Y, Width, Height, Parent) {
		Parent = (Parent === undefined) ? null : Parent;

		this.parent(X,Y,Width,Height);

		this._headA = this._tailA = new FlxList();
		this._headB = this._tailB = new FlxList();

		//DEBUG: draw a randomly colored rectangle indicating this quadrant (may induce seizures)
		/*var brush = new FlxSprite().createGraphic(Width,Height,0xffffffff*FlxU.random());
		FlxState.screen.draw(brush,X+FlxG.scroll.x,Y+FlxG.scroll.y);*/

		
		//Copy the parent's children (if there are any)
		if(Parent != null)
		{
			var itr;
			var ot;
			if(Parent._headA.object != null)
			{
				itr = Parent._headA;
				while(itr != null)
				{
					if(this._tailA.object != null)
					{
						ot = _tailA;
						this._tailA = new FlxList();
						ot.next = this._tailA;
					}
					this._tailA.object = itr.object;
					itr = itr.next;
				}
			}
			if(Parent._headB.object != null)
			{
				itr = Parent._headB;
				while(itr != null)
				{
					if(this._tailB.object != null)
					{
						ot = this._tailB;
						this._tailB = new FlxList();
						ot.next = this._tailB;
					}
					this._tailB.object = itr.object;
					itr = itr.next;
				}
			}
		}
		else
			FlxQuadTree._min = (this.width + this.height)/(2 * FlxQuadTree.divisions);
		this._canSubdivide = (this.width > this._min) || (this.height > FlxQuadTree._min);
		
		//Set up comparison/sort helpers
		this._nw = null;
		this._ne = null;
		this._se = null;
		this._sw = null;
		this._l = this.x;
		this._r = this.x + this.width;
		this._hw = this.width/2;
		this._mx = this._l + this._hw;
		this._t = this.y;
		this._b = this.y + this.height;
		this._hh = this.height/2;
		this._my = this._t + this._hh;
	},

	add: function(Obj, List)
	{
		this._oa = List;
		if(Obj._group)
		{
			var i = 0;
			var m;
			var members = Obj.members;
			var l = members.length;
			while(i < l)
			{
				m = members[i++];
				if((m != null) && m.exists)
				{
					if(m._group)
						this.add(m,List);
					else if(m.solid)
					{
						FlxQuadTree._o = m;
						FlxQuadTree._ol = FlxQuadTree._o.x;
						FlxQuadTree._ot = FlxQuadTree._o.y;
						FlxQuadTree._or = FlxQuadTree._o.x + FlxQuadTree._o.width;
						FlxQuadTree._ob = FlxQuadTree._o.y + FlxQuadTree._o.height;
						this.addObject();
					}
				}
			}
		}
		if(Obj.solid)
		{
			FlxQuadTree._o = Obj;
			FlxQuadTree._ol = FlxQuadTree._o.x;
			FlxQuadTree._ot = FlxQuadTree._o.y;
			FlxQuadTree._or = FlxQuadTree._o.x + FlxQuadTree._o.width;
			FlxQuadTree._ob = FlxQuadTree._o.y + FlxQuadTree._o.height;
			this.addObject();
		}
	},

	addObject: function()
	{
		//If this quad (not its children) lies entirely inside this object, add it here
		if(!this._canSubdivide || ((this._l >= this._ol) && (this._r <= this._or) && (this._t >= this._ot) && (this._b <= this._ob)))
		{
			this.addToList();
			return;
		}
		
		//See if the selected object fits completely inside any of the quadrants
		if((this._ol > this._l) && (this._or < this._mx))
		{
			if((this._ot > this._t) && (this._ob < this._my))
			{
				if(this._nw == null)
					this._nw = new FlxQuadTree(this._l,this._t,this._hw,this._hh,this);
				this._nw.addObject();
				return;
			}
			if((this._ot > this._my) && (this._ob < this._b))
			{
				if(this._sw == null)
					this._sw = new FlxQuadTree(this._l,this._my,this._hw,this._hh,this);
				this._sw.addObject();
				return;
			}
		}
		if((this._ol > this._mx) && (this._or < this._r))
		{
			if((this._ot > this._t) && (this._ob < this._my))
			{
				if(this._ne == null)
					this._ne = new FlxQuadTree(this._mx,this._t,this._hw,this._hh,this);
				this._ne.addObject();
				return;
			}
			if((this._ot > this._my) && (this._ob < this._b))
			{
				if(this._se == null)
					this._se = new FlxQuadTree(this._mx,this._my,this._hw,this._hh,this);
				this._se.addObject();
				return;
			}
		}
		
		//If it wasn't completely contained we have to check out the partial overlaps
		if((this._or > this._l) && (this._ol < this._mx) && (this._ob > this._t) && (this._ot < this._my))
		{
			if(this._nw == null)
				this._nw = new FlxQuadTree(this._l,this._t,this._hw,this._hh,this);
			this._nw.addObject();
		}
		if((this._or > this._mx) && (this._ol < this._r) && (this._ob > this._t) && (this._ot < this._my))
		{
			if(this._ne == null)
				this._ne = new FlxQuadTree(this._mx,this._t,this._hw,this._hh,this);
			this._ne.addObject();
		}
		if((this._or > this._mx) && (this._ol < this._r) && (this._ob > this._my) && (this._ot < this._b))
		{
			if(this._se == null)
				this._se = new FlxQuadTree(this._mx,this._my,this._hw,this._hh,this);
			this._se.addObject();
		}
		if((this._or > this._l) && (this._ol < this._mx) && (this._ob > this._my) && (this._ot < this._b))
		{
			if(this._sw == null)
				this._sw = new FlxQuadTree(this._l,this._my,this._hw,this._hh,this);
			this._sw.addObject();
		}
	},

	addToList: function()
	{
		var ot;
		if(this._oa == FlxQuadTree.A_LIST)
		{
			if(this._tailA.object != null)
			{
				ot = this._tailA;
				this._tailA = new FlxList();
				ot.next = this._tailA;
			}
			this._tailA.object = this._o;
		}
		else
		{
			if(this._tailB.object != null)
			{
				ot = this._tailB;
				this._tailB = new FlxList();
				ot.next = this._tailB;
			}
			this._tailB.object = this._o;
		}
		if(!this._canSubdivide)
			return;
		if(this._nw != null)
			this._nw.addToList();
		if(this._ne != null)
			this._ne.addToList();
		if(this._se != null)
			this._se.addToList();
		if(this._sw != null)
			this._sw.addToList();
	},

	overlap: function(BothLists, Callback) {
		BothLists = (BothLists === undefined) ? true : BothLists;
		Callback = (Callback === undefined) ? null : Callback;

		this._oc = Callback;
		var c = false;
		var itr;
		if(BothLists)
		{
			//An A-B list comparison
			this._oa = FlxQuadTree.B_LIST;
			if(this._headA.object != null)
			{
				itr = this._headA;
				while(itr != null)
				{
					FlxQuadTree._o = itr.object;
					if(this._o.exists && this._o.solid && this.overlapNode())
						c = true;
					itr = itr.next;
				}
			}
			this._oa = FlxQuadTree.A_LIST;
			if(this._headB.object != null)
			{
				itr = this._headB;
				while(itr != null)
				{
					FlxQuadTree._o = itr.object;
					if(this._o.exists && this._o.solid)
					{
						if((this._nw != null) && this._nw.overlapNode())
							c = true;
						if((this._ne != null) && this._ne.overlapNode())
							c = true;
						if((this._se != null) && this._se.overlapNode())
							c = true;
						if((this._sw != null) && this._sw.overlapNode())
							c = true;
					}
					itr = itr.next;
				}
			}
		}
		else
		{
			//Just checking the A list against itself
			if(this._headA.object != null)
			{
				itr = this._headA;
				while(itr != null)
				{
					FlxQuadTree._o = itr.object;
					if(this._o.exists && this._o.solid && this.overlapNode(itr.next))
						c = true;
					itr = itr.next;
				}
			}
		}
		
		//Advance through the tree by calling overlap on each child
		if((this._nw != null) && this._nw.overlap(BothLists,this._oc))
			c = true;
		if((this._ne != null) && this._ne.overlap(BothLists,this._oc))
			c = true;
		if((this._se != null) && this._se.overlap(BothLists,this._oc))
			c = true;
		if((this._sw != null) && this._sw.overlap(BothLists,this._oc))
			c = true;
		
		return c;
	},

	overlapNode: function(Iterator) {
		Iterator = (Iterator === undefined) ? null : Iterator;

		//member list setup
		var c = false;
		var co;
		var itr = Iterator;
		if(itr == null)
		{
			if(this._oa == FlxQuadTree.A_LIST)
				itr = this._headA;
			else
				itr = this._headB;
		}
		
		//Make sure this is a valid list to walk first!
		if(itr.object != null)
		{
			//Walk the list and check for overlaps
			while(itr != null)
			{
				co = itr.object;
				if( (FlxQuadTree._o === co) || !co.exists || !this._o.exists || !co.solid || !this._o.solid ||
					(FlxQuadTree._o.x + this._o.width  < co.x + FlxU.roundingError) ||
					(FlxQuadTree._o.x + FlxU.roundingError > co.x + co.width) ||
					(FlxQuadTree._o.y + this._o.height < co.y + FlxU.roundingError) ||
					(FlxQuadTree._o.y + FlxU.roundingError > co.y + co.height) )
				{
					itr = itr.next;
					continue;
				}
				if(this._oc == null)
				{
					this._o.kill();
					co.kill();
					c = true;
				}
				else if(this._oc(this._o,co))
					c = true;
				itr = itr.next;
			}
		}
		
		return c;
	}


});

//Static properties
FlxQuadTree.A_LIST = 0;
FlxQuadTree.B_LIST = 1;
FlxQuadTree.divisions =  3;
FlxQuadTree.quadTree = null;
FlxQuadTree.bounds = null;

FlxU = new Class({

	initialize: function() {
	},

	abs: function(N) {
		return Math.abs(N);
	},
	
	floor: function(N) {
		return Math.floor(N);
	},
	
	ceil: function(N) {
		return Math.ceil(N);
	},
	
	min: function(N1,N2) {
		return Math.min(N1, N2);
	},
		
	max: function(N1,N2) {
		return Math.max(N1, N2);
	},

	random: function(Seed) {
		if(isNaN(Seed) || Seed === undefined)
			return Math.random();
		else
		{
			//Make sure the seed value is OK
			if(Seed == 0)
				Seed = Number.MIN_VALUE;
			if(Seed >= 1)
			{
				if((Seed % 1) == 0)
					Seed /= Math.PI;
				Seed %= 1;
			}
			else if(Seed < 0)
				Seed = (Seed % 1) + 1;
			
			//Then do an LCG thing and return a predictable random number
			return ((69621 * Math.floor(Seed * 0x7FFFFFFF)) % 0x7FFFFFFF) / 0x7FFFFFFF;
		}
	},

	startProfile: function() {
		return flash.utils.getTimer();
	},

	endProfile: function(Start, Name, Log) {
		var t = flash.utils.getTimer();
		if(Log)
			FlxG.log(Name+": "+((t-Start)/1000)+"s");
		return t;
	},

	rotatePoint: function(X, Y, PivotX, PivotY, Angle, P) {
		var sin = 0;
		var cos = 0;
		var radians = Angle * -0.017453293;
		while (radians < -3.14159265)
			radians += 6.28318531;
		while (radians >  3.14159265)
			radians = radians - 6.28318531;

		if (radians < 0)
		{
			sin = 1.27323954 * radians + .405284735 * radians * radians;
			if (sin < 0)
				sin = .225 * (sin *-sin - sin) + sin;
			else
				sin = .225 * (sin * sin - sin) + sin;
		}
		else
		{
			sin = 1.27323954 * radians - 0.405284735 * radians * radians;
			if (sin < 0)
				sin = .225 * (sin *-sin - sin) + sin;
			else
				sin = .225 * (sin * sin - sin) + sin;
		}
		
		radians += 1.57079632;
		if (radians >  3.14159265)
			radians = radians - 6.28318531;
		if (radians < 0)
		{
			cos = 1.27323954 * radians + 0.405284735 * radians * radians;
			if (cos < 0)
				cos = .225 * (cos *-cos - cos) + cos;
			else
				cos = .225 * (cos * cos - cos) + cos;
		}
		else
		{
			cos = 1.27323954 * radians - 0.405284735 * radians * radians;
			if (cos < 0)
				cos = .225 * (cos *-cos - cos) + cos;
			else
				cos = .225 * (cos * cos - cos) + cos;
		}

		var dx = X-PivotX;
		var dy = PivotY-Y;
		if(P === undefined) P = new FlxPoint();
		P.x = PivotX + cos*dx - sin*dy;
		P.y = PivotY - sin*dx - cos*dy;
		return P;
	},

	getAngle: function(X, Y) {
		
		var c1 = 3.14159265 / 4;
		var c2 = 3 * c1;
		var ay = (Y < 0)?-Y:Y;
		var angle = 0;
		if (X >= 0)
			angle = c1 - c1 * ((X - ay) / (X + ay));
		else
			angle = c2 - c1 * ((X + ay) / (ay - X));
		return ((Y < 0)?-angle:angle)*57.2957796;
	},

	getColor: function(Red, Green, Blue, Alpha)
	{
		//AS3 default value of 1.0
		Alpha = (isNaN(Alpha)) ? 1.0 : Alpha;
		return (((Alpha>1)?Alpha:(Alpha * 255)) & 0xFF) << 24 | (Red & 0xFF) << 16 | (Green & 0xFF) << 8 | (Blue & 0xFF);
	},

	getColorHSB: function(Hue,Saturation,Brightness,Alpha)
	{
		//AS3 default value of 1.0
		Alpha = (isNaN(Alpha)) ? 1.0 : Alpha;
		var red;
		var green;
		var blue;
		if(Saturation == 0.0)
		{
			red   = Brightness;
			green = Brightness;        
			blue  = Brightness;
		}       
		else
		{
			if(Hue == 360)
				Hue = 0;
			var slice = Hue/60;
			var hf = Hue/60 - slice;
			var aa = Brightness*(1 - Saturation);
			var bb = Brightness*(1 - Saturation*hf);
			var cc = Brightness*(1 - Saturation*(1.0 - hf));
			switch (slice)
			{
				case 0: red = Brightness; green = cc;   blue = aa;  break;
				case 1: red = bb;  green = Brightness;  blue = aa;  break;
				case 2: red = aa;  green = Brightness;  blue = cc;  break;
				case 3: red = aa;  green = bb;   blue = Brightness; break;
				case 4: red = cc;  green = aa;   blue = Brightness; break;
				case 5: red = Brightness; green = aa;   blue = bb;  break;
				default: red = 0;  green = 0;    blue = 0;   break;
			}
		}
		
		return (((Alpha>1)?Alpha:(Alpha * 255)) & 0xFF) << 24 | uint(red*255) << 16 | uint(green*255) << 8 | uint(blue*255);
	},

	getRGBA: function(Color, Results) {
		if(Results == null)
			Results = new Array();
		Results[0] = (Color >> 16) & 0xFF;
		Results[1] = (Color >> 8) & 0xFF;
		Results[2] = Color & 0xFF;
		Results[3] = Number((Color >> 24) & 0xFF) / 255;
		return Results;
	},

	//FIXME: Skipped completely for now. May not even be important outside Flash
	getClassName: function(Obj,Simple) {
		/*var s = getQualifiedClassName(Obj);
		s = s.replace("::",".");
		if(Simple)
			s = s.substr(s.lastIndexOf(".")+1);
		return s;*/
	},

	//FIXME: Also skipped
	getClass: function(Name) {
		//return getDefinitionByName(Name) as Class;
	},

	computeVelocity: function (Velocity, Acceleration, Drag, Max) {

		//Set default values for optional parameters
		Acceleration = (isNaN(Acceleration)) ? 0 : Acceleration;
		Max = (isNaN(Max)) ? 10000 : Max;
		Drag = (isNaN(Drag)) ? 0 : Drag;

		if(Acceleration != 0)
			Velocity += Acceleration*FlxG.elapsed;
		else if(Drag != 0)
		{
			var d = Drag*FlxG.elapsed;
			if(Velocity - d > 0)
				Velocity = Velocity - d;
			else if(Velocity + d < 0)
				Velocity += d;
			else
				Velocity = 0;
		}
		if((Velocity != 0) && (Max != 10000))
		{
			if(Velocity > Max)
				Velocity = Max;
			else if(Velocity < -Max)
				Velocity = -Max;
		}
		return Velocity;
	},

	setWorldBounds: function(X, Y, Width, Height, Divisions) {

		//Set default values for optional parameters
		X = (isNaN(X)) ? 0 : X;
		Y = (isNaN(Y)) ? 0 : Y;
		Width = (isNaN(Width)) ? 0 : Width;
		Height = (isNaN(Height)) ? 0 : Height;
		Divisions = (isNaN(Divisions)) ? 3 : Divisions;

		if(FlxQuadTree.bounds == null)
			FlxQuadTree.bounds = new FlxRect();
		FlxQuadTree.bounds.x = X;
		FlxQuadTree.bounds.y = Y;
		if(Width > 0)
			FlxQuadTree.bounds.width = Width;
		if(Height > 0)
			FlxQuadTree.bounds.height = Height;
		if(Divisions > 0)
			FlxQuadTree.divisions = Divisions;
	},

	overlap: function(Object1, Object2, Callback) {
		if( (Object1 == null) || !Object1.exists ||
			(Object2 == null) || !Object2.exists )
			return false;
		FlxU.quadTree = new FlxQuadTree(FlxQuadTree.bounds.x,FlxQuadTree.bounds.y,FlxQuadTree.bounds.width,FlxQuadTree.bounds.height);
		FlxU.quadTree.add(Object1,FlxQuadTree.A_LIST);
		if(Object1 === Object2)
			return FlxU.quadTree.overlap(false,Callback);
		FlxU.quadTree.add(Object2,FlxQuadTree.B_LIST);

		return FlxU.quadTree.overlap(true,Callback);
	},

	//FIXME: Strict comparison of Object1 and Object2 may not do what intended here. Test.
	collide: function(Object1, Object2) {
		if( (Object1 == null) || !Object1.exists ||
			(Object2 == null) || !Object2.exists )
			return false;
		FlxU.quadTree = new FlxQuadTree(FlxQuadTree.bounds.x,FlxQuadTree.bounds.y,FlxQuadTree.bounds.width,FlxQuadTree.bounds.height);
		FlxU.quadTree.add(Object1,FlxQuadTree.A_LIST);
		var match = (Object1 == Object2);
		if(!match)
			FlxU.quadTree.add(Object2, FlxQuadTree.B_LIST);
		var cx = FlxU.quadTree.overlap(!match, FlxU.solveXCollision);
		var cy = FlxU.quadTree.overlap(!match, FlxU.solveYCollision);
		return cx || cy;			
	}, 

	solveXCollision: function(Object1, Object2)
	{
		//Avoid messed up collisions ahead of time
		var o1 = Object1.colVector.x;
		var o2 = Object2.colVector.x;
		if(o1 == o2)
			return false;
		
		//Give the objects a heads up that we're about to resolve some collisions
		Object1.preCollide(Object2);
		Object2.preCollide(Object1);

		//Basic resolution variables
		var f1;
		var f2;
		var overlap;
		var hit = false;
		var p1hn2;
		
		//Directional variables
		var obj1Stopped = o1 == 0;
		var obj1MoveNeg = o1 < 0;
		var obj1MovePos = o1 > 0;
		var obj2Stopped = o2 == 0;
		var obj2MoveNeg = o2 < 0;
		var obj2MovePos = o2 > 0;
		
		//Offset loop variables
		var i1;
		var i2;
		var obj1Hull = Object1.colHullX;
		var obj2Hull = Object2.colHullX;
		var co1 = Object1.colOffsets;
		var co2 = Object2.colOffsets;
		var l1 = co1.length;
		var l2 = co2.length;
		var ox1;
		var oy1;
		var ox2;
		var oy2;
		var r1;
		var r2;
		var sv1;
		var sv2;
		
		//Decide based on object's movement patterns if it was a right-side or left-side collision
		p1hn2 = ((obj1Stopped && obj2MoveNeg) || (obj1MovePos && obj2Stopped) || (obj1MovePos && obj2MoveNeg) || //the obvious cases
				(obj1MoveNeg && obj2MoveNeg && (((o1>0)?o1:-o1) < ((o2>0)?o2:-o2))) || //both moving left, obj2 overtakes obj1
				(obj1MovePos && obj2MovePos && (((o1>0)?o1:-o1) > ((o2>0)?o2:-o2))) ); //both moving right, obj1 overtakes obj2
		
		//Check to see if these objects allow these collisions
		if(p1hn2?(!Object1.collideRight || !Object2.collideLeft):(!Object1.collideLeft || !Object2.collideRight))
			return false;
		
		//this looks insane, but we're just looping through collision offsets on each object
		i1 = 0;
		while(i1 < l1)
		{
			ox1 = co1[i1].x;
			oy1 = co1[i1].y;
			obj1Hull.x += ox1;
			obj1Hull.y += oy1;
			i2 = 0;
			while(i2 < l2)
			{
				ox2 = co2[i2].x;
				oy2 = co2[i2].y;
				obj2Hull.x += ox2;
				obj2Hull.y += oy2;
				
				//See if it's a actually a valid collision
				if( (obj1Hull.x + obj1Hull.width  < obj2Hull.x + FlxU.roundingError) ||
					(obj1Hull.x + FlxU.roundingError > obj2Hull.x + obj2Hull.width) ||
					(obj1Hull.y + obj1Hull.height < obj2Hull.y + FlxU.roundingError) ||
					(obj1Hull.y + FlxU.roundingError > obj2Hull.y + obj2Hull.height) )
				{
					obj2Hull.x = obj2Hull.x - ox2;
					obj2Hull.y = obj2Hull.y - oy2;
					i2++;
					continue;
				}

				//Calculate the overlap between the objects
				if(p1hn2)
				{
					if(obj1MoveNeg)
						r1 = obj1Hull.x + Object1.colHullY.width;
					else
						r1 = obj1Hull.x + obj1Hull.width;
					if(obj2MoveNeg)
						r2 = obj2Hull.x;
					else
						r2 = obj2Hull.x + obj2Hull.width - Object2.colHullY.width;
				}
				else
				{
					if(obj2MoveNeg)
						r1 = -obj2Hull.x - Object2.colHullY.width;
					else
						r1 = -obj2Hull.x - obj2Hull.width;
					if(obj1MoveNeg)
						r2 = -obj1Hull.x;
					else
						r2 = -obj1Hull.x - obj1Hull.width + Object1.colHullY.width;
				}
				overlap = r1 - r2;
				
				//Slightly smarter version of checking if objects are 'fixed' in space or not
				f1 = Object1.fixed;
				f2 = Object2.fixed;
				if(f1 && f2)
				{
					f1 = f1 && ((Object1.colVector.x == 0) && (o1 == 0));
					f2 = f2 && ((Object2.colVector.x == 0) && (o2 == 0));
				}

				//Last chance to skip out on a bogus collision resolution
				if( (overlap == 0) ||
					((!f1 && ((overlap>0)?overlap:-overlap) > obj1Hull.width*0.8)) ||
					((!f2 && ((overlap>0)?overlap:-overlap) > obj2Hull.width*0.8)) )
				{
					obj2Hull.x = obj2Hull.x - ox2;
					obj2Hull.y = obj2Hull.y - oy2;
					i2++;
					continue;
				}
				hit = true;
				
				//Adjust the objects according to their flags and stuff
				sv1 = Object2.velocity.x;
				sv2 = Object1.velocity.x;
				if(!f1 && f2)
				{
					if(Object1._group)
						Object1.reset(Object1.x - overlap,Object1.y);
					else
						Object1.x = Object1.x - overlap;
				}
				else if(f1 && !f2)
				{
					if(Object2._group)
						Object2.reset(Object2.x + overlap,Object2.y);
					else
						Object2.x += overlap;
				}
				else if(!f1 && !f2)
				{
					overlap /= 2;
					if(Object1._group)
						Object1.reset(Object1.x - overlap,Object1.y);
					else
						Object1.x = Object1.x - overlap;
					if(Object2._group)
						Object2.reset(Object2.x + overlap,Object2.y);
					else
						Object2.x += overlap;
					sv1 *= 0.5;
					sv2 *= 0.5;
				}
				if(p1hn2)
				{
					Object1.hitRight(Object2,sv1);
					Object2.hitLeft(Object1,sv2);
				}
				else
				{
					Object1.hitLeft(Object2,sv1);
					Object2.hitRight(Object1,sv2);
				}
				
				//Adjust collision hulls if necessary
				if(!f1 && (overlap != 0))
				{
					if(p1hn2)
						obj1Hull.width = obj1Hull.width - overlap;
					else
					{
						obj1Hull.x = obj1Hull.x - overlap;
						obj1Hull.width += overlap;
					}
					Object1.colHullY.x = Object1.colHullY.x - overlap;
				}
				if(!f2 && (overlap != 0))
				{
					if(p1hn2)
					{
						obj2Hull.x += overlap;
						obj2Hull.width = obj2Hull.width - overlap;
					}
					else
						obj2Hull.width += overlap;
					Object2.colHullY.x += overlap;
				}
				obj2Hull.x = obj2Hull.x - ox2;
				obj2Hull.y = obj2Hull.y - oy2;
				i2++;
			}
			obj1Hull.x = obj1Hull.x - ox1;
			obj1Hull.y = obj1Hull.y - oy1;
			i1++;
		}

		return hit;
	},


	solveYCollision: function(Object1, Object2)
	{
		//Avoid messed up collisions ahead of time
		var o1 = Object1.colVector.y;
		var o2 = Object2.colVector.y;
		if(o1 == o2)
			return false;
		
		//Give the objects a heads up that we're about to resolve some collisions
		Object1.preCollide(Object2);
		Object2.preCollide(Object1);
		
		//Basic resolution variables
		var f1;
		var f2;
		var overlap;
		var hit = false;
		var p1hn2;
		
		//Directional variables
		var obj1Stopped = o1 == 0;
		var obj1MoveNeg = o1 < 0;
		var obj1MovePos = o1 > 0;
		var obj2Stopped = o2 == 0;
		var obj2MoveNeg = o2 < 0;
		var obj2MovePos = o2 > 0;
		
		//Offset loop variables
		var i1;
		var i2;
		var obj1Hull = Object1.colHullY;
		var obj2Hull = Object2.colHullY;
		var co1 = Object1.colOffsets;
		var co2 = Object2.colOffsets;
		var l1 = co1.length;
		var l2 = co2.length;
		var ox1;
		var oy1;
		var ox2;
		var oy2;
		var r1;
		var r2;
		var sv1;
		var sv2;
		
		//Decide based on object's movement patterns if it was a top or bottom collision
		p1hn2 = ((obj1Stopped && obj2MoveNeg) || (obj1MovePos && obj2Stopped) || (obj1MovePos && obj2MoveNeg) || //the obvious cases
			(obj1MoveNeg && obj2MoveNeg && (((o1>0)?o1:-o1) < ((o2>0)?o2:-o2))) || //both moving up, obj2 overtakes obj1
			(obj1MovePos && obj2MovePos && (((o1>0)?o1:-o1) > ((o2>0)?o2:-o2))) ); //both moving down, obj1 overtakes obj2
		
		//Check to see if these objects allow these collisions
		if(p1hn2?(!Object1.collideBottom || !Object2.collideTop):(!Object1.collideTop || !Object2.collideBottom))
			return false;
		
		//this looks insane, but we're just looping through collision offsets on each object
		i1 = 0;
		while(i1 < l1)
		{
			ox1 = co1[i1].x;
			oy1 = co1[i1].y;
			obj1Hull.x += ox1;
			obj1Hull.y += oy1;
			i2 = 0;
			while(i2 < l2)
			{
				ox2 = co2[i2].x;
				oy2 = co2[i2].y;
				obj2Hull.x += ox2;
				obj2Hull.y += oy2;
				
				//See if it's a actually a valid collision
				if( (obj1Hull.x + obj1Hull.width  < obj2Hull.x + FlxU.roundingError) ||
					(obj1Hull.x + FlxU.roundingError > obj2Hull.x + obj2Hull.width) ||
					(obj1Hull.y + obj1Hull.height < obj2Hull.y + FlxU.roundingError) ||
					(obj1Hull.y + FlxU.roundingError > obj2Hull.y + obj2Hull.height) )
				{
					obj2Hull.x = obj2Hull.x - ox2;
					obj2Hull.y = obj2Hull.y - oy2;
					i2++;
					continue;
				}
				
				//Calculate the overlap between the objects
				if(p1hn2)
				{
					if(obj1MoveNeg)
						r1 = obj1Hull.y + Object1.colHullX.height;
					else
						r1 = obj1Hull.y + obj1Hull.height;
					if(obj2MoveNeg)
						r2 = obj2Hull.y;
					else
						r2 = obj2Hull.y + obj2Hull.height - Object2.colHullX.height;
				}
				else
				{
					if(obj2MoveNeg)
						r1 = -obj2Hull.y - Object2.colHullX.height;
					else
						r1 = -obj2Hull.y - obj2Hull.height;
					if(obj1MoveNeg)
						r2 = -obj1Hull.y;
					else
						r2 = -obj1Hull.y - obj1Hull.height + Object1.colHullX.height;
				}
				overlap = r1 - r2;
				
				//Slightly smarter version of checking if objects are 'fixed' in space or not
				f1 = Object1.fixed;
				f2 = Object2.fixed;
				if(f1 && f2)
				{
					f1 = f1 && ((Object1.colVector.x == 0) && (o1 == 0));
					f2 = f2 && ((Object2.colVector.x == 0) && (o2 == 0));
				}
				
				//Last chance to skip out on a bogus collision resolution
				if( (overlap == 0) ||
					((!f1 && ((overlap>0)?overlap:-overlap) > obj1Hull.height*0.8)) ||
					((!f2 && ((overlap>0)?overlap:-overlap) > obj2Hull.height*0.8)) )
				{
					obj2Hull.x = obj2Hull.x - ox2;
					obj2Hull.y = obj2Hull.y - oy2;
					i2++;
					continue;
				}
				hit = true;
				
				//Adjust the objects according to their flags and stuff
				sv1 = Object2.velocity.y;
				sv2 = Object1.velocity.y;
				if(!f1 && f2)
				{
					if(Object1._group)
						Object1.reset(Object1.x, Object1.y - overlap);
					else
						Object1.y = Object1.y - overlap;
				}
				else if(f1 && !f2)
				{
					if(Object2._group)
						Object2.reset(Object2.x, Object2.y + overlap);
					else
						Object2.y += overlap;
				}
				else if(!f1 && !f2)
				{
					overlap /= 2;
					if(Object1._group)
						Object1.reset(Object1.x, Object1.y - overlap);
					else
						Object1.y = Object1.y - overlap;
					if(Object2._group)
						Object2.reset(Object2.x, Object2.y + overlap);
					else
						Object2.y += overlap;
					sv1 *= 0.5;
					sv2 *= 0.5;
				}
				if(p1hn2)
				{
					Object1.hitBottom(Object2,sv1);
					Object2.hitTop(Object1,sv2);
				}
				else
				{
					Object1.hitTop(Object2,sv1);
					Object2.hitBottom(Object1,sv2);
				}
				
				//Adjust collision hulls if necessary
				if(!f1 && (overlap != 0))
				{
					if(p1hn2)
					{
						obj1Hull.y = obj1Hull.y - overlap;
						
						//This code helps stuff ride horizontally moving platforms.
						if(f2 && Object2.moves)
						{
							sv1 = Object2.colVector.x;
							Object1.x += sv1;
							obj1Hull.x += sv1;
							Object1.colHullX.x += sv1;
						}
					}
					else
					{
						obj1Hull.y = obj1Hull.y - overlap;
						obj1Hull.height += overlap;
					}
				}
				if(!f2 && (overlap != 0))
				{
					if(p1hn2)
					{
						obj2Hull.y += overlap;
						obj2Hull.height = obj2Hull.height - overlap;
					}
					else
					{
						obj2Hull.height += overlap;
					
						//This code helps stuff ride horizontally moving platforms.
						if(f1 && Object1.moves)
						{
							sv2 = Object1.colVector.x;
							Object2.x += sv2;
							obj2Hull.x += sv2;
							Object2.colHullX.x += sv2;
						}
					}
				}
				obj2Hull.x = obj2Hull.x - ox2;
				obj2Hull.y = obj2Hull.y - oy2;
				i2++;
			}
			obj1Hull.x = obj1Hull.x - ox1;
			obj1Hull.y = obj1Hull.y - oy1;
			i1++;
		}
		
		return hit;
	}


});

//Static class, so replace class definition with an instance of the class
FlxU = new FlxU();
FlxU.roundingError = 0.000001;
FlxU.quadTree = null;

FlxObject = new Class({

		Extends: FlxRect,

		initialize: function (X, Y, Width, Height) {

			this.parent(X,Y,Width,Height);

			this.__defineGetter__("solid", this.getSolid);
			this.__defineGetter__("fixed", this.getFixed);

			this.__defineSetter__("solid", this.setSolid);
			this.__defineSetter__("fixed", this.setFixed);
			
			this.exists = true;
			this.active = true;
			this.visible = true;
			this._solid = true;
			this._fixed = false;
			this.moves = true;
			
			this.collideLeft = true;
			this.collideRight = true;
			this.collideTop = true;
			this.collideBottom = true;
			
			this.origin = new FlxPoint();

			this.velocity = new FlxPoint();
			this.acceleration = new FlxPoint();
			this.drag = new FlxPoint();
			this.maxVelocity = new FlxPoint(10000,10000);
			
			this.angle = 0;
			this.angularVelocity = 0;
			this.angularAcceleration = 0;
			this.angularDrag = 0;
			this.maxAngular = 10000;
			
			this.thrust = 0;
			
			this.scrollFactor = new FlxPoint(1,1);
			this._flicker = false;
			this._flickerTimer = -1;
			this.health = 1;
			this.dead = false;
			this._point = new FlxPoint();
			this._rect = new FlxRect();
			this._flashPoint = new Point();
			
			this.colHullX = new FlxRect();
			this.colHullY = new FlxRect();
			this.colVector = new FlxPoint();
			this.colOffsets = new Array(new FlxPoint());
			this._group = false;

			this._point = new FlxPoint();

		},

		destroy: function() {},
		getSolid: function() { return this._solid; },
		setSolid: function(Solid) { this._solid = Solid; },
		getFixed: function() { return this._fixed; },
		setFixed: function(Fixed) { this._fixed = Fixed; },

		refreshHulls: function() {

			this.colHullX.x = this.x;
			this.colHullX.y = this.y;
			this.colHullX.width = this.width;
			this.colHullX.height = this.height;
			this.colHullY.x = this.x;
			this.colHullY.y = this.y;
			this.colHullY.width = this.width;
			this.colHullY.height = this.height;
		},

		updateMotion: function() {

			if(!this.moves)
				return;
			
			if(this._solid)
				this.refreshHulls();
			this.onFloor = false;
			var vc;

			this.vc = (FlxU.computeVelocity(this.angularVelocity,
					this.angularAcceleration,this.angularDrag,this.maxAngular) - this.angularVelocity)/2;
			this.angularVelocity += vc; 
			this.angle += this.angularVelocity*FlxG.elapsed;
			this.angularVelocity += this.vc;
			
			var thrustComponents;
			if(this.thrust != 0)
			{
				thrustComponents = FlxU.rotatePoint(-this.thrust,0,0,0,this.angle);
				var maxComponents = FlxU.rotatePoint(-this.maxThrust,0,0,0,this.angle);
				var max = ((maxComponents.x>0)?maxComponents.x:-maxComponents.x);
				if(max > ((maxComponents.y>0)?maxComponents.y:-maxComponents.y))
					maxComponents.y = max;
				else
					max = ((maxComponents.y>0)?maxComponents.y:-maxComponents.y);
				this.maxVelocity.x = this.maxVelocity.y = ((max>0)?max:-max);
			}
			else
				thrustComponents = FlxObject._pZero;

			vc = (FlxU.computeVelocity(this.velocity.x,this.acceleration.x+
					thrustComponents.x,this.drag.x,this.maxVelocity.x) - this.velocity.x)/2;
			this.velocity.x += vc;
			var xd = this.velocity.x*FlxG.elapsed;
			this.velocity.x += vc;
			
			vc = (FlxU.computeVelocity(this.velocity.y,this.acceleration.y+
					thrustComponents.y,this.drag.y,this.maxVelocity.y) - this.velocity.y)/2;
			this.velocity.y += vc;
			var yd = this.velocity.y*FlxG.elapsed;
			this.velocity.y += vc;
			
			this.x += xd;
			this.y += yd;
			
			//Update collision data with new movement results
			if(!this._solid)
				return;
			this.colVector.x = xd;
			this.colVector.y = yd;
			this.colHullX.width += ((this.colVector.x>0)?this.colVector.x:-this.colVector.x);
			if(this.colVector.x < 0)
				this.colHullX.x += this.colVector.x;
			this.colHullY.x = this.x;
			this.colHullY.height += ((this.colVector.y>0)?this.colVector.y:-this.colVector.y);
			if(this.colVector.y < 0)
				this.colHullY.y += this.colVector.y;
		},

		updateFlickering: function()  {
			if(this.flickering())
			{
				if(this._flickerTimer > 0)
				{
					this._flickerTimer = this._flickerTimer - FlxG.elapsed;
					if(this._flickerTimer == 0)
						this._flickerTimer = -1;
				}
				if(this._flickerTimer < 0)
					this.flicker(-1);
				else
				{
					this._flicker = !this._flicker;
					this.visible = !this._flicker;
				}
			}
		},

		update: function() {
			this.updateMotion();
			this.updateFlickering();
		},

		render: function() {},

		overlaps: function(Obj)
		{
			this.getScreenXY(this._point);
			var tx = this._point.x;
			var ty = this._point.y;
			Obj.getScreenXY(this._point);
			if((this._point.x <= tx-Object.width) || (this._point.x >= tx+this.width) ||
					(this._point.y <= ty-Object.height) || (this._point.y >= ty+this.height)) {
				return false;
			}
			return true;
		},

		overlapsPoint: function(X, Y, PerPixel)
		{
			PerPixel = (PerPixel === undefined) ? false : PerPixel;
			X = X + FlxU.floor(FlxG.scroll.x);
			Y = Y + FlxU.floor(FlxG.scroll.y);
			this.getScreenXY(this._point);
			if((X <= this._point.x) || (X >= this._point.x+this.width) ||
					(Y <= this._point.y) || (Y >= this._point.y+this.height)) {
				return false;
			}
			return true;
		},

		collide: function(Obj)
		{
			return FlxU.collide(this, ((Obj === undefined) ? this : Obj));
		},

		preCollide: function(Obj)
		{
			//Most objects don't have to do anything here.
		},

		hitLeft: function(Contact,Velocity)
		{
			this.hitSide(Contact,Velocity);
		},

		hitRight: function(Contact, Velocity)
		{
			this.hitSide(Contact,Velocity);
		},

		hitSide: function(Contact, Velocity)
		{
			if(!this.fixed || (Contact.fixed && ((this.velocity.y != 0) || (this.velocity.x != 0))))
				this.velocity.x = Velocity;
		},

		hitTop: function(Contact,Velocity)
		{
			if(!this.fixed || (Contact.fixed && ((this.velocity.y != 0) || (this.velocity.x != 0))))
				this.velocity.y = Velocity;
		},

		hitBottom: function(Contact, Velocity)
		{
			this.onFloor = true;
			if(!this.fixed || (Contact.fixed && ((this.velocity.y != 0) || (this.velocity.x != 0))))
				this.velocity.y = Velocity;
		},

		//NOTE: I have no idea what you do with a "virtual" function
		hurt: function(Damage)
		{
			this.health = this.health - Damage;
			if(this.health <= 0)
				this.kill();
		},

		kill: function()
		{
			this.exists = false;
			this.dead = true;
		},

		flicker: function(Duration) {
			Duration = (Duration === undefined) ? 1 : Duration;
			this._flickerTimer = Duration;
			if (this._flickerTimer < 0) { this._flicker = false; this.visible = true; }
		},

		flickering: function() { return this._flickerTimer >= 0; },

		getScreenXY: function(Point)
		{
			if(Point == null) Point = new FlxPoint();
			Point.x = FlxU.floor(this.x + FlxU.roundingError)+FlxU.floor(FlxG.scroll.x*this.scrollFactor.x);
			Point.y = FlxU.floor(this.y + FlxU.roundingError)+FlxU.floor(FlxG.scroll.y*this.scrollFactor.y);
			return Point;
		},

		onScreen: function()
		{
			this.getScreenXY(this._point);
			if((this._point.x + this.width < 0) || (this._point.x > FlxG.width) ||
					(this._point.y + this.height < 0) || (this._point.y > FlxG.height)) {
				return false;
			}
			return true;
		},

		reset: function(X, Y)
		{
			this.x = X;
			this.y = Y;
			this.exists = true;
			this.dead = false;
		},

		getBoundingColor: function()
		{
			if(this.solid)
			{
				if(this.fixed)
					return 0x7f00f225;
				else
					return 0x7fff0012;
			}
			else
				return 0x7f0090e9;
		}

});

FlxObject._pZero = new FlxPoint();

FlxAnim = new Class({

	initialize: function (Name, Frames, FrameRate, Looped) {
		FrameRate = (FrameRate === undefined) ? 0 : FrameRate;
		Looped = (Looped === undefined) ? true : Looped;
		this.name = Name;
		this.delay = 0;
		if(FrameRate > 0)
			this.delay = 1.0/FrameRate;
		this.frames = Frames;
		this.looped = Looped;
	}

});

FlxState = new Class({

	initialize: function() {
		this.defaultGroup = new FlxGroup();
		if(FlxState.screen === undefined || FlxState.screen === null) {
			FlxState.screen = new FlxSprite();
			FlxState.screen.createGraphic(FlxG.width,FlxG.height,0,true);
			FlxState.screen.origin.x = FlxState.screen.origin.y = 0;
			FlxState.screen.antialiasing = true;
			FlxState.screen.exists = false;
			FlxState.screen.solid = false;
			FlxState.screen.fixed = true;
		}
	},

	create: function() {
	},

	add: function(Core) {
		return this.defaultGroup.add(Core);
	},

	preProcess: function() {
		//FIXME: This somehow causes the screen FlxSprite's _pixels to become null
		//FlxState.screen.fill(FlxState.bgColor);
	},

	update: function() {
		this.defaultGroup.update();
	},

	collide: function() {
		FlxU.collide(this.defaultGroup, this.defaultGroup);
	},

	render: function() {
		this.defaultGroup.render();
	},

	postProcess: function() {
	},

	destroy: function() {
		this.defaultGroup.destroy();
	}

});

FlxGroup = new Class({

	Extends: FlxObject,

	initialize: function() {
		this.parent();
		this._group = true;
		this.solid = false;
		this.members = new Array();
		this._last = new FlxPoint();
		this._first = true;
	},

	add: function (Obj,ShareScroll)
	{
		ShareScroll = (ShareScroll === undefined) ? false : ShareScroll;
		if (this.members.indexOf(Obj) < 0)
			this.members[this.members.length] = Obj;
		if(ShareScroll)
			Obj.scrollFactor = this.scrollFactor;
		return Obj;
	},

	replace: function(OldObject, NewObject)
	{
		var index = this.members.indexOf(OldObject);
		if((index < 0) || (index >= this.members.length))
			return null;
		this.members[index] = NewObject;
		return NewObject;
	},

	remove: function(Obj,Splice)
	{
		Splice = (Splice === undefined) ? false : Splice;
		var index = this.members.indexOf(Obj);
		if((index < 0) || (index >= this.members.length))
			return null;
		if(Splice)
			this.members.splice(index,1);
		else
			this.members[index] = null;
		return Obj;
	},

	sort: function(Index,Order)
	{
		Index = (Index === undefined) ? "y" : Index;
		Order = (Order === undefined) ? FlxGroup.ASCENDING : Order;
		this._sortIndex = Index;
		this._sortOrder = Order;
		this.members.sort(this.sortHandler);
	},

	getFirstAvail: function()
	{
		var i = 0;
		var o;
		var ml = this.members.length;
		while(i < ml)
		{
			o = this.members[i++];
			if((o != undefined) && !o.exists)
				return o;
		}
		return null;
	},

	getFirstNull: function()
	{
		var i = 0;
		var ml = this.members.length;
		while(i < ml)
		{
			if(this.members[i] == undefined)
				return i;
			else
				i++;
		}
		return -1;
	},

	resetFirstAvail: function(X, Y)
	{
		X = (X === undefined) ? 0 : X;
		Y = (Y === undefined) ? 0 : Y;
		var o = getFirstAvail();
		if(o == null)
			return false;
		o.reset(X,Y);
		return true;
	},

	getFirstExtant: function()
	{
		var i = 0;
		var o;
		var ml = this.members.length;
		while(i < ml)
		{
			o = this.members[i++];
			if((o != null) && o.exists)
				return o;
		}
		return null;
	},

	getFirstAlive: function()
	{
		var i = 0;
		var o;
		var ml = this.members.length;
		while(i < ml)
		{
			o = this.members[i++];
			if((o != null) && o.exists && !o.dead)
				return o;
		}
		return null;
	},

	getFirstDead: function()
	{
		var i= 0;
		var o;
		var ml = this.members.length;
		while(i < ml)
		{
			o = this.members[i++];
			if((o != null) && o.dead)
				return o;
		}
		return null;
	},

	countLiving: function()
	{
		var count = -1;
		var i = 0;
		var o;
		var ml = this.members.length;
		while(i < ml)
		{
			o = this.members[i++];
			if(o != null)
			{
				if(count < 0)
					count = 0;
				if(o.exists && !o.dead)
					count++;
			}
		}
		return count;
	},

	countDead: function()
	{
		var count = -1;
		var i = 0;
		var o;
		var ml = this.members.length;
		while(i < ml)
		{
			o = this.members[i++];
			if(o != null)
			{
				if(count < 0)
					count = 0;
				if(o.dead)
					count++;
			}
		}
		return count;
	},

	countOnScreen: function()
	{
		var count= -1;
		var i = 0;
		var o;
		var ml = this.members.length;
		while(i < ml)
		{
			o = this.members[i++];
			if(o != null)
			{
				if(count < 0)
					count = 0;
				if(o.onScreen())
					count++;
			}
		}
		return count;
	},

	getRandom: function()
	{
		var c = 0;
		var o = null;
		var l = this.members.length;
		var i = Math.floor(FlxU.random()*l);
		while((o === null || o === undefined) && (c < this.members.length))
		{
			o = this.members[(++i)%l];
			c++;
		}
		return o;
	},

	saveOldPosition: function()
	{
		if(this._first)
		{
			this._first = false;
			this._last.x = 0;
			this._last.y = 0;
			return;
		}
		this._last.x = this.x;
		this._last.y = this.y;
	},

	updateMembers: function()
	{
		var mx;
		var my;
		var moved = false;
		if((this.x != this._last.x) || (this.y != this._last.y))
		{
			moved = true;
			mx = this.x - this._last.x;
			my = this.y - this._last.y;
		}
		var i = 0;
		var o;
		var ml = this.members.length;
		while(i < ml)
		{
			o = this.members[i++];
			if((o != null) && o.exists)
			{
				if(moved)
				{
					if(o._group)
						o.reset(o.x+mx,o.y+my);
					else
					{
						o.x += mx;
						o.y += my;
					}
				}
				if(o.active)
					o.update();
				if(moved && o.solid)
				{
					o.colHullX.width += ((mx>0)?mx:-mx);
					if(mx < 0)
						o.colHullX.x += mx;
					o.colHullY.x = this.x;
					o.colHullY.height += ((my>0)?my:-my);
					if(my < 0)
						o.colHullY.y += my;
					o.colVector.x += mx;
					o.colVector.y += my;
				}
			}
		}
	},

	update: function()
	{
		this.saveOldPosition();
		this.updateMotion();
		this.updateMembers();
		this.updateFlickering();
	},

	renderMembers: function()
	{
		var i = 0;
		var o;
		var ml = this.members.length;
		while(i < ml)
		{
			o = this.members[i++];
			if((o != null) && o.exists && o.visible)
				o.render();
		}
	},

	render: function()
	{
		this.renderMembers();
	},

	killMembers: function()
	{
		var i = 0;
		var o;
		var ml = this.members.length;
		while(i < ml)
		{
			o = this.members[i++];
			if(o != null)
				o.kill();
		}
	},

	kill: function()
	{
		this.killMembers();
		this.parent();
	},

	destroyMembers: function()
	{
		var i = 0;
		var o;
		var ml = this.members.length;
		while(i < ml)
		{
			o = members[i++];
			if(o != null)
				o.destroy();
		}
		this.members.length = 0;
	},

	destroy: function()
	{
		this.destroyMembers();
		this.parent();
	},

	reset: function(X,Y)
	{
		this.saveOldPosition();
		this.parent(X,Y);
		var mx;
		var my;
		var moved = false;
		if((this.x != this._last.x) || (this.y != this._last.y))
		{
			moved = true;
			mx = this.x - this._last.x;
			my = this.y - this._last.y;
		}
		var i = 0;
		var o;
		var ml = this.members.length;
		while(i < ml)
		{
			o = members[i++];
			if((o != null) && o.exists)
			{
				if(moved)
				{
					if(o._group)
						o.reset(o.x+mx,o.y+my);
					else
					{
						o.x += mx;
						o.y += my;
						if(this.solid)
						{
							o.colHullX.width += ((mx>0)?mx:-mx);
							if(mx < 0)
								o.colHullX.x += mx;
							o.colHullY.x = this.x;
							o.colHullY.height += ((my>0)?my:-my);
							if(my < 0)
								o.colHullY.y += my;
							o.colVector.x += mx;
							o.colVector.y += my;
						}
					}
				}
			}
		}
	},

	sortHandler: function(Obj1,Obj2)
	{
		if(Obj1[this._sortIndex] < Obj2[this._sortIndex])
			return this._sortOrder;
		else if(Obj1[this._sortIndex] > Obj2[this._sortIndex])
			return -this._sortOrder;
		return 0;
	}
});

FlxGroup.ASCENDING = FlxGroup.prototype.ASCENDING = -1;
FlxGroup.DESCENDING = FlxGroup.prototype.DESCENDING = 1;

FlxTilemap = new Class({

	Extends: FlxObject,

	initialize: function() {
		this.parent();
		this.auto = FlxTilemap.OFF;
		this.collideIndex = 1;
		this.startingIndex = 0;
		this.drawIndex = 1;
		this.widthInTiles = 0;
		this.heightInTiles = 0;
		this.totalTiles = 0;
		this._buffer = null;
		this._bufferLoc = new FlxPoint();
		this._flashRect2 = new Rectangle();
		this._flashRect = this._flashRect2;
		this._data = null;
		this._tileWidth = 0;
		this._tileHeight = 0;
		this._rects = null;
		this._pixels = null;
		this._block = new FlxObject();
		this._block.width = this._block.height = 0;
		this._block.fixed = true;
		this._callbacks = new Array();
		this.fixed = true;

		//NOTE: This class overrides FlxObject setters but not getters
		this.__defineSetter__("fixed", this.setFixed);
		this.__defineSetter__("solid", this.setSolid);
	},

	//TODO: Figure out what to do about TileGraphic (a class in AS3) and FlxG.addBitmap's use of it
	loadMap: function(MapData, TileGraphic, TileWidth, TileHeight) {

		TileWidth = isNaN(TileWidth) ? 0 : TileWidth;
		TileHeight = isNaN(TileHeight) ? 0 : TileHeight;

		this.refresh = true;

		TileGraphic = TileGraphic.clone();
		
		//Figure out the map dimensions based on the data string
		var cols;
		var rows = MapData.split("\n");
		this.heightInTiles = rows.length;
		this._data = new Array();
		var r = 0;
		var c;
		while(r < this.heightInTiles)
		{
			cols = rows[r++].split(",");
			if(cols.length <= 1)
			{
				this.heightInTiles--;
				continue;
			}
			if(this.widthInTiles == 0)
				this.widthInTiles = cols.length;
			c = 0;
			while(c < this.widthInTiles)
				this._data.push(Math.floor(cols[c++]));
		}
		
		//Pre-process the map data if it's auto-tiled
		var i;
		this.totalTiles = this.widthInTiles * this.heightInTiles;
		if(this.auto > FlxTilemap.OFF)
		{
			this.collideIndex = this.startingIndex = this.drawIndex = 1;
			i = 0;
			while(i < this.totalTiles)
				this.autoTile(i++);
		}
		
		//Figure out the size of the tiles
		this._pixels = FlxG.addBitmap(TileGraphic);
		this._tileWidth = TileWidth;
		if(this._tileWidth == 0)
			this._tileWidth = this._pixels.height;
		this._tileHeight = TileHeight;
		if(this._tileHeight == 0)
			this._tileHeight = this._tileWidth;
		this._block.width = this._tileWidth;
		this._block.height = this._tileHeight;
		
		//Then go through and create the actual map
		this.width = this.widthInTiles * this._tileWidth;
		this.height = this.heightInTiles * this._tileHeight;
		this._rects = new Array(this.totalTiles);
		i = 0;
		while(i < this.totalTiles)
			this.updateTile(i++);
		
		//Also need to allocate a buffer to hold the rendered tiles
		var bw = (FlxU.ceil(FlxG.width / this._tileWidth) + 1) * this._tileWidth;
		var bh = (FlxU.ceil(FlxG.height / this._tileHeight) + 1) * this._tileHeight;
		this._buffer = new BitmapData(bw,bh,true,0);
		
		//Pre-set some helper variables for later
		this._screenRows = Math.ceil(FlxG.height / this._tileHeight)+1;
		if(this._screenRows > this.heightInTiles)
			this._screenRows = this.heightInTiles;
		this._screenCols = Math.ceil(FlxG.width / this._tileWidth)+1;
		if(this._screenCols > this.widthInTiles)
			this._screenCols = this.widthInTiles;

		//FIXME: This is not how we'll be handling TileGraphic
		this._bbKey = Math.random(); //String(TileGraphic);
		this.generateBoundingTiles();
		this.refreshHulls();
		
		this._flashRect.x = 0;
		this._flashRect.y = 0;
		this._flashRect.width = this._buffer.width;
		this._flashRect.height = this._buffer.height;
		
		return this;
	},

	generateBoundingTiles: function() {

		this.refresh = true;
		
		if((this._bbKey == null) || (this._bbKey.length <= 0))
			return;
		
		//Check for an existing version of this bounding boxes tilemap
		var bbc = this.getBoundingColor();
		var key = this._bbKey + ":BBTILES" + bbc;
		var skipGen = FlxG.checkBitmapCache(key);
		this._bbPixels = FlxG.createBitmap(this._pixels.width, this._pixels.height, 0, true, key);
		if(!skipGen)
		{
			//Generate a bounding boxes tilemap for this color
			this._flashRect.width = this._pixels.width;
			this._flashRect.height = this._pixels.height;
			this._flashPoint.x = 0;
			this._flashPoint.y = 0;
			
			this._bbPixels.copyPixels(this._pixels,this._flashRect,this._flashPoint);
			this._flashRect.width = this._tileWidth;
			this._flashRect.height = this._tileHeight;
			
			//Check for an existing non-collide bounding box stamp
			var ov = this._solid;
			this._solid = false;
			bbc = this.getBoundingColor();
			key = "BBTILESTAMP"+ this._tileWidth + "X" + this._tileHeight + bbc;
			skipGen = FlxG.checkBitmapCache(key);
			var stamp1 = FlxG.createBitmap(this._tileWidth, this._tileHeight, 0, true, key);
			if(!skipGen)
			{
				//Generate a bounding boxes stamp for this color
				stamp1.fillRect(this._flashRect, bbc);
				this._flashRect.x = this._flashRect.y = 1;
				this._flashRect.width = this._flashRect.width - 2;
				this._flashRect.height = this._flashRect.height - 2;
				stamp1.fillRect(this._flashRect, 0);
				this._flashRect.x = this._flashRect.y = 0;
				this._flashRect.width = this._tileWidth;
				this._flashRect.height = this._tileHeight;
			}
			this._solid = ov;
			
			//Check for an existing collide bounding box
			bbc = this.getBoundingColor();
			key = "BBTILESTAMP" + this._tileWidth + "X" + this._tileHeight + bbc;
			skipGen = FlxG.checkBitmapCache(key);
			var stamp2 = FlxG.createBitmap(this._tileWidth, this._tileHeight, 0, true, key);
			if(!skipGen)
			{
				//Generate a bounding boxes stamp for this color
				stamp2.fillRect(this._flashRect, bbc);
				this._flashRect.x = this._flashRect.y = 1;
				this._flashRect.width = this._flashRect.width - 2;
				this._flashRect.height = this._flashRect.height - 2;
				stamp2.fillRect(this._flashRect,0);
				this._flashRect.x = this._flashRect.y = 0;
				this._flashRect.width = this._tileWidth;
				this._flashRect.height = this._tileHeight;
			}
			
			//Stamp the new tile bitmap with the bounding box border
			var r = 0;
			var c;
			var i = 0;
			while(r < this._bbPixels.height)
			{
				c = 0;
				while(c < this._bbPixels.width)
				{
					this._flashPoint.x = c;
					this._flashPoint.y = r;
					if(i++ < this.collideIndex)
						this._bbPixels.copyPixels(stamp1,this._flashRect,this._flashPoint,null,null,true);
					else
						this._bbPixels.copyPixels(stamp2,this._flashRect,this._flashPoint,null,null,true);
					c += this._tileWidth;
				}
				r += this._tileHeight;
			}
			
			this._flashRect.x = 0;
			this._flashRect.y = 0;
			this._flashRect.width = this._buffer.width;
			this._flashRect.height = this._buffer.height;
		}
	},

	renderTilemap: function() {

		this._buffer.fillRect(this._flashRect,0);
		
		//Bounding box display options
		var tileBitmap;
		if(FlxG.showBounds)
		{
			tileBitmap = this._bbPixels;
			this._boundsVisible = true;
		}
		else
		{
			tileBitmap = this._pixels;
			this._boundsVisible = false;
		}
		
		//Copy tile images into the tile buffer
		this.getScreenXY(this._point);
		this._flashPoint.x = this._point.x;
		this._flashPoint.y = this._point.y;
		var tx = Math.floor(-this._flashPoint.x/this._tileWidth);
		var ty = Math.floor(-this._flashPoint.y/this._tileHeight);
		if(tx < 0) tx = 0;
		if(tx > this.widthInTiles - this._screenCols) { tx = this.widthInTiles - this._screenCols };
		if(ty < 0) ty = 0;
		if(ty > this.heightInTiles - this._screenRows) { ty = this.heightInTiles - this._screenRows; }
		var ri = ty * this.widthInTiles + tx;
		this._flashPoint.y = 0;
		var r = 0;
		var c;
		var cri;
		while(r < this._screenRows)
		{
			cri = ri;
			c = 0;
			this._flashPoint.x = 0;
			while(c < this._screenCols)
			{
				this._flashRect = this._rects[cri++];
				if( (this._flashRect != null)) 
					this._buffer.copyPixels(tileBitmap,this._flashRect,this._flashPoint,null,null,true);
				this._flashPoint.x += this._tileWidth;
				c++;
			}
			ri += this.widthInTiles;
			this._flashPoint.y += this._tileHeight;
			r++;
		}
		this._flashRect = this._flashRect2;
		this._bufferLoc.x = tx * this._tileWidth;
		this._bufferLoc.y = ty * this._tileHeight;
	},

	update: function() {

		this.parent();
		this.getScreenXY(this._point);
		this._point.x += this._bufferLoc.x;
		this._point.y += this._bufferLoc.y;
		if((this._point.x > 0) || (this._point.y > 0) || (this._point.x + this._buffer.width < FlxG.width) || (this._point.y + this._buffer.height < FlxG.height)) {
			this.refresh = true;
		}
	},

	render: function() {
		if(FlxG.showBounds != this._boundsVisible)
			this.refresh = true;
		
		//Redraw the tilemap buffer if necessary
		if(this.refresh)
		{
			this.renderTilemap();
			this.refresh = false;
		}
		
		//Render the buffer no matter what
		this.getScreenXY(this._point);
		this._flashPoint.x = this._point.x + this._bufferLoc.x;
		this._flashPoint.y = this._point.y + this._bufferLoc.y;
		FlxG.buffer.copyPixels(this._buffer,this._flashRect,this._flashPoint,null,null,true);
	},

	setSolid: function(Solid) {
		this.parent(Solid);

		var os = this._solid;
		this._solid = Solid;
		if(os != this._solid)
			this.generateBoundingTiles();
	},

	setFixed: function(Fixed) {
		this.parent(Fixed);

		var of = this._fixed;
		this._fixed = Fixed;
		if(of != this._fixed)
			this.generateBoundingTiles();
	},

	overlaps: function(Core) {

		var d;
		
		var dd;
		var blocks = new Array();
		
		//First make a list of all the blocks we'll use for collision
		var ix = Math.floor((Core.x - this.x) / this._tileWidth);
		var iy = Math.floor((Core.y - this.y) / this._tileHeight);
		var iw = Math.ceil(Core.width / this._tileWidth) + 1;
		var ih = Math.ceil(Core.height / this._tileHeight) + 1;
		var r = 0;
		var c;
		while(r < ih)
		{
			if(r >= this.heightInTiles) break;
			d = (iy+r)*this.widthInTiles+ix;
			c = 0;
			while(c < iw)
			{
				if(c >= this.widthInTiles) break;
				dd = Math.floor(this._data[d+c]); //NOTE "as uint" cast
				if(dd >= this.collideIndex)
					blocks.push({
						x : this.x + (ix+c) * this._tileWidth,
						y : this.y + (iy+r) * this._tileHeight,
						data : dd
					});
				c++;
			}
			r++;
		}
		
		//Then check for overlaps
		var bl = blocks.length;
		var hx = false;
		var i = 0;
		while(i < bl)
		{
			this._block.x = blocks[i].x;
			this._block.y = blocks[i++].y;
			if(this._block.overlaps(Core))
				return true;
		}
		return false;
	},

	overlapsPoint: function(X, Y,PerPixel) {
		PerPixel = (PerPixel === undefined) ? false : PerPixel;
		//NOTE: Expanded this for readability. Also, Math.floor actually uint casts
		var t = getTile(
				Math.floor( (X-this.x) / this._tileWidth ),
				Math.floor( (Y-this.y) / this._tileHeight)
		);
		return  t >= this.collideIndex;
	},

	refreshHulls: function()
	{
		this.colHullX.x = 0;
		this.colHullX.y = 0;
		this.colHullX.width = this._tileWidth;
		this.colHullX.height = this._tileHeight;
		this.colHullY.x = 0;
		this.colHullY.y = 0;
		this.colHullY.width = this._tileWidth;
		this.colHullY.height = this._tileHeight;
	},

	preCollide: function(Obj)
	{
		//Collision fix, in case updateMotion() is called
		this.colHullX.x = 0;
		this.colHullX.y = 0;
		this.colHullY.x = 0;
		this.colHullY.y = 0;
		
		var r;
		var c;
		var rs;
		var col = 0;
		var ix = FlxU.floor((Obj.x - this.x)/this._tileWidth);
		var iy = FlxU.floor((Obj.y - this.y)/this._tileHeight);
		var iw = ix + FlxU.ceil(Obj.width/this._tileWidth)+1;
		var ih = iy + FlxU.ceil(Obj.height/this._tileHeight)+1;
		if(ix < 0)
			ix = 0;
		if(iy < 0)
			iy = 0;
		if(iw > this.widthInTiles)
			iw = this.widthInTiles;
		if(ih > this.heightInTiles)
			ih = this.heightInTiles;
		rs = iy * this.widthInTiles;
		r = iy;
		while(r < ih)
		{
			c = ix;
			while(c < iw)
			{
				if(Math.floor(this._data[rs+c]) >= this.collideIndex) //NOTE as uint cast on _data[rs+c]
					this.colOffsets[col++] = new FlxPoint(this.x + c * this._tileWidth, this.y + r * this._tileHeight);
				c++;
			}
			rs += this.widthInTiles;
			r++;
		}
		if(this.colOffsets.length != col)
			this.colOffsets.length = col;
	},

	getTile: function(X, Y)
	{
		return this.getTileByIndex(Y * this.widthInTiles + X);
	},

	getTileByIndex: function(Index)
	{
		return this._data[Index];
	},

	setTile: function(X, Y, Tile, UpdateGraphics)
	{
		UpdateGraphics = (UpdateGraphics === undefined) ? true : UpdateGraphics;
		if((X >= this.widthInTiles) || (Y >= this.heightInTiles))
			return false;
		return this.setTileByIndex(Y * this.widthInTiles + X,Tile,UpdateGraphics);
	},

	setTileByIndex: function(Index, Tile, UpdateGraphics)
	{
		UpdateGraphics = (UpdateGraphics === undefined) ? true : UpdateGraphics;
		if(Index >= this._data.length)
			return false;
		
		var ok = true;
		this._data[Index] = Tile;
		
		if(!UpdateGraphics)
			return ok;
		
		this.refresh = true;
		
		if(this.auto == FlxTilemap.OFF)
		{
			this.updateTile(Index);
			return ok;
		}
		
		//If this map is autotiled and it changes, locally update the arrangement
		var i;
		var r = Math.floor(Index/this.widthInTiles) - 1; //NOTE: int cast
		var rl = r + 3;
		var c = Index % this.widthInTiles - 1;
		var cl = c + 3;
		while(r < rl)
		{
			c = cl - 3;
			while(c < cl)
			{
				if((r >= 0) && (r < this.heightInTiles) && (c >= 0) && (c < this.widthInTiles))
				{
					i = r * this.widthInTiles + c;
					this.autoTile(i);
					this.updateTile(i);
				}
				c++;
			}
			r++;
		}
		
		return ok;
	},

	setCallback: function(Tile, Callback, Range) {
		//NO CODE. "temporarily deprecated" in Flixel
	},

	follow: function(Border)
	{
		Border = isNaN(Border) ? 0 : Border;
		FlxG.followBounds(
				this.x + Border * this._tileWidth,
				this.y + Border * this._tileHeight,
				this.width - Border * this._tileWidth,
				this.height - Border * this._tileHeight
		);
	},

	ray: function(StartX, StartY, EndX, EndY, Result, Resolution) {
		Resolution = (Resolution === undefined) ? 1 : Resolution;

		var step = this._tileWidth;
		if(this._tileHeight < this._tileWidth) { step = this._tileHeight; }
		step /= Resolution;
		var dx = EndX - StartX;
		var dy = EndY - StartY;
		var distance = Math.sqrt(dx*dx + dy*dy);
		var steps = Math.ceil(distance/step);
		var stepX = dx/steps;
		var stepY = dy/steps;
		var curX = StartX - stepX;
		var curY = StartY - stepY;
		var tx;
		var ty;
		var i = 0;
		while(i < steps)
		{
			curX += stepX;
			curY += stepY;
			
			if((curX < 0) || (curX > width) || (curY < 0) || (curY > height))
			{
				i++;
				continue;
			}
			
			tx = curX/this._tileWidth;
			ty = curY/this._tileHeight;
			if((Math.floor(this._data[ty*this.widthInTiles+tx])) >= this.collideIndex) //NOTE: uint cast on lefthand part
			{
				//Some basic helper stuff
				tx *= this._tileWidth;
				ty *= this._tileHeight;
				var rx = 0;
				var ry = 0;
				var q;
				var lx = curX-stepX;
				var ly = curY-stepY;
				
				//Figure out if it crosses the X boundary
				q = tx;
				if(dx < 0)
					q += this._tileWidth;
				rx = q;
				ry = ly + stepY*((q-lx)/stepX);
				if((ry > ty) && (ry < ty + this._tileHeight))
				{
					if(Result === undefined)
						Result = new FlxPoint();
					Result.x = rx;
					Result.y = ry;
					return true;
				}
				
				//Else, figure out if it crosses the Y boundary
				q = ty;
				if(dy < 0)
					q += this._tileHeight;
				rx = lx + stepX*((q-ly)/stepY);
				ry = q;
				if((rx > tx) && (rx < tx + this._tileWidth))
				{
					if(Result === undefined)
						Result = new FlxPoint();
					Result.x = rx;
					Result.y = ry;
					return true;
				}
				return false;
			}
			i++;
		}
		return false;
	},

	//NOTE: arrayToCSV, bitmapToCSV, imageToCSV normally go here,
	//	but they're below the class definition because they're static

	autoTile: function(Index) {

		if(this._data[Index] == 0) return;
		this._data[Index] = 0;
		if((Index-this.widthInTiles < 0) || (this._data[Index-this.widthInTiles] > 0))					//UP
			this._data[Index] += 1;
		if((Index % this.widthInTiles >= this.widthInTiles-1) || (this._data[Index+1] > 0))				//RIGHT
			this._data[Index] += 2;
		if((Index + this.widthInTiles >= this.totalTiles) || (this._data[Index+this.widthInTiles] > 0)) //DOWN
			this._data[Index] += 4;
		if((Index % widthInTiles <= 0) || (this._data[Index-1] > 0))									//LEFT
			this._data[Index] += 8;
		if((this.auto == this.ALT) && (this._data[Index] == 15))	//The alternate algo checks for interior corners
		{
			if((Index % this.widthInTiles > 0) && (Index+this.widthInTiles < this.totalTiles) && (this._data[Index+this.widthInTiles-1] <= 0))
				this._data[Index] = 1;		//BOTTOM LEFT OPEN
			if((Index % this.widthInTiles > 0) && (Index-this.widthInTiles >= 0) && (this._data[Index-this.widthInTiles-1] <= 0))
				this._data[Index] = 2;		//TOP LEFT OPEN
			if((Index % this.widthInTiles < this.widthInTiles-1) && (Index-this.widthInTiles >= 0) && (this._data[Index-this.widthInTiles+1] <= 0))
				this._data[Index] = 4;		//TOP RIGHT OPEN
			if((Index % this.widthInTiles < this.widthInTiles-1) && (Index+this.widthInTiles < this.totalTiles) && (this._data[Index+this.widthInTiles+1] <= 0))
				this._data[Index] = 8; 		//BOTTOM RIGHT OPEN
		}
		this._data[Index] += 1;
	},

	updateTile: function(Index) {
		if(this._data[Index] < this.drawIndex) {
			this._rects[Index] = null;
			return;
		}
		var rx = (this._data[Index] - this.startingIndex) * this._tileWidth;
		var ry = 0;
		if(rx >= this._pixels.width)
		{
			ry = Math.floor(rx / this._pixels.width) * this._tileHeight;
			rx %= this._pixels.width;
		}
		this._rects[Index] = (new Rectangle(rx,ry,this._tileWidth,this._tileHeight));
	}

});

FlxTilemap.OFF =  0;
FlxTilemap.AUTO =  1;
FlxTilemap.ALT = 2;

FlxTilemap.arrayToCSV = function(Data, Width) {

	var r = 0;
	var c;
	var csv = "";
	var Height = Data.length / Width;
	while(r < Height)
	{
		c = 0;
		while(c < Width)
		{
			if(c == 0)
			{
				if(r == 0)
					csv += Data[0];
				else
					csv += "\n"+Data[r*Width];
			}
			else
				csv += ", "+Data[r*Width+c];
			c++;
		}
		r++;
	}
	return csv;
}

FlxTilemap.bitmapToCSV = function(bitmapData, Invert, Scale) {

	Invert = (Invert === undefined) ? false : Invert;
	Scale = (Scale === undefined) ? 1 : Scale;

	//Import and scale image if necessary
	if(Scale > 1)
	{
		var bd = bitmapData;
		bitmapData = new BitmapData(bitmapData.width * Scale, bitmapData.height * Scale);
		var mtx = new Matrix();
		mtx.scale(Scale,Scale);
		bitmapData.draw(bd,mtx);
	}
	
	//Walk image and export pixel values
	var r = 0;
	var c;
	var p;
	var csv;
	var w = bitmapData.width;
	var h = bitmapData.height;
	while(r < h)
	{
		c = 0;
		while(c < w)
		{
			//Decide if this pixel/tile is solid (1) or not (0)
			p = bitmapData.getPixel(c,r);
			if((Invert && (p > 0)) || (!Invert && (p == 0)))
				p = 1;
			else
				p = 0;
			
			//Write the result to the string
			if(c == 0)
			{
				if(r == 0)
					csv += p;
				else
					csv += "\n"+p;
			}
			else
				csv += ", "+p;
			c++;
		}
		r++;
	}
	return csv;
}

//FIXME: Revisit when resource handling is decided
FlxTilemap.imageToCSV = function(ImageFile, Invert, Scale) {
	return bitmapToCSV(ImageFile,Invert,Scale);
}


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

FlxTileblock = new Class({

	Extends: FlxSprite,

	initialize: function(X,Y,Width,Height) {
		this.parent(X,Y);
		this.createGraphic(Width,Height,0,true);		
		this.fixed = true;
	},

	loadTiles: function(TileGraphic, TileWidth, TileHeight, Empties) {

		TileWidth = isNaN(TileWidth) ? 0 : TileWidth;
		TileHeight = isNaN(TileHeight) ? 0 : TileHeight;
		Empties = isNaN(Empties) ? 0 : Empties;

		if(TileGraphic === undefined)
			return this;
		
		//First create a tile brush
		var s = new FlxSprite().loadGraphic(TileGraphic,true,false,TileWidth,TileHeight);
		var sw = s.width;
		var sh = s.height;
		var total = s.frames + Empties;
		
		//Then prep the "canvas" as it were (just doublechecking that the size is on tile boundaries)
		var regen = false;
		if(this.width % s.width != 0)
		{
			this.width = Math.floor(width/sw+1) * sw;
			regen = true;
		}
		if(this.height % s.height != 0)
		{
			this.height = Math.floor(height/sh+1)*sh;
			regen = true;
		}
		if(regen)
			this.createGraphic(this.width,this.height,0,true);
		else
			this.fill(0);
		
		//Stamp random tiles onto the canvas
		var r = 0;
		var c;
		var ox;
		var oy = 0;
		var widthInTiles = this.width/sw;
		var heightInTiles = this.height/sh;
		while(r < heightInTiles)
		{
			ox = 0;
			c = 0;
			while(c < widthInTiles)
			{
				if(FlxU.random() * total > Empties)
				{
					s.randomFrame();
					this.draw(s,ox,oy);
				}
				ox += sw;
				c++;
			}
			oy += sh;
			r++;
		}
		
		return this;
	},

	loadGraphic: function(Graphic, Animated, Reverse, Width, Height, Unique) {
		Animated = (Animated === undefined) ? false : Animated;
		Reverse = (Reverse === undefined) ? false : Reverse;
		Width = isNaN(Width) ? 0 : Width;
		Height = isNaN(Height) ? 0 : Height;
		Unique = (Unique === undefined) ? false : Unique;

		this.loadTiles(Graphic);
		return this;
	}

});

//FIXME: depends on loadGraphic in a few spots

FlxEmitter = new Class({

	Extends: FlxGroup,

	initialize: function(X, Y) {

		X = isNaN(X) ? 0 : X;
		Y = isNaN(Y) ? 0 : Y;

		this.parent();
		
		this.x = X;
		this.y = Y;
		this.width = 0;
		this.height = 0;
			
		this.minParticleSpeed = new FlxPoint(-100,-100);
		this.maxParticleSpeed = new FlxPoint(100,100);
		this.minRotation = -360;
		this.maxRotation = 360;
		this.gravity = 400;
		this.particleDrag = new FlxPoint();
		this.delay = 0;
		this.quantity = 0;
		this._counter = 0;
		this._explode = true;
		this.exists = false;
		this.on = false;
		this.justEmitted = false;
	},

	createSprites: function(Graphics, Quantity, BakedRotations, Multiple, Collide, Bounce) {

		Quantity = isNaN(Quantity) ? 50 : Quantity;
		BakedRotations = isNaN(BakedRotations) ? 16 : BakedRotations;
		Multiple = (Multiple === undefined) ? true : Multiple;
		Collide = isNaN(Collide) ? 0 : Collide;
		Bounce = isNaN(Bounce) ? 0 : Bounce;

		this.members = new Array();
		var r;
		var s;
		var tf = 1;
		var sw;
		var sh;
		if(Multiple)
		{
			s = new FlxSprite();
			s.loadGraphic(Graphics,true);
			tf = s.frames;
		}
		var i = 0;
		while(i < Quantity)
		{
			if((Collide > 0) && (Bounce > 0))
				s = new FlxParticle(Bounce); //NOTE: as FlxSprite cast
			else
				s = new FlxSprite();
			if(Multiple)
			{
				r = FlxU.random()*tf;
				if(BakedRotations > 0)
					s.loadRotatedGraphic(Graphics,BakedRotations,r);
				else
				{
					s.loadGraphic(Graphics,true);
					s.frame = r;
				}
			}
			else
			{
				if(BakedRotations > 0)
					s.loadRotatedGraphic(Graphics,BakedRotations);
				else
					s.loadGraphic(Graphics);
			}
			if(Collide > 0)
			{
				sw = s.width;
				sh = s.height;
				s.width *= Collide;
				s.height *= Collide;
				s.offset.x = (sw-s.width)/2;
				s.offset.y = (sh-s.height)/2;
				s.solid = true;
			}
			else
				s.solid = false;
			s.exists = false;
			s.scrollFactor = scrollFactor;
			add(s);
			i++;
		}
		return this;
	},

	setSize: function(Width,Height)
	{
		this.width = Width;
		this.height = Height;
	},

	setXSpeed: function(Min, Max) {
		Min = isNaN(Min) ? 0 : Min;
		Max = isNaN(Max) ? 0 : Max;

		this.minParticleSpeed.x = Min;
		this.maxParticleSpeed.x = Max;
	},

	setYSpeed: function(Min, Max) {
		Min = isNaN(Min) ? 0 : Min;
		Max = isNaN(Max) ? 0 : Max;

		this.minParticleSpeed.y = Min;
		this.maxParticleSpeed.y = Max;
	},

	setRotation: function(Min, Max) {
		Min = isNaN(Min) ? 0 : Min;
		Max = isNaN(Max) ? 0 : Max;

		this.minRotation = Min;
		this.maxRotation = Max;
	},

	updateEmitter: function() {

		if(this._explode)
		{
			this._timer += FlxG.elapsed;
			if((this.delay > 0) && (this._timer > this.delay))
			{
				this.kill();
				return;
			}
			if(this.on)
			{
				this.on = false;
				var i = this._particle;
				var l = this.members.length;
				if(this.quantity > 0)
					l = this.quantity;
				l += this._particle;
				while(i < l)
				{
					this.emitParticle();
					i++;
				}
			}
			return;
		}
		if(!this.on)
			return;
		this._timer += FlxG.elapsed;
		while((this._timer > this.delay) && ((this.quantity <= 0) || (this._counter < this.quantity)))
		{
			this._timer -= this.delay;
			this.emitParticle();
		}
	},

	updateMembers: function() {
		var o;
		var i = 0;
		var l = this.members.length;
		while(i < l)
		{
			o = this.members[i++];
			if((o !== undefined && o !== null) && o.exists && o.active)
				o.update();
		}
	},

	update: function() {

		this.justEmitted = false;
		this.parent();
		this.updateEmitter();
	},

	start: function(Explode, Delay, Quantity) {

		Explode = (Explode === undefined) ? true : Explode;
		Delay = isNaN(Delay) ? 0 : Delay;
		Quantity = isNaN(Quantity) ? 0 : Quantity;

		if(this.members.length <= 0)
		{
			//FlxG.log("WARNING: there are no sprites loaded in your emitter.\nAdd some to FlxEmitter.members or use FlxEmitter.createSprites().");
			return;
		}
		this._explode = Explode;
		if(!this._explode)
			this._counter = 0;
		if(!this.exists)
			this._particle = 0;
		this.exists = true;
		this.visible = true;
		this.active = true;
		this.dead = false;
		this.on = true;
		this._timer = 0;
		if(this.quantity == 0)
			this.quantity = Quantity;
		else if(Quantity != 0)
			this.quantity = Quantity;
		if(Delay != 0)
			this.delay = Delay;
		if(this.delay < 0)
			this.delay = -this.delay;
		if(this.delay == 0)
		{
			if(Explode)
				this.delay = 3;	//default value for particle explosions
			else
				this.delay = 0.1;//default value for particle streams
		}
	},

	emitParticle: function()
	{
		this._counter++;
		var s = this.members[this._particle];
		s.visible = true;
		s.exists = true;
		s.active = true;
		s.x = this.x - (s.width>>1) + FlxU.random() * this.width;
		s.y = this.y - (s.height>>1) + FlxU.random()* this.height;
		s.velocity.x = this.minParticleSpeed.x;
		if(this.minParticleSpeed.x != this.maxParticleSpeed.x) s.velocity.x += FlxU.random()*(this.maxParticleSpeed.x-this.minParticleSpeed.x);
		s.velocity.y = this.minParticleSpeed.y;
		if(this.minParticleSpeed.y != this.maxParticleSpeed.y) s.velocity.y += FlxU.random()*(this.maxParticleSpeed.y-this.minParticleSpeed.y);
		s.acceleration.y = this.gravity;
		s.angularVelocity = this.minRotation;
		if(this.minRotation != this.maxRotation) s.angularVelocity += FlxU.random()*(this.maxRotation-this.minRotation);
		if(s.angularVelocity != 0) s.angle = FlxU.random()*360-180;
		s.drag.x = this.particleDrag.x;
		s.drag.y = this.particleDrag.y;
		this._particle++;
		if(this._particle >= this.members.length)
			this._particle = 0;
		s.onEmit();
		this.justEmitted = true;
	},

	stop: function(Delay)
	{
		Delay = isNaN(Delay) ? 3 : Delay;

		this._explode = true;
		this.delay = Delay;
		if(this.delay < 0)
			this.delay = -Delay;
		this.on = false;
	},

	at: function(Obj) {
		this.x = Obj.x + Obj.origin.x;
		this.y = Obj.y + Obj.origin.y;
	},

	kill: function() {
		this.parent();
		this.on = false;
	}



});

FlxParticle = new Class({

	Extends: FlxSprite,

	initialize: function(Bounce) {
		this.parent();
		this._bounce = Bounce;
	},

	hitSide: function(Contact, Velocity) {
		this.velocity.x = -this.velocity.x * this._bounce;
		if(this.angularVelocity != 0)
			this.angularVelocity = -this.angularVelocity * this._bounce;
	},

	hitBottom: function(Contact, Velocity)
	{
		this.onFloor = true;
		if(((this.velocity.y > 0) ? this.velocity.y : -this.velocity.y) > this._bounce*100)
		{
			this.velocity.y = -this.velocity.y * this._bounce;
			if(this.angularVelocity != 0)
				this.angularVelocity *= -this._bounce;
		}
		else
		{
			this.angularVelocity = 0;
			this.parent(Contact,Velocity);
		}
		this.velocity.x *= this._bounce;
	}

});

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

FlxKeyboard = new Class({

	Extends: FlxInput,

	initialize: function() {
		this.parent();

		var i;
		
		//LETTERS
		i = 65;
		while(i <= 90)
			this.addKey(String.fromCharCode(i), i++);
		
		//NUMBERS
		i = 48;
		this.addKey("ZERO",i++);
		this.addKey("ONE",i++);
		this.addKey("TWO",i++);
		this.addKey("THREE",i++);
		this.addKey("FOUR",i++);
		this.addKey("FIVE",i++);
		this.addKey("SIX",i++);
		this.addKey("SEVEN",i++);
		this.addKey("EIGHT",i++);
		this.addKey("NINE",i++);
		i = 96;
		this.addKey("NUMPADZERO",i++);
		this.addKey("NUMPADONE",i++);
		this.addKey("NUMPADTWO",i++);
		this.addKey("NUMPADTHREE",i++);
		this.addKey("NUMPADFOUR",i++);
		this.addKey("NUMPADFIVE",i++);
		this.addKey("NUMPADSIX",i++);
		this.addKey("NUMPADSEVEN",i++);
		this.addKey("NUMPADEIGHT",i++);
		this.addKey("NUMPADNINE",i++);
		
		//FUNCTION KEYS
		i = 1;
		while(i <= 12)
			this.addKey("F"+i,111+(i++));
		
		//SPECIAL KEYS + PUNCTUATION
		this.addKey("ESCAPE",27);
		this.addKey("MINUS",189);
		this.addKey("NUMPADMINUS",109);
		this.addKey("PLUS",187);
		this.addKey("NUMPADPLUS",107);
		this.addKey("DELETE",46);
		this.addKey("BACKSPACE",8);
		this.addKey("LBRACKET",219);
		this.addKey("RBRACKET",221);
		this.addKey("BACKSLASH",220);
		this.addKey("CAPSLOCK",20);
		this.addKey("SEMICOLON",186);
		this.addKey("QUOTE",222);
		this.addKey("ENTER",13);
		this.addKey("SHIFT",16);
		this.addKey("COMMA",188);
		this.addKey("PERIOD",190);
		this.addKey("NUMPADPERIOD",110);
		this.addKey("SLASH",191);
		this.addKey("NUMPADSLASH",191);
		this.addKey("CONTROL",17);
		this.addKey("ALT",18);
		this.addKey("SPACE",32);
		this.addKey("UP",38);
		this.addKey("DOWN",40);
		this.addKey("LEFT",37);
		this.addKey("RIGHT",39);
	}

});

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
	//TODO: Ensure that preventing scrolling only applies to in game window
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



//TODO: Make this class!
FlxG = new Class({

	initialize: function() {
		this.LIBRARY_NAME = "JSFlixel";
		this.LIBRARY_MAJOR_VERSION = 0;
		this.LIBRARY_MINOR_VERSION = 1

		this.__defineGetter__("pause", this.getPause);
		this.__defineSetter__("pause", this.setPause);
		this.__defineGetter__("framerate", this.getFramerate);
		this.__defineSetter__("framerate", this.setFramerate);
		this.__defineGetter__("frameratePaused", this.getFrameratePaused);
		this.__defineSetter__("frameratePaused", this.setFrameratePaused);
		this.__defineGetter__("mute", this.getMute);
		this.__defineSetter__("mute", this.setMute);
		this.__defineGetter__("state", this.getState);
		this.__defineSetter__("state", this.setState);

		this._cache = Array();
	},

	log: function(Data)
	{
		if((this._game != null) && (this._game._console != null))
			this._game._console.log((Data === undefined) ? "ERROR: nothing to log" : Data);
	},

	getPause: function() {
		return this._pause;
	},

	setPause: function(Pause)
	{
		var op = this._pause;
		this._pause = Pause;
		if(this._pause != op)
		{
			if(this._pause)
			{
				this._game.pauseGame();
				this.pauseSounds();
			}
			else
			{
				this._game.unpauseGame();
				this.playSounds();
			}
		}
	},

	//TODO: Fix all 4 of these framerate methods so they make sense for Javascript
	//		We don't have a stage and nothing automatically manages framerate
	getFramerate: function() {
		return this._game._framerate;
	},
	
	setFramerate: function(Framerate) {
		this._game._framerate = Framerate;
		if(!this._game._paused && (this._game.stage != null))
			this._game.stage.frameRate = Framerate;
	},
	
	getFrameratePaused: function() {
		return this._game._frameratePaused;
	},
	
	setFrameratePaused: function(Framerate) {
		this._game._frameratePaused = Framerate;
		if(this._game._paused && (this._game.stage != null))
			this._game.stage.frameRate = Framerate;
	},

	resetInput: function() {
		this.keys.reset();
		this.mouse.reset();
		var i = 0;
		var l = this.gamepads.length;
		while(i < l)
			this.gamepads[i++].reset();
	},

	//FIXME: None of these will do anything for a while. Rework sound system completely
	//		Need both asset loading finished, and <audio> API stuff figured out
	playMusic: function(Music, Volume) {
		Volume = isNaN(Volume) ? 1.0 : Volume;

		if(this.music === undefined)
			this.music = new FlxSound();
		else if(this.music.active)
			this.music.stop();
		this.music.loadEmbedded(Music,true);
		this.music.volume = Volume;
		this.music.survive = true;
		this.music.play();
	},

	play: function(EmbeddedSound, Volume, Looped) {
		Volume = isNaN(Volume) ? 1.0 : Volume;
		Looped = (Looped === undefined) ?  true : Looped;

		var i = 0;
		var sl = this.sounds.length;
		while(i < sl)
		{
			if(!(this.sounds[i]).active)
				break;
			i++;
		}
		if(this.sounds[i] === undefined)
			this.sounds[i] = new FlxSound();
		var s = this.sounds[i];
		s.loadEmbedded(EmbeddedSound,Looped);
		s.volume = Volume;
		s.play();
		return s;
	},

	stream: function(URL, Volume, Looped) {

		Volume = isNaN(Volume) ? 1.0 : Volume;
		Looped = (Looped === undefined) ?  true : Looped;

		var i = 0;
		var sl = this.sounds.length;
		while(i < sl)
		{
			if(!(this.sounds[i]).active)
				break;
			i++;
		}
		if(this.sounds[i] === undefined)
			this.sounds[i] = new FlxSound();
		var s = this.sounds[i];
		s.loadStream(URL,Looped);
		s.volume = Volume;
		s.play();
		return s;
	},

	getMute: function() {
		return this._mute;
	},
	
	setMute: function(Mute) {
		this._mute = Mute;
		this.changeSounds();
	},

	//NOTE: IMO this should just be a getter, but that will break compatibility. Later....
	getMuteValue: function() {
		if(this._mute)
			return 0;
		else
			return 1;
	},

	getVolume: function() { return this._volume; },
	 
	setVolume: function(Volume) {
		this._volume = Volume;
		if(this._volume < 0)
			this._volume = 0;
		else if(this._volume > 1)
			this._volume = 1;
		this.changeSounds();
	},

	destroySounds: function(ForceDestroy) {

		ForceDestroy = (ForceDestroy === undefined) ? false : ForceDestroy;

		if(this.sounds === undefined)
			return;
		if((this.music !== undefined) && (ForceDestroy || !this.music.survive))
			this.music.destroy();
		var i = 0;
		var s;
		var sl = this.sounds.length;
		while(i < sl)
		{
			s = this.sounds[i++];
			if((s !== undefined) && (ForceDestroy || !s.survive))
				s.destroy();
		}
	},

	changeSounds: function()
	{
		if((this.music !== undefined) && this.music.active)
			this.music.updateTransform();
		var i = 0;
		var s;
		var sl = this.sounds.length;
		while(i < sl)
		{
			s = this.sounds[i++];
			if((s !== undefined) && s.active)
				s.updateTransform();
		}
	},

	updateSounds: function()
	{
		if((this.music !== undefined) && this.music.active)
			this.music.update();
		var i = 0;
		var s;
		var sl = this.sounds.length;
		while(i < sl)
		{
			s = this.sounds[i++];
			if((s !== undefined) && s.active)
				s.update();
		}
	},
	
	pauseSounds: function()
	{
		if((this.music !== undefined) && this.music.active)
			this.music.pause();
		var i = 0;
		var s;
		var sl = this.sounds.length;
		while(i < sl)
		{
			s = sounds[i++];
			if((s !== undefined) && s.active)
				s.pause();
		}
	},
	
	playSounds: function()
	{
		if((this.music !== undefined) && this.music.active)
			this.music.play();
		var i = 0;
		var s;
		var sl = this.sounds.length;
		while(i < sl)
		{
			s = this.sounds[i++];
			if((s !== undefined) && s.active)
				s.play();
		}
	},

	checkBitmapCache: function(Key)
	{
		return (this._cache[Key] !== undefined) && (this._cache[Key] !== null);
	},

	createBitmap: function(Width, Height, Color, Unique, Key) {

		Unique = (Unique === undefined) ? false : Unique;
		Key = (Key === undefined) ? null : Key;

		var key = Key;
		if(key === null || key === undefined)
		{
			key = Width + "x" + Height + ":" + Color;
			if(Unique && (this._cache[key] !== undefined) && (this._cache[key] !== null))
			{
				//Generate a unique key
				var inc = 0;
				var ukey;
				do { ukey = key + inc++;
				} while((this._cache[ukey] !== undefined) && (this._cache[ukey] !== null));
				key = ukey;
			}
		}
		if(!this.checkBitmapCache(key))
			this._cache[key] = new BitmapData(Width,Height,true,Color);
		return this._cache[key];
	},

	addBitmap: function(Graphic, Reverse, Unique, Key) {

		Reverse = (Reverse === undefined) ? false : Reverse;
		Unique = (Unique === undefined) ? false : Unique;
		Key = (Key === undefined) ? null : Key;

		Graphic = Graphic.clone();

		var needReverse = false;
		var key = Key = Math.random().toString(); //FIXME: We're just disabling the cache right now
		if(key === undefined || key === null)
		{
			key = Graphic;	//FIXME
			if(Unique && (this._cache[key] !== undefined) && (this._cache[key] !== null))
			{
				//Generate a unique key
				var inc = 0;
				var ukey;
				do { ukey = key + inc++;
				} while((this._cache[ukey] !== undefined) && (this._cache[ukey] !== null));
				key = ukey;
			}
		}
		//If there is no data for this key, generate the requested graphic
		if(!this.checkBitmapCache(key))
		{
			this._cache[key] = Graphic; //FIXME
			if(Reverse) needReverse = true;
		}
		var pixels = this._cache[key];
		if(!needReverse && Reverse && (pixels.width == Graphic.width)) //FIXME [x]
			needReverse = true;
		if(needReverse)
		{
			var newPixels = new BitmapData(pixels.width<<1,pixels.height,true,0x00000000);
			newPixels.draw(pixels);
			var mtx = new Matrix();
			mtx.scale(-1,1);
			mtx.translate(newPixels.width,0);
			newPixels.draw(pixels,mtx);
			pixels = newPixels;
		}
		return pixels;
	},

	follow: function(Target, Lerp) {
		Lerp = (Lerp === undefined) ? 1 : Lerp;

		this.followTarget = Target;
		this.followLerp = Lerp;
		this._scrollTarget.x = (this.width>>1) - this.followTarget.x - (this.followTarget.width>>1);
		this._scrollTarget.y = (this.height>>1) - this.followTarget.y - (this.followTarget.height>>1);
		this.scroll.x = this._scrollTarget.x;
		this.scroll.y = this._scrollTarget.y;
		this.doFollow();
	},

	followAdjust: function(LeadX, LeadY) {
		LeadX = isNaN(LeadX) ? 0 : LeadX;
		LeadY = isNaN(LeadY) ? 0 : LeadY;

		this.followLead = new Point(LeadX,LeadY);
	},

	followBounds: function(MinX, MinY, MaxX, MaxY, UpdateWorldBounds) {

		MinX = isNaN(MinX) ? 0 : MinX;
		MinY = isNaN(MinY) ? 0 : MinY;
		MaxX = isNaN(MaxX) ? 0 : MaxX;
		MaxY = isNaN(MaxY) ? 0 : MaxY;
		UpdateWorldBounds = (UpdateWorldBounds === undefined) ? true : UpdateWorldBounds;

		this.followMin = new Point(-MinX,-MinY);
		this.followMax = new Point(-MaxX+ this.width,-MaxY+this.height);
		if(this.followMax.x > this.followMin.x)
			this.followMax.x = this.followMin.x;
		if(this.followMax.y > this.followMin.y)
			this.followMax.y = this.followMin.y;
		if(UpdateWorldBounds)
			FlxU.setWorldBounds(MinX, MinY, MaxX - MinX, MaxY - MinY);
		this.doFollow();
	},

	//OMITTED: getter for stage. No such thing in Javascript

	getState: function() {
		return this._game._state;
	},
	
	setState: function(State) {
		this._game.switchState(State);
	},

	unfollow: function() {
		this.followTarget = null;
		this.followLead = null;
		this.followLerp = 1;
		this.followMin = null;
		this.followMax = null;
		if(this.scroll === null) //NOTE: Flixel explicitly sets null for scroll and _scrollTarget in setGameData
			this.scroll = new Point();
		else
			this.scroll.x = this.scroll.y = 0;
		if(this._scrollTarget === null)
			this._scrollTarget = new Point();
		else
			this._scrollTarget.x = this._scrollTarget.y = 0;
	},

	setGameData: function(Game, Width, Height, Zoom) {

		this._game = Game;
		this._cache = new Object();
		this.width = Width;
		this.height = Height;
		this._mute = false;
		this._volume = 0.5;
		this.sounds = new Array();
		this.mouse = new FlxMouse();
		this.keys = new FlxKeyboard();
		this.gamepads = new Array(4);
		this.gamepads[0] = new FlxGamepad();
		this.gamepads[1] = new FlxGamepad();
		this.gamepads[2] = new FlxGamepad();
		this.gamepads[3] = new FlxGamepad();
		this.scroll = null;
		this._scrollTarget = null;
		this.unfollow();
		FlxG.levels = new Array();
		FlxG.scores = new Array();
		this.level = 0;
		this.score = 0;
		this.pause = false;
		this.timeScale = 1.0;
		this.framerate = 60;
		this.frameratePaused = 10;
		this.maxElapsed = 0.0333333;
		FlxG.elapsed = 0;
		this.showBounds = false;
		
		this.mobile = false;
		
		this.panel = new FlxPanel();
		this.quake = new FlxQuake(Zoom);
		this.flash = new FlxFlash();
		this.fade = new FlxFade();

		FlxU.setWorldBounds(0,0,FlxG.width,FlxG.height);
	},

	doFollow: function()
	{
		if(this.followTarget != null)
		{
			this._scrollTarget.x = (this.width>>1)-this.followTarget.x-(this.followTarget.width>>1);
			this._scrollTarget.y = (this.height>>1)-this.followTarget.y-(this.followTarget.height>>1);

			if((this.followLead != null) && (this.followTarget instanceof FlxSprite))
			{
				this._scrollTarget.x -= (this.followTarget).velocity.x*this.followLead.x;
				this._scrollTarget.y -= (this.followTarget).velocity.y*this.followLead.y;
			}
			this.scroll.x += (this._scrollTarget.x-this.scroll.x)*this.followLerp*FlxG.elapsed;
			this.scroll.y += (this._scrollTarget.y-this.scroll.y)*this.followLerp*FlxG.elapsed;
			
			if(this.followMin != null)
			{
				if(this.scroll.x > this.followMin.x)
					this.scroll.x = this.followMin.x;
				if(this.scroll.y > this.followMin.y)
					this.scroll.y = this.followMin.y;
			}
			
			if(this.followMax != null)
			{
				if(this.scroll.x < this.followMax.x)
					this.scroll.x = this.followMax.x;
				if(this.scroll.y < this.followMax.y)
					this.scroll.y = this.followMax.y;
			}
		}
	},

	updateInput: function() {
		this.keys.update();
		this.mouse.update(this.state.mouseX,this.state.mouseY,this.scroll.x,this.scroll.y);
		var i = 0;
		var l = this.gamepads.length;
		while(i < l)
			this.gamepads[i++].update();
	},

});

//Static class. Like FlxU, everything is static, so just set it to an instance of itself
FlxG = new FlxG;

FlxGame = new Class({

	initialize: function(GameSizeX, GameSizeY, InitialState, Zoom) {
		Zoom = isNaN(Zoom) ? 2 : Zoom;
	
		this._zoom = Zoom;
		FlxState.bgColor = 0xFFAACEAA
		FlxG.setGameData(this, GameSizeX, GameSizeY, Zoom);
		this._elapsed = 0;
		this._total = 0;
		this.pause = new FlxPause();
		this._state = null;
		this._iState = InitialState;
		this._zeroPoint = new Point();

		this.useDefaultHotKeys = true;
		
		this._frame = null;
		this._gameXOffset = 0;
		this._gameYOffset = 0;
		
		this._paused = false;
		this._created = false;

		this.create();
	},

	//FIXME: We're not actually doing frames right now...
	addFrame: function(Frame, ScreenOffsetX, ScreenOffsetY) {
		this._frame = Frame;
		this._gameXOffset = ScreenOffsetX;
		this._gameYOffset = ScreenOffsetY;
		return this;
	},

	showSoundTray: function(Silent) {

		return; //FIXME: Bypassing this whole thing. Not using sound try right now, also there's no SndBeep

		Silent = (Silent === undefined) ? false : Silent;

		if(!Silent)
			FlxG.play(SndBeep);
		this._soundTrayTimer = 1;
		this._soundTray.y = this._gameYOffset * this._zoom;
		this._soundTray.visible = true;
		var gv = Math.round(FlxG.volume * 10);
		if(FlxG.mute)
			gv = 0;
		for (var i = 0; i < this._soundTrayBars.length; i++)
		{
			if(i < gv) this._soundTrayBars[i].alpha = 1;
			else this._soundTrayBars[i].alpha = 0.5;
		}
	},

	//NOTE: Had Flash specific stage/display list stuff
	switchState: function(State)
	{

		//Basic reset stuff
		FlxG.panel.hide();
		FlxG.unfollow();
		FlxG.resetInput();
		FlxG.destroySounds();
		FlxG.flash.stop();
		FlxG.fade.stop();
		FlxG.quake.stop();
		//this._screen.x = 0;
		//this._screen.y = 0;
		
		//Swap the new state for the old one and dispose of it
		if(this._state !== null && this._state !== undefined) {
			this._state.destroy();
		}
		this._state = State;
		this._state.scaleX = this._state.scaleY = this._zoom;
		
		//Finally, create the new state
		this._state.create();
	},

	//e is a MooTools event object. It puts some convenient properties right on e,
	//		but leaves the native event object available on e.event as a fallback
	onKeyUp: function(e) {

		if((e.code == 192) || (e.code == 220)) //FOR ZE GERMANZ
		{
			this._console.toggle();
			return;
		}
		if(!FlxG.mobile && this.useDefaultHotKeys)
		{
			var c = e.code;
			var code = String.fromCharCode(e.code);	//NOTE: Not used anywhere....must be Adam's work in progress
			switch(c)
			{
				case 48:
				case 96:
					FlxG.mute = !FlxG.mute;
					this.showSoundTray();
					return;
				case 109:
				case 189:
					FlxG.mute = false;
					FlxG.volume = FlxG.volume - 0.1;
					this.showSoundTray();
					return;
				case 107:
				case 187:
					FlxG.mute = false;
					FlxG.volume = FlxG.volume + 0.1;
					this.showSoundTray();
					return;
				case 80:
					FlxG.pause = !FlxG.pause;
					break;
				default:
					break;
			}

		}
		FlxG.keys.handleKeyUp(e);
		var i = 0;
		var l = FlxG.gamepads.length;
		while(i < l)
			FlxG.gamepads[i++].handleKeyUp(e);

		e.preventDefault();

	},

	onKeyDown: function(e) {
		FlxG.keys.handleKeyDown(e);
		var i = 0;
		var l = FlxG.gamepads.length;
		while(i < l)
			FlxG.gamepads[i++].handleKeyDown(e);

		e.preventDefault();
	},

	//NOTE: Makes no use of event parameter, just passes it. Probably needs to for Flash's sake
	//TODO: Make this focus/blur pause behavior optional via FlxOptions
	onFocus: function(e) {
		if(FlxG.pause)
			FlxG.pause = false;
	},

	onFocusLost: function(e)
	{
		FlxG.pause = true;
	},

	//NOTE: Pretty useless now; removed Flash-specific stuff
	unpauseGame: function()
	{
		FlxG.resetInput();
		this._paused = false;
	},

	//NOTE: Also useless for Javascript. Can probably just hack these both out
	pauseGame: function()
	{
		if((this.x != 0) || (this.y != 0))
		{
			this.x = 0;
			this.y = 0;
		}
		this._paused = true;
	},

	doUpdate: function() {
	},

	//NOTE: Event parameter (e) probably unnecessary as it's just to appease Flash
	//			(called from an ENTER_FRAME event)
	//TODO: We need to actually draw the screen buffer to the main window Canvas:
	//		Normally, FlxGame has a Sprite named _screen, which contains a bitmap,
	//		that FlxG.buffer has a reference to (its BitmapData)
	//		Our update loop needs to blit FlxG.buffer onto the main canvas
	update: function(e) {

		var mark = flash.utils.getTimer();
		
		var i;
		var soundPrefs;

		//FlxG.buffer.fillRect(0, 0, 320, 240, FlxState.bgColor);
		StageContext.clearRect(0, 0, FlxG.width, FlxG.height);

		//Frame timing
		var ems = mark - this._total;
		this._elapsed = ems/1000;
		this._console.mtrTotal.add(ems);
		this._total = mark;
		FlxG.elapsed = this._elapsed;
		if(FlxG.elapsed > FlxG.maxElapsed)
			FlxG.elapsed = FlxG.maxElapsed;
		FlxG.elapsed *= FlxG.timeScale;
		
		//Sound tray crap
		if(this._soundTray !== null && this._soundTray !== undefined)
		{
			if(this._soundTrayTimer > 0)
				this._soundTrayTimer -= this._elapsed;
			else if(this._soundTray.y > - this._soundTray.height)
			{
				this._soundTray.y -= this._elapsed * FlxG.height*2;
				if(this._soundTray.y <= - this._soundTray.height)
				{
					this._soundTray.visible = false;
					
					//Save sound preferences
					soundPrefs = new FlxSave();
					if(soundPrefs.bind("flixel"))
					{
						if(soundPrefs.data.sound === undefined)
							soundPrefs.data.sound = new Object;
						soundPrefs.data.mute = FlxG.mute;
						soundPrefs.data.volume = FlxG.volume;
						soundPrefs.forceSave();
					}
				}
			}
		}

		//Animate flixel HUD elements
		FlxG.panel.update();
		//if(this._console.visible)
			this._console.update();
		
		//State updating
		FlxG.updateInput();
		FlxG.updateSounds();
		if(this._paused)
			this.pause.update();
		else
		{
			//Update the camera and game state
			FlxG.doFollow();
			this._state.update();
			
			//Update the various special effects
			if(FlxG.flash.exists)
				FlxG.flash.update();
			if(FlxG.fade.exists)
				FlxG.fade.update();
			FlxG.quake.update();
			//this._screen.x = FlxG.quake.x;
			//this._screen.y = FlxG.quake.y;
		}
		//Keep track of how long it took to update everything
		var updateMark = flash.utils.getTimer();
		this._console.mtrUpdate.add(updateMark - mark);
		
		//Render game content, special fx, and overlays
		this._state.preProcess();
		this._state.render();
		if(FlxG.flash.exists)
			FlxG.flash.render();
		if(FlxG.fade.exists)
			FlxG.fade.render();
		if(FlxG.panel.visible)
			FlxG.panel.render();
		if(FlxG.mouse.cursor !== null && FlxG.mouse.cursor !== undefined)
		{
			if(FlxG.mouse.cursor.active)
				FlxG.mouse.cursor.update();
			if(FlxG.mouse.cursor.visible)
				FlxG.mouse.cursor.render();
		}
		this._state.postProcess();
		if(this._paused)
			this.pause.render();
		//Keep track of how long it took to draw everything
		this._console.mtrRender.add(flash.utils.getTimer() - this.updateMark);
		//clear mouse wheel delta
		FlxG.mouse.wheel = 0;

		//StageContext.drawImage(FlxState.screen._pixels._canvas, 0, 0);
		StageContext.drawImage(FlxG.buffer._canvas, 0, 0);
	},

	create: function(e) {

		var i;
		var l;
		var soundPrefs;
		
		//NOTE: Removed Flash stuff here: setting up stage and adding _screen Sprite to it


		//NOTE: tmp is the main screen buffer. Normally added as child of _screen Sprite here
		//	It's also normally a Bitmap, but here we stripped it down to a direct BitmapData
		var tmp = new BitmapData(FlxG.width,FlxG.height,false,FlxState.bgColor);
		tmp.x = this._gameXOffset;
		tmp.y = this._gameYOffset;
		tmp.scaleX = tmp.scaleY = this._zoom;
		FlxG.buffer = tmp;
		
		//Initialize game console
		this._console = new FlxConsole(this._gameXOffset,this._gameYOffset,this._zoom);
		var vstring = FlxG.LIBRARY_NAME+" v"+FlxG.LIBRARY_MAJOR_VERSION+"."+FlxG.LIBRARY_MINOR_VERSION;

		//NOTE: Removed big chunk of text formatting stuff that's displayed on the console
		//		Add back in [debug] and [release] identifiers to console class directly
		
		//Add basic input even listeners
		//NOTE: Changed these significantly to fit Javascript + MooTools
		//		StageCanvas is a reference to the HTML Canvas element we draw the whole game on
		//		MooTools abstracts all event listeners through addEvent

		StageCanvas.addEvent("mousedown", FlxG.mouse.handleMouseDown.bindWithEvent(FlxG.mouse));
		StageCanvas.addEvent("mouseup", FlxG.mouse.handleMouseUp.bindWithEvent(FlxG.mouse));
		$(window).addEvent("keydown", this.onKeyDown.bindWithEvent(this));
		$(window).addEvent("keyup", this.onKeyUp.bindWithEvent(this));
		if(!FlxG.mobile)
		{
			//bindWithEvent to make sure "this" points to the right place within the handler function
			StageCanvas.addEvent("mouseout", FlxG.mouse.handleMouseOut.bindWithEvent(FlxG.mouse));
			StageCanvas.addEvent("mouseover", FlxG.mouse.handleMouseOver.bindWithEvent(FlxG.mouse));
			StageCanvas.addEvent("mousewheel", FlxG.mouse.handleMouseWheel.bindWithEvent(FlxG.mouse));

			//NOTE: Removed focus/blur events here. Only applies to Flash
			//	For our purposes, no functional difference compared to mouse out/over
			

			//NOTE: Removed large chunk that creates and styles sound tray
			
			//Check for saved sound preference data
			soundPrefs = new FlxSave();
			if(soundPrefs.bind("flixel") && (soundPrefs.data.sound !== undefined))
			{
				if(soundPrefs.data.volume !== undefined)
					FlxG.volume = soundPrefs.data.volume;
				if(soundPrefs.data.mute !=- undefined)
					FlxG.mute = soundPrefs.data.mute;
				this.showSoundTray(true);
			}
		}

		//NOTE: Removed Frame thing. Maybe add later
		
		//All set!
		this.switchState(new this._iState());
		FlxState.screen.unsafeBind(FlxG.buffer);

		//Framerate is in FPS, but setInterval wants milliseconds between frames
		//this.update.periodical(1000 * (1 / this.framerate), this);
		this.framerate = 60;
		setInterval(this.update.bind(this), 1000 * (1 / this.framerate));
	}


});

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



//NOTE: Dummy class. FlxPanel omitted due to low importance
FlxPanel = new Class({

	initialize: function() {
	},

	hide: function() {
	},

	update: function() {
	}

});

//TODO: Implement these. FlxQuake, FlxFlash, and FlxFade are also currently dummy classes
//	They will be implemented eventually, though
FlxQuake = new Class({

	initialize: function() {
	},

	stop: function() {
	},

	update: function() {},


});

FlxFlash = new Class({

	initialize: function() {
	},

	stop: function() {
	},

	update: function() {},


});

FlxFade = new Class({

	initialize: function() {
	},

	stop: function() {
	},

	update: function() {},

});

//TODO: Implement. Currently a dummy class, but this one's important
//		Also make SharedObject wrapper
FlxSave = new Class({

	initialize: function() {
	},

	bind: function() {
	},

	forceSave: function() {
	},

});

//NOTE: More dummy classes
FlxGamepad = new Class({

	Extends: FlxInput,

	initialize: function() {
		this.parent();
	},

	reset: function() {
	},

	update: function() {
	},

});

FlxPause = new Class({
	initialize: function() {
	},
});


//FlxState.screen = new FlxSprite;
FlxState.bgColor = 0xFFAACEAA;