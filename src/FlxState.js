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

//FlxState.screen = new FlxSprite;
FlxState.bgColor = 0xFFAACEAA;
