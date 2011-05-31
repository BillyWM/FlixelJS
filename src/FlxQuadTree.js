FlxQuadTree = new Class({

	Extends: FlxRect,

	initialize: function(X, Y, Width, Height, Parent) {
		Parent = (Parent === undefined) ? null : Parent;

		this.parent(X,Y,Width,Height);

		this._headA = this._tailA = new FlxList();
		this._headB = this._tailB = new FlxList();

		//DEBUG: draw a randomly colored rectangle indicating this quadrant (may induce seizures)
		/*var brush = new FlxSprite().createGraphic(Width,Height,0xffffffff*FlxU.random());
		FlxState.screen.draw(brush,X+FlxG.scroll.x,Y+FlxG.scroll.y);*/

		
		//Copy the parent's children (if there are any)
		if(Parent != null)
		{
			var itr;
			var ot;
			if(Parent._headA.object != null)
			{
				itr = Parent._headA;
				while(itr != null)
				{
					if(this._tailA.object != null)
					{
						ot = _tailA;
						this._tailA = new FlxList();
						ot.next = this._tailA;
					}
					this._tailA.object = itr.object;
					itr = itr.next;
				}
			}
			if(Parent._headB.object != null)
			{
				itr = Parent._headB;
				while(itr != null)
				{
					if(this._tailB.object != null)
					{
						ot = this._tailB;
						this._tailB = new FlxList();
						ot.next = this._tailB;
					}
					this._tailB.object = itr.object;
					itr = itr.next;
				}
			}
		}
		else
			FlxQuadTree._min = (this.width + this.height)/(2 * FlxQuadTree.divisions);
		this._canSubdivide = (this.width > this._min) || (this.height > FlxQuadTree._min);
		
		//Set up comparison/sort helpers
		this._nw = null;
		this._ne = null;
		this._se = null;
		this._sw = null;
		this._l = this.x;
		this._r = this.x + this.width;
		this._hw = this.width/2;
		this._mx = this._l + this._hw;
		this._t = this.y;
		this._b = this.y + this.height;
		this._hh = this.height/2;
		this._my = this._t + this._hh;
	},

	add: function(Obj, List)
	{
		this._oa = List;
		if(Obj._group)
		{
			var i = 0;
			var m;
			var members = Obj.members;
			var l = members.length;
			while(i < l)
			{
				m = members[i++];
				if((m != null) && m.exists)
				{
					if(m._group)
						this.add(m,List);
					else if(m.solid)
					{
						FlxQuadTree._o = m;
						FlxQuadTree._ol = FlxQuadTree._o.x;
						FlxQuadTree._ot = FlxQuadTree._o.y;
						FlxQuadTree._or = FlxQuadTree._o.x + FlxQuadTree._o.width;
						FlxQuadTree._ob = FlxQuadTree._o.y + FlxQuadTree._o.height;
						this.addObject();
					}
				}
			}
		}
		if(Obj.solid)
		{
			FlxQuadTree._o = Obj;
			FlxQuadTree._ol = FlxQuadTree._o.x;
			FlxQuadTree._ot = FlxQuadTree._o.y;
			FlxQuadTree._or = FlxQuadTree._o.x + FlxQuadTree._o.width;
			FlxQuadTree._ob = FlxQuadTree._o.y + FlxQuadTree._o.height;
			this.addObject();
		}
	},

	addObject: function()
	{
		//If this quad (not its children) lies entirely inside this object, add it here
		if(!this._canSubdivide || ((this._l >= this._ol) && (this._r <= this._or) && (this._t >= this._ot) && (this._b <= this._ob)))
		{
			this.addToList();
			return;
		}
		
		//See if the selected object fits completely inside any of the quadrants
		if((this._ol > this._l) && (this._or < this._mx))
		{
			if((this._ot > this._t) && (this._ob < this._my))
			{
				if(this._nw == null)
					this._nw = new FlxQuadTree(this._l,this._t,this._hw,this._hh,this);
				this._nw.addObject();
				return;
			}
			if((this._ot > this._my) && (this._ob < this._b))
			{
				if(this._sw == null)
					this._sw = new FlxQuadTree(this._l,this._my,this._hw,this._hh,this);
				this._sw.addObject();
				return;
			}
		}
		if((this._ol > this._mx) && (this._or < this._r))
		{
			if((this._ot > this._t) && (this._ob < this._my))
			{
				if(this._ne == null)
					this._ne = new FlxQuadTree(this._mx,this._t,this._hw,this._hh,this);
				this._ne.addObject();
				return;
			}
			if((this._ot > this._my) && (this._ob < this._b))
			{
				if(this._se == null)
					this._se = new FlxQuadTree(this._mx,this._my,this._hw,this._hh,this);
				this._se.addObject();
				return;
			}
		}
		
		//If it wasn't completely contained we have to check out the partial overlaps
		if((this._or > this._l) && (this._ol < this._mx) && (this._ob > this._t) && (this._ot < this._my))
		{
			if(this._nw == null)
				this._nw = new FlxQuadTree(this._l,this._t,this._hw,this._hh,this);
			this._nw.addObject();
		}
		if((this._or > this._mx) && (this._ol < this._r) && (this._ob > this._t) && (this._ot < this._my))
		{
			if(this._ne == null)
				this._ne = new FlxQuadTree(this._mx,this._t,this._hw,this._hh,this);
			this._ne.addObject();
		}
		if((this._or > this._mx) && (this._ol < this._r) && (this._ob > this._my) && (this._ot < this._b))
		{
			if(this._se == null)
				this._se = new FlxQuadTree(this._mx,this._my,this._hw,this._hh,this);
			this._se.addObject();
		}
		if((this._or > this._l) && (this._ol < this._mx) && (this._ob > this._my) && (this._ot < this._b))
		{
			if(this._sw == null)
				this._sw = new FlxQuadTree(this._l,this._my,this._hw,this._hh,this);
			this._sw.addObject();
		}
	},

	addToList: function()
	{
		var ot;
		if(this._oa == FlxQuadTree.A_LIST)
		{
			if(this._tailA.object != null)
			{
				ot = this._tailA;
				this._tailA = new FlxList();
				ot.next = this._tailA;
			}
			this._tailA.object = this._o;
		}
		else
		{
			if(this._tailB.object != null)
			{
				ot = this._tailB;
				this._tailB = new FlxList();
				ot.next = this._tailB;
			}
			this._tailB.object = this._o;
		}
		if(!this._canSubdivide)
			return;
		if(this._nw != null)
			this._nw.addToList();
		if(this._ne != null)
			this._ne.addToList();
		if(this._se != null)
			this._se.addToList();
		if(this._sw != null)
			this._sw.addToList();
	},

	overlap: function(BothLists, Callback) {
		BothLists = (BothLists === undefined) ? true : BothLists;
		Callback = (Callback === undefined) ? null : Callback;

		this._oc = Callback;
		var c = false;
		var itr;
		if(BothLists)
		{
			//An A-B list comparison
			this._oa = FlxQuadTree.B_LIST;
			if(this._headA.object != null)
			{
				itr = this._headA;
				while(itr != null)
				{
					FlxQuadTree._o = itr.object;
					if(this._o.exists && this._o.solid && this.overlapNode())
						c = true;
					itr = itr.next;
				}
			}
			this._oa = FlxQuadTree.A_LIST;
			if(this._headB.object != null)
			{
				itr = this._headB;
				while(itr != null)
				{
					FlxQuadTree._o = itr.object;
					if(this._o.exists && this._o.solid)
					{
						if((this._nw != null) && this._nw.overlapNode())
							c = true;
						if((this._ne != null) && this._ne.overlapNode())
							c = true;
						if((this._se != null) && this._se.overlapNode())
							c = true;
						if((this._sw != null) && this._sw.overlapNode())
							c = true;
					}
					itr = itr.next;
				}
			}
		}
		else
		{
			//Just checking the A list against itself
			if(this._headA.object != null)
			{
				itr = this._headA;
				while(itr != null)
				{
					FlxQuadTree._o = itr.object;
					if(this._o.exists && this._o.solid && this.overlapNode(itr.next))
						c = true;
					itr = itr.next;
				}
			}
		}
		
		//Advance through the tree by calling overlap on each child
		if((this._nw != null) && this._nw.overlap(BothLists,this._oc))
			c = true;
		if((this._ne != null) && this._ne.overlap(BothLists,this._oc))
			c = true;
		if((this._se != null) && this._se.overlap(BothLists,this._oc))
			c = true;
		if((this._sw != null) && this._sw.overlap(BothLists,this._oc))
			c = true;
		
		return c;
	},

	overlapNode: function(Iterator) {
		Iterator = (Iterator === undefined) ? null : Iterator;

		//member list setup
		var c = false;
		var co;
		var itr = Iterator;
		if(itr == null)
		{
			if(this._oa == FlxQuadTree.A_LIST)
				itr = this._headA;
			else
				itr = this._headB;
		}
		
		//Make sure this is a valid list to walk first!
		if(itr.object != null)
		{
			//Walk the list and check for overlaps
			while(itr != null)
			{
				co = itr.object;
				if( (FlxQuadTree._o === co) || !co.exists || !this._o.exists || !co.solid || !this._o.solid ||
					(FlxQuadTree._o.x + this._o.width  < co.x + FlxU.roundingError) ||
					(FlxQuadTree._o.x + FlxU.roundingError > co.x + co.width) ||
					(FlxQuadTree._o.y + this._o.height < co.y + FlxU.roundingError) ||
					(FlxQuadTree._o.y + FlxU.roundingError > co.y + co.height) )
				{
					itr = itr.next;
					continue;
				}
				if(this._oc == null)
				{
					this._o.kill();
					co.kill();
					c = true;
				}
				else if(this._oc(this._o,co))
					c = true;
				itr = itr.next;
			}
		}
		
		return c;
	}


});

//Static properties
FlxQuadTree.A_LIST = 0;
FlxQuadTree.B_LIST = 1;
FlxQuadTree.divisions =  3;
FlxQuadTree.quadTree = null;
FlxQuadTree.bounds = null;
