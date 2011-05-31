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
