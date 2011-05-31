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

String.prototype.pad = function(len, chr, side) {
	chr = (chr === undefined) ? " " : chr;

	var t = len - this.length;
	var padstr = "";
	while (t > 0) {
		padstr += chr;
		t--;
	}
	switch (side) {
		case 'left': return padstr + this;
		case 'right': return this + padstr;
		default: break;
	}

	return;
};

//Compatibility function that gives IE9 some hope of working
//FROM: http://blogs.msdn.com/b/ie/archive/2010/09/07/transitioning-existing-code-to-the-es5-getter-setter-apis.aspx
//emulate legacy getter/setter API using ES5 APIs
try {
   if (!Object.prototype.__defineGetter__ &&
        Object.defineProperty({},"x",{get: function(){return true;}}).x) {
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
} catch(defPropException) {/*Do nothing if an exception occurs*/}

//NOTE: Opera doesn't support createImageData (but we might not need it after all)
if (!CanvasRenderingContext2D.prototype.createImageData) {

	CanvasRenderingContext2D.prototype.createImageData = function(sw, sh) {

		var c = document.createElement('canvas');
		c.width = sw; c.height = sh;
		data = c.getContext('2d').getImageData(0, 0, sw, sh);
		c = null;
		return data;
	};
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

// Each asset is an instance of the Asset class. Global "assets" variable holds reference to
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
	},

	rotate: function(angle) {
		var cos = Math.cos(angle);
		var sin = Math.sin(angle);
		var mrotate = new Matrix(cos, sin, -sin, cos, 0, 0);
		this.concat(mrotate);
	},

	scale: function(sx, sy) {
		var mscale = new Matrix(sx, 0, 0, sy, 0, 0);
		this.concat(mscale);
	},

	translate: function(dx, dy) {
		var mtrans = new Matrix(1, 0, 0, 1, dx, dy);
		this.concat(mtrans);
	},

	//deep copy
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
	}

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

		//FIXME: Temporarily disabled fill while researching alpha problems
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

			//clamp values.
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
	}


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