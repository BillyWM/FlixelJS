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
