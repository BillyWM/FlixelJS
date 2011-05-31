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
