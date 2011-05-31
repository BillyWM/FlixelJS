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

		return; //FIXME: Bypassing this whole thing. Not using sound tray right now, also there's no SndBeep

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
