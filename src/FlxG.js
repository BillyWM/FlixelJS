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
