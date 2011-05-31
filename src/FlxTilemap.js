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
				dd = Math.floor(this._data[d+c]);
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
				if(Math.floor(this._data[rs+c]) >= this.collideIndex)
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
		var r = Math.floor(Index/this.widthInTiles) - 1;
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
			if((Math.floor(this._data[ty*this.widthInTiles+tx])) >= this.collideIndex)
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
