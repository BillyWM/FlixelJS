FlxU = new Class({

	initialize: function() {
	},

	abs: function(N) {
		return Math.abs(N);
	},
	
	floor: function(N) {
		return Math.floor(N);
	},
	
	ceil: function(N) {
		return Math.ceil(N);
	},
	
	min: function(N1,N2) {
		return Math.min(N1, N2);
	},
		
	max: function(N1,N2) {
		return Math.max(N1, N2);
	},

	random: function(Seed) {
		if(isNaN(Seed) || Seed === undefined)
			return Math.random();
		else
		{
			//Make sure the seed value is OK
			if(Seed == 0)
				Seed = Number.MIN_VALUE;
			if(Seed >= 1)
			{
				if((Seed % 1) == 0)
					Seed /= Math.PI;
				Seed %= 1;
			}
			else if(Seed < 0)
				Seed = (Seed % 1) + 1;
			
			//Then do an LCG thing and return a predictable random number
			return ((69621 * Math.floor(Seed * 0x7FFFFFFF)) % 0x7FFFFFFF) / 0x7FFFFFFF;
		}
	},

	startProfile: function() {
		return flash.utils.getTimer();
	},

	endProfile: function(Start, Name, Log) {
		var t = flash.utils.getTimer();
		if(Log)
			FlxG.log(Name+": "+((t-Start)/1000)+"s");
		return t;
	},

	rotatePoint: function(X, Y, PivotX, PivotY, Angle, P) {
		var sin = 0;
		var cos = 0;
		var radians = Angle * -0.017453293;
		while (radians < -3.14159265)
			radians += 6.28318531;
		while (radians >  3.14159265)
			radians = radians - 6.28318531;

		if (radians < 0)
		{
			sin = 1.27323954 * radians + .405284735 * radians * radians;
			if (sin < 0)
				sin = .225 * (sin *-sin - sin) + sin;
			else
				sin = .225 * (sin * sin - sin) + sin;
		}
		else
		{
			sin = 1.27323954 * radians - 0.405284735 * radians * radians;
			if (sin < 0)
				sin = .225 * (sin *-sin - sin) + sin;
			else
				sin = .225 * (sin * sin - sin) + sin;
		}
		
		radians += 1.57079632;
		if (radians >  3.14159265)
			radians = radians - 6.28318531;
		if (radians < 0)
		{
			cos = 1.27323954 * radians + 0.405284735 * radians * radians;
			if (cos < 0)
				cos = .225 * (cos *-cos - cos) + cos;
			else
				cos = .225 * (cos * cos - cos) + cos;
		}
		else
		{
			cos = 1.27323954 * radians - 0.405284735 * radians * radians;
			if (cos < 0)
				cos = .225 * (cos *-cos - cos) + cos;
			else
				cos = .225 * (cos * cos - cos) + cos;
		}

		var dx = X-PivotX;
		var dy = PivotY-Y;
		if(P === undefined) P = new FlxPoint();
		P.x = PivotX + cos*dx - sin*dy;
		P.y = PivotY - sin*dx - cos*dy;
		return P;
	},

	getAngle: function(X, Y) {
		
		var c1 = 3.14159265 / 4;
		var c2 = 3 * c1;
		var ay = (Y < 0)?-Y:Y;
		var angle = 0;
		if (X >= 0)
			angle = c1 - c1 * ((X - ay) / (X + ay));
		else
			angle = c2 - c1 * ((X + ay) / (ay - X));
		return ((Y < 0)?-angle:angle)*57.2957796;
	},

	getColor: function(Red, Green, Blue, Alpha)
	{
		//AS3 default value of 1.0
		Alpha = (isNaN(Alpha)) ? 1.0 : Alpha;
		return (((Alpha>1)?Alpha:(Alpha * 255)) & 0xFF) << 24 | (Red & 0xFF) << 16 | (Green & 0xFF) << 8 | (Blue & 0xFF);
	},

	getColorHSB: function(Hue,Saturation,Brightness,Alpha)
	{
		//AS3 default value of 1.0
		Alpha = (isNaN(Alpha)) ? 1.0 : Alpha;
		var red;
		var green;
		var blue;
		if(Saturation == 0.0)
		{
			red   = Brightness;
			green = Brightness;        
			blue  = Brightness;
		}       
		else
		{
			if(Hue == 360)
				Hue = 0;
			var slice = Hue/60;
			var hf = Hue/60 - slice;
			var aa = Brightness*(1 - Saturation);
			var bb = Brightness*(1 - Saturation*hf);
			var cc = Brightness*(1 - Saturation*(1.0 - hf));
			switch (slice)
			{
				case 0: red = Brightness; green = cc;   blue = aa;  break;
				case 1: red = bb;  green = Brightness;  blue = aa;  break;
				case 2: red = aa;  green = Brightness;  blue = cc;  break;
				case 3: red = aa;  green = bb;   blue = Brightness; break;
				case 4: red = cc;  green = aa;   blue = Brightness; break;
				case 5: red = Brightness; green = aa;   blue = bb;  break;
				default: red = 0;  green = 0;    blue = 0;   break;
			}
		}
		
		return (((Alpha>1)?Alpha:(Alpha * 255)) & 0xFF) << 24 | uint(red*255) << 16 | uint(green*255) << 8 | uint(blue*255);
	},

	getRGBA: function(Color, Results) {
		if(Results == null)
			Results = new Array();
		Results[0] = (Color >> 16) & 0xFF;
		Results[1] = (Color >> 8) & 0xFF;
		Results[2] = Color & 0xFF;
		Results[3] = Number((Color >> 24) & 0xFF) / 255;
		return Results;
	},

	//FIXME: Skipped completely for now. May not even be important outside Flash
	getClassName: function(Obj,Simple) {
		/*var s = getQualifiedClassName(Obj);
		s = s.replace("::",".");
		if(Simple)
			s = s.substr(s.lastIndexOf(".")+1);
		return s;*/
	},

	//FIXME: Also skipped
	getClass: function(Name) {
		//return getDefinitionByName(Name) as Class;
	},

	computeVelocity: function (Velocity, Acceleration, Drag, Max) {

		//Set default values for optional parameters
		Acceleration = (isNaN(Acceleration)) ? 0 : Acceleration;
		Max = (isNaN(Max)) ? 10000 : Max;
		Drag = (isNaN(Drag)) ? 0 : Drag;

		if(Acceleration != 0)
			Velocity += Acceleration*FlxG.elapsed;
		else if(Drag != 0)
		{
			var d = Drag*FlxG.elapsed;
			if(Velocity - d > 0)
				Velocity = Velocity - d;
			else if(Velocity + d < 0)
				Velocity += d;
			else
				Velocity = 0;
		}
		if((Velocity != 0) && (Max != 10000))
		{
			if(Velocity > Max)
				Velocity = Max;
			else if(Velocity < -Max)
				Velocity = -Max;
		}
		return Velocity;
	},

	setWorldBounds: function(X, Y, Width, Height, Divisions) {

		//Set default values for optional parameters
		X = (isNaN(X)) ? 0 : X;
		Y = (isNaN(Y)) ? 0 : Y;
		Width = (isNaN(Width)) ? 0 : Width;
		Height = (isNaN(Height)) ? 0 : Height;
		Divisions = (isNaN(Divisions)) ? 3 : Divisions;

		if(FlxQuadTree.bounds == null)
			FlxQuadTree.bounds = new FlxRect();
		FlxQuadTree.bounds.x = X;
		FlxQuadTree.bounds.y = Y;
		if(Width > 0)
			FlxQuadTree.bounds.width = Width;
		if(Height > 0)
			FlxQuadTree.bounds.height = Height;
		if(Divisions > 0)
			FlxQuadTree.divisions = Divisions;
	},

	overlap: function(Object1, Object2, Callback) {
		if( (Object1 == null) || !Object1.exists ||
			(Object2 == null) || !Object2.exists )
			return false;
		FlxU.quadTree = new FlxQuadTree(FlxQuadTree.bounds.x,FlxQuadTree.bounds.y,FlxQuadTree.bounds.width,FlxQuadTree.bounds.height);
		FlxU.quadTree.add(Object1,FlxQuadTree.A_LIST);
		if(Object1 === Object2)
			return FlxU.quadTree.overlap(false,Callback);
		FlxU.quadTree.add(Object2,FlxQuadTree.B_LIST);

		return FlxU.quadTree.overlap(true,Callback);
	},

	//FIXME: Strict comparison of Object1 and Object2 may not do what intended here. Test.
	collide: function(Object1, Object2) {
		if( (Object1 == null) || !Object1.exists ||
			(Object2 == null) || !Object2.exists )
			return false;
		FlxU.quadTree = new FlxQuadTree(FlxQuadTree.bounds.x,FlxQuadTree.bounds.y,FlxQuadTree.bounds.width,FlxQuadTree.bounds.height);
		FlxU.quadTree.add(Object1,FlxQuadTree.A_LIST);
		var match = (Object1 == Object2);
		if(!match)
			FlxU.quadTree.add(Object2, FlxQuadTree.B_LIST);
		var cx = FlxU.quadTree.overlap(!match, FlxU.solveXCollision);
		var cy = FlxU.quadTree.overlap(!match, FlxU.solveYCollision);
		return cx || cy;			
	}, 

	solveXCollision: function(Object1, Object2)
	{
		//Avoid messed up collisions ahead of time
		var o1 = Object1.colVector.x;
		var o2 = Object2.colVector.x;
		if(o1 == o2)
			return false;
		
		//Give the objects a heads up that we're about to resolve some collisions
		Object1.preCollide(Object2);
		Object2.preCollide(Object1);

		//Basic resolution variables
		var f1;
		var f2;
		var overlap;
		var hit = false;
		var p1hn2;
		
		//Directional variables
		var obj1Stopped = o1 == 0;
		var obj1MoveNeg = o1 < 0;
		var obj1MovePos = o1 > 0;
		var obj2Stopped = o2 == 0;
		var obj2MoveNeg = o2 < 0;
		var obj2MovePos = o2 > 0;
		
		//Offset loop variables
		var i1;
		var i2;
		var obj1Hull = Object1.colHullX;
		var obj2Hull = Object2.colHullX;
		var co1 = Object1.colOffsets;
		var co2 = Object2.colOffsets;
		var l1 = co1.length;
		var l2 = co2.length;
		var ox1;
		var oy1;
		var ox2;
		var oy2;
		var r1;
		var r2;
		var sv1;
		var sv2;
		
		//Decide based on object's movement patterns if it was a right-side or left-side collision
		p1hn2 = ((obj1Stopped && obj2MoveNeg) || (obj1MovePos && obj2Stopped) || (obj1MovePos && obj2MoveNeg) || //the obvious cases
				(obj1MoveNeg && obj2MoveNeg && (((o1>0)?o1:-o1) < ((o2>0)?o2:-o2))) || //both moving left, obj2 overtakes obj1
				(obj1MovePos && obj2MovePos && (((o1>0)?o1:-o1) > ((o2>0)?o2:-o2))) ); //both moving right, obj1 overtakes obj2
		
		//Check to see if these objects allow these collisions
		if(p1hn2?(!Object1.collideRight || !Object2.collideLeft):(!Object1.collideLeft || !Object2.collideRight))
			return false;
		
		//this looks insane, but we're just looping through collision offsets on each object
		i1 = 0;
		while(i1 < l1)
		{
			ox1 = co1[i1].x;
			oy1 = co1[i1].y;
			obj1Hull.x += ox1;
			obj1Hull.y += oy1;
			i2 = 0;
			while(i2 < l2)
			{
				ox2 = co2[i2].x;
				oy2 = co2[i2].y;
				obj2Hull.x += ox2;
				obj2Hull.y += oy2;
				
				//See if it's a actually a valid collision
				if( (obj1Hull.x + obj1Hull.width  < obj2Hull.x + FlxU.roundingError) ||
					(obj1Hull.x + FlxU.roundingError > obj2Hull.x + obj2Hull.width) ||
					(obj1Hull.y + obj1Hull.height < obj2Hull.y + FlxU.roundingError) ||
					(obj1Hull.y + FlxU.roundingError > obj2Hull.y + obj2Hull.height) )
				{
					obj2Hull.x = obj2Hull.x - ox2;
					obj2Hull.y = obj2Hull.y - oy2;
					i2++;
					continue;
				}

				//Calculate the overlap between the objects
				if(p1hn2)
				{
					if(obj1MoveNeg)
						r1 = obj1Hull.x + Object1.colHullY.width;
					else
						r1 = obj1Hull.x + obj1Hull.width;
					if(obj2MoveNeg)
						r2 = obj2Hull.x;
					else
						r2 = obj2Hull.x + obj2Hull.width - Object2.colHullY.width;
				}
				else
				{
					if(obj2MoveNeg)
						r1 = -obj2Hull.x - Object2.colHullY.width;
					else
						r1 = -obj2Hull.x - obj2Hull.width;
					if(obj1MoveNeg)
						r2 = -obj1Hull.x;
					else
						r2 = -obj1Hull.x - obj1Hull.width + Object1.colHullY.width;
				}
				overlap = r1 - r2;
				
				//Slightly smarter version of checking if objects are 'fixed' in space or not
				f1 = Object1.fixed;
				f2 = Object2.fixed;
				if(f1 && f2)
				{
					f1 = f1 && ((Object1.colVector.x == 0) && (o1 == 0));
					f2 = f2 && ((Object2.colVector.x == 0) && (o2 == 0));
				}

				//Last chance to skip out on a bogus collision resolution
				if( (overlap == 0) ||
					((!f1 && ((overlap>0)?overlap:-overlap) > obj1Hull.width*0.8)) ||
					((!f2 && ((overlap>0)?overlap:-overlap) > obj2Hull.width*0.8)) )
				{
					obj2Hull.x = obj2Hull.x - ox2;
					obj2Hull.y = obj2Hull.y - oy2;
					i2++;
					continue;
				}
				hit = true;
				
				//Adjust the objects according to their flags and stuff
				sv1 = Object2.velocity.x;
				sv2 = Object1.velocity.x;
				if(!f1 && f2)
				{
					if(Object1._group)
						Object1.reset(Object1.x - overlap,Object1.y);
					else
						Object1.x = Object1.x - overlap;
				}
				else if(f1 && !f2)
				{
					if(Object2._group)
						Object2.reset(Object2.x + overlap,Object2.y);
					else
						Object2.x += overlap;
				}
				else if(!f1 && !f2)
				{
					overlap /= 2;
					if(Object1._group)
						Object1.reset(Object1.x - overlap,Object1.y);
					else
						Object1.x = Object1.x - overlap;
					if(Object2._group)
						Object2.reset(Object2.x + overlap,Object2.y);
					else
						Object2.x += overlap;
					sv1 *= 0.5;
					sv2 *= 0.5;
				}
				if(p1hn2)
				{
					Object1.hitRight(Object2,sv1);
					Object2.hitLeft(Object1,sv2);
				}
				else
				{
					Object1.hitLeft(Object2,sv1);
					Object2.hitRight(Object1,sv2);
				}
				
				//Adjust collision hulls if necessary
				if(!f1 && (overlap != 0))
				{
					if(p1hn2)
						obj1Hull.width = obj1Hull.width - overlap;
					else
					{
						obj1Hull.x = obj1Hull.x - overlap;
						obj1Hull.width += overlap;
					}
					Object1.colHullY.x = Object1.colHullY.x - overlap;
				}
				if(!f2 && (overlap != 0))
				{
					if(p1hn2)
					{
						obj2Hull.x += overlap;
						obj2Hull.width = obj2Hull.width - overlap;
					}
					else
						obj2Hull.width += overlap;
					Object2.colHullY.x += overlap;
				}
				obj2Hull.x = obj2Hull.x - ox2;
				obj2Hull.y = obj2Hull.y - oy2;
				i2++;
			}
			obj1Hull.x = obj1Hull.x - ox1;
			obj1Hull.y = obj1Hull.y - oy1;
			i1++;
		}

		return hit;
	},


	solveYCollision: function(Object1, Object2)
	{
		//Avoid messed up collisions ahead of time
		var o1 = Object1.colVector.y;
		var o2 = Object2.colVector.y;
		if(o1 == o2)
			return false;
		
		//Give the objects a heads up that we're about to resolve some collisions
		Object1.preCollide(Object2);
		Object2.preCollide(Object1);
		
		//Basic resolution variables
		var f1;
		var f2;
		var overlap;
		var hit = false;
		var p1hn2;
		
		//Directional variables
		var obj1Stopped = o1 == 0;
		var obj1MoveNeg = o1 < 0;
		var obj1MovePos = o1 > 0;
		var obj2Stopped = o2 == 0;
		var obj2MoveNeg = o2 < 0;
		var obj2MovePos = o2 > 0;
		
		//Offset loop variables
		var i1;
		var i2;
		var obj1Hull = Object1.colHullY;
		var obj2Hull = Object2.colHullY;
		var co1 = Object1.colOffsets;
		var co2 = Object2.colOffsets;
		var l1 = co1.length;
		var l2 = co2.length;
		var ox1;
		var oy1;
		var ox2;
		var oy2;
		var r1;
		var r2;
		var sv1;
		var sv2;
		
		//Decide based on object's movement patterns if it was a top or bottom collision
		p1hn2 = ((obj1Stopped && obj2MoveNeg) || (obj1MovePos && obj2Stopped) || (obj1MovePos && obj2MoveNeg) || //the obvious cases
			(obj1MoveNeg && obj2MoveNeg && (((o1>0)?o1:-o1) < ((o2>0)?o2:-o2))) || //both moving up, obj2 overtakes obj1
			(obj1MovePos && obj2MovePos && (((o1>0)?o1:-o1) > ((o2>0)?o2:-o2))) ); //both moving down, obj1 overtakes obj2
		
		//Check to see if these objects allow these collisions
		if(p1hn2?(!Object1.collideBottom || !Object2.collideTop):(!Object1.collideTop || !Object2.collideBottom))
			return false;
		
		//this looks insane, but we're just looping through collision offsets on each object
		i1 = 0;
		while(i1 < l1)
		{
			ox1 = co1[i1].x;
			oy1 = co1[i1].y;
			obj1Hull.x += ox1;
			obj1Hull.y += oy1;
			i2 = 0;
			while(i2 < l2)
			{
				ox2 = co2[i2].x;
				oy2 = co2[i2].y;
				obj2Hull.x += ox2;
				obj2Hull.y += oy2;
				
				//See if it's a actually a valid collision
				if( (obj1Hull.x + obj1Hull.width  < obj2Hull.x + FlxU.roundingError) ||
					(obj1Hull.x + FlxU.roundingError > obj2Hull.x + obj2Hull.width) ||
					(obj1Hull.y + obj1Hull.height < obj2Hull.y + FlxU.roundingError) ||
					(obj1Hull.y + FlxU.roundingError > obj2Hull.y + obj2Hull.height) )
				{
					obj2Hull.x = obj2Hull.x - ox2;
					obj2Hull.y = obj2Hull.y - oy2;
					i2++;
					continue;
				}
				
				//Calculate the overlap between the objects
				if(p1hn2)
				{
					if(obj1MoveNeg)
						r1 = obj1Hull.y + Object1.colHullX.height;
					else
						r1 = obj1Hull.y + obj1Hull.height;
					if(obj2MoveNeg)
						r2 = obj2Hull.y;
					else
						r2 = obj2Hull.y + obj2Hull.height - Object2.colHullX.height;
				}
				else
				{
					if(obj2MoveNeg)
						r1 = -obj2Hull.y - Object2.colHullX.height;
					else
						r1 = -obj2Hull.y - obj2Hull.height;
					if(obj1MoveNeg)
						r2 = -obj1Hull.y;
					else
						r2 = -obj1Hull.y - obj1Hull.height + Object1.colHullX.height;
				}
				overlap = r1 - r2;
				
				//Slightly smarter version of checking if objects are 'fixed' in space or not
				f1 = Object1.fixed;
				f2 = Object2.fixed;
				if(f1 && f2)
				{
					f1 = f1 && ((Object1.colVector.x == 0) && (o1 == 0));
					f2 = f2 && ((Object2.colVector.x == 0) && (o2 == 0));
				}
				
				//Last chance to skip out on a bogus collision resolution
				if( (overlap == 0) ||
					((!f1 && ((overlap>0)?overlap:-overlap) > obj1Hull.height*0.8)) ||
					((!f2 && ((overlap>0)?overlap:-overlap) > obj2Hull.height*0.8)) )
				{
					obj2Hull.x = obj2Hull.x - ox2;
					obj2Hull.y = obj2Hull.y - oy2;
					i2++;
					continue;
				}
				hit = true;
				
				//Adjust the objects according to their flags and stuff
				sv1 = Object2.velocity.y;
				sv2 = Object1.velocity.y;
				if(!f1 && f2)
				{
					if(Object1._group)
						Object1.reset(Object1.x, Object1.y - overlap);
					else
						Object1.y = Object1.y - overlap;
				}
				else if(f1 && !f2)
				{
					if(Object2._group)
						Object2.reset(Object2.x, Object2.y + overlap);
					else
						Object2.y += overlap;
				}
				else if(!f1 && !f2)
				{
					overlap /= 2;
					if(Object1._group)
						Object1.reset(Object1.x, Object1.y - overlap);
					else
						Object1.y = Object1.y - overlap;
					if(Object2._group)
						Object2.reset(Object2.x, Object2.y + overlap);
					else
						Object2.y += overlap;
					sv1 *= 0.5;
					sv2 *= 0.5;
				}
				if(p1hn2)
				{
					Object1.hitBottom(Object2,sv1);
					Object2.hitTop(Object1,sv2);
				}
				else
				{
					Object1.hitTop(Object2,sv1);
					Object2.hitBottom(Object1,sv2);
				}
				
				//Adjust collision hulls if necessary
				if(!f1 && (overlap != 0))
				{
					if(p1hn2)
					{
						obj1Hull.y = obj1Hull.y - overlap;
						
						//This code helps stuff ride horizontally moving platforms.
						if(f2 && Object2.moves)
						{
							sv1 = Object2.colVector.x;
							Object1.x += sv1;
							obj1Hull.x += sv1;
							Object1.colHullX.x += sv1;
						}
					}
					else
					{
						obj1Hull.y = obj1Hull.y - overlap;
						obj1Hull.height += overlap;
					}
				}
				if(!f2 && (overlap != 0))
				{
					if(p1hn2)
					{
						obj2Hull.y += overlap;
						obj2Hull.height = obj2Hull.height - overlap;
					}
					else
					{
						obj2Hull.height += overlap;
					
						//This code helps stuff ride horizontally moving platforms.
						if(f1 && Object1.moves)
						{
							sv2 = Object1.colVector.x;
							Object2.x += sv2;
							obj2Hull.x += sv2;
							Object2.colHullX.x += sv2;
						}
					}
				}
				obj2Hull.x = obj2Hull.x - ox2;
				obj2Hull.y = obj2Hull.y - oy2;
				i2++;
			}
			obj1Hull.x = obj1Hull.x - ox1;
			obj1Hull.y = obj1Hull.y - oy1;
			i1++;
		}
		
		return hit;
	}


});

//Static class, so replace class definition with an instance of the class
FlxU = new FlxU();
FlxU.roundingError = 0.000001;
FlxU.quadTree = null;
