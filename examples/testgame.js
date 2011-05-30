Platformer = new Class({

	Extends: FlxGame,

	initialize: function() {
		this.parent(640,480,PlayState,1);
		FlxState.bgColor = 0xFFAACEAA;
	},
});


PlayState = new Class({

	Extends: FlxState,

	initialize: function() {
		this.parent();
	},

	create: function() {

		this.map = new FlxTilemap();
		this.map.auto = FlxTilemap.OFF;
		this.map.drawIndex = 1;
		this.map.collideIndex = 0;
		this.map.loadMap(FlxTilemap.arrayToCSV(filledArray(1000, 1), 200), Assets.images.tileset, 16, 16);
		this.add(this.map);
		this.map.y = 4 * 16;
		this.map.solid = true;

		this.block = new Block(10, 100);
		this.add(this.block);

		this.player = new Player(10, 10);
		this.add(this.player);

		this.stander = this.add(new Stander(100, 10));

		for (var i = 0; i < 1000; i++) {
			if (Math.random() > 0.5) { this.map.setTile(i, 3, 0); }
		}

		FlxG.follow(this.player);
		FlxG.followAdjust(0.5, 0.7);
		FlxG.followBounds(0, -1000, 16000, 2000);

		this.emitter = new FlxEmitter(100,0);
		this.emitter.setXSpeed(-200, 200);
		this.emitter.setYSpeed(-500, 200);
		this.emitter.gravity = 500;
		
		var particles = 200;
		this.boomDelay = 3;
		 
		for(i = 0; i < particles; i++)
		{
			var particle = new FlxSprite();
			particle.createGraphic(4, 4, Math.floor(Math.random() * 0xFFFFFFFF));
			this.emitter.add(particle);
		}
		 
		this.add(this.emitter);

	},

	update: function() {
		this.parent();

		FlxU.collide(this.player, this.block);

		if (FlxG.keys.justPressed("SPACE")) {
			this.emitter.at(this.player);
			this.emitter.start(true, 1.2);
		}

	}

});

Player = new Class({

	Extends: FlxSprite,

	initialize: function(X, Y) {
		this.parent(X, Y);
		this.loadGraphic(Assets.images.player);
		this.solid = true;
		this.maxVelocity.x = 100;
		this.drag.x = this.maxVelocity.x * 4;
	},

	create: function() {
	},

	update: function() {
		this.acceleration.y = 500;
		if (FlxG.keys.LEFT) { this.velocity.x -= 40 }
		if (FlxG.keys.RIGHT) { this.velocity.x += 40 }
		if (FlxG.keys.UP) { this.velocity.y = -250; }
		this.parent();
	},

});

Stander = new Class({

	Extends: FlxSprite,

	initialize: function(X, Y) {
		this.parent(X, Y);
		this.loadGraphic(Assets.images.player);
		this.solid = true;
	},

	create: function() {
		this.parent();
	},

	update: function() {
		this.parent();
	},

});

Block = new Class({

	Extends: FlxSprite,

	initialize: function(X, Y) {
		this.parent(X, Y);
		this.loadGraphic(Assets.images.block);
	},

	create: function() {
		this.solid = true;
		this.fixed = true;
	},

	update: function() {
	},

});




function filledArray(size, value) {
	var retArray = new Array(size);
	for (var i = 0; i < retArray.length; i++) {
		retArray[i] = value;
	}
	return retArray;
}