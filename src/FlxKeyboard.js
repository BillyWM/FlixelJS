FlxKeyboard = new Class({

	Extends: FlxInput,

	initialize: function() {
		this.parent();

		var i;
		
		//LETTERS
		i = 65;
		while(i <= 90)
			this.addKey(String.fromCharCode(i), i++);
		
		//NUMBERS
		i = 48;
		this.addKey("ZERO",i++);
		this.addKey("ONE",i++);
		this.addKey("TWO",i++);
		this.addKey("THREE",i++);
		this.addKey("FOUR",i++);
		this.addKey("FIVE",i++);
		this.addKey("SIX",i++);
		this.addKey("SEVEN",i++);
		this.addKey("EIGHT",i++);
		this.addKey("NINE",i++);
		i = 96;
		this.addKey("NUMPADZERO",i++);
		this.addKey("NUMPADONE",i++);
		this.addKey("NUMPADTWO",i++);
		this.addKey("NUMPADTHREE",i++);
		this.addKey("NUMPADFOUR",i++);
		this.addKey("NUMPADFIVE",i++);
		this.addKey("NUMPADSIX",i++);
		this.addKey("NUMPADSEVEN",i++);
		this.addKey("NUMPADEIGHT",i++);
		this.addKey("NUMPADNINE",i++);
		
		//FUNCTION KEYS
		i = 1;
		while(i <= 12)
			this.addKey("F"+i,111+(i++));
		
		//SPECIAL KEYS + PUNCTUATION
		this.addKey("ESCAPE",27);
		this.addKey("MINUS",189);
		this.addKey("NUMPADMINUS",109);
		this.addKey("PLUS",187);
		this.addKey("NUMPADPLUS",107);
		this.addKey("DELETE",46);
		this.addKey("BACKSPACE",8);
		this.addKey("LBRACKET",219);
		this.addKey("RBRACKET",221);
		this.addKey("BACKSLASH",220);
		this.addKey("CAPSLOCK",20);
		this.addKey("SEMICOLON",186);
		this.addKey("QUOTE",222);
		this.addKey("ENTER",13);
		this.addKey("SHIFT",16);
		this.addKey("COMMA",188);
		this.addKey("PERIOD",190);
		this.addKey("NUMPADPERIOD",110);
		this.addKey("SLASH",191);
		this.addKey("NUMPADSLASH",191);
		this.addKey("CONTROL",17);
		this.addKey("ALT",18);
		this.addKey("SPACE",32);
		this.addKey("UP",38);
		this.addKey("DOWN",40);
		this.addKey("LEFT",37);
		this.addKey("RIGHT",39);
	}

});
