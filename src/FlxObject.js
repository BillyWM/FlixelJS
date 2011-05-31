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
