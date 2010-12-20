<?php
	/*
		TODO: For general auto-convertor, need to handle user-defined type annotations
			Need to rewrite annotation removing system completely, as the user could have
			called their class anything and this could destroy all sorts of unexpected bits of code
			Perhaps insert spacing into ternary operator statements so that we can safely delete any
				words after a colon
		Caveats:
			Has no respect for string literals. Will munch words inside strings that look like code
	*/
	$start = microtime(true);

	$as3_class_names = Array(
		"Rectangle", "Point", "BitmapData", "SoundChannel", "SoundTransform",
		"Event", "Class", "Matrix", "ColorTransform", "Sprite", "KeyboardEvent", "TextField",
		"Stage", "Function", "MouseEvent", "Graphics"); //also: Bitmap, Sound

	$class_list = "";
	while ($c = array_pop($as3_class_names)) {
		if (count($as3_class_names) > 0) {
			$c .= "|";
		}
		$class_list .= $c;
	}
	$class_regex = "@:(?:$class_list)[ ;]??@";



	///Reformat and extract important class information

	$all_code = Array();

	chdir('org/flixel');
	$file_list = list_some_files('as');
	$classes = Array();
	foreach ($file_list as $filename => $parts) {
		$str = file_get_contents($filename);
		$str = class_format($str);
		$all_code[] = $str;
		$classes = array_merge($classes, class_extract($str));
	}

	chdir('data');
	$file_list = list_some_files('as');
	foreach ($file_list as $filename => $parts) {
		$str = file_get_contents($filename);
		$str = class_format($str);
		$all_code[] = $str;
		$classes = array_merge($classes, class_extract($str));
	}


	//Ugly little loop to climb up the class tree and combine tokens into the token list for the child
	foreach ($classes as $class_name => $contents) {
		$extends =  $contents['extends'];
			//extends will either be a class name or boolean false
			//check with isset to make sure it's a user class. Some classes like Sprite might be in there
		if ($extends && isset($classes[$extends])) {
				//first combine the tokens of the immediate parent
			$classes[$class_name]['tokens'] = array_merge($classes[$class_name]['tokens'], $classes[$extends]['tokens']);
				//then climb up through each successive parent thereafter
			$parent_extends = $classes[$extends]['extends'];
			while ($parent_extends != false && is_array($classes[$parent_extends])) {
				$classes[$class_name]['tokens'] = array_merge($classes[$class_name]['tokens'], $classes[$parent_extends]['tokens']);
				$parent_extends = $classes[$parent_extends]['extends'];
			}
		}
		$classes[$class_name]['tokens'] = array_unique($classes[$class_name]['tokens']);
	}


	$in_class = false;
	$in_method = false;
	$current_method = "";
	$current_class = "";
	$code_out = array();
	$brace_count = 0;

	//step through each class...
	foreach ($all_code as $c) {

		preg_match('@(?:dynamic )?(?:public|internal) class (\w+)(?: extends (\w+))?@', $c, $matches);
		$name = $matches[1];

		$code_lines = explode("\n", $c);
		$tokens = implode("|", $classes[$name]['tokens']);
		var_dump($tokens);

		//step through each line of the current class
		foreach ($code_lines as $line) {
			$brace_count += substr_count($line, "{");
			$brace_count -= substr_count($line, "}");
			if ($brace_count == 1) {
				$in_class = true;
			} else if ($brace_count == 0)  {
				$in_class = false;
			}

			if ($brace_count <= 1) {
				if ($in_method) {
					$code_out[] = "}";
				}
				$in_method = false;
			}

			if ($in_method) {
				$line = preg_replace("@([^.])((?:$tokens))@", "$1this.$2", $line);
				$code_out[] = $line;
			}

			if ($brace_count == 2 && preg_match('@function (?:(get|set) )?(\w+)\s*\(.*\)@', $line, $m)) {
				$in_method = true;
				$get_set = $m[1];
				$mutator = ($m[1] !== "") ? true : false;
				$name = $m[2];
				if ($mutator) {
					$new_name = $m[1] . ucfirst($name);
					$code_out[] = "$new_name: function({$class_mutators[$name][$get_set]['params']}) {";
				} else {
					$code_out[] = "$name: function({$class_methods[$name]['param_str']}) {";
				}
			}
		}

	}

	/*$code_out[] = "$class_name = new Class({";
	if ($extends) {
		$code_out[] = "Extends: $extends,";
	}
	$code_out[] = "initialize: function({$class_methods[$class_name]['param_str']}) {";*/


	//echo $str;
	//var_dump($code_out);
	//foreach($code_out as $line) { echo "$line\n"; }










/*****************************************************************/

	function class_format($str) {

		global $class_regex;

		$str = preg_replace('@\r\n@', "\n", $str);				//convert windows line-endings to unix
		$str = preg_replace('@/\*\*.+?\*/@s', '', $str); 		//removes doc comments - /**      */
		$str = preg_replace('@/\*.+\*/@s', '', $str);			//removes other multi-line comments
		$str = preg_replace('@//.+?$@m', '', $str); 			//remove single-line comments
			//change uint casts to Math.floor
			//do this step BEFORE "as" casting! (int/uint casts truncate floats)
		$str = preg_replace('@\W(?:uint|int)\((.+)\)@', 'Math.floor($1)', $str);
			//turns "as uint"/"as int" casts into Math.floor calls
			//EX: _data[d+c] as uint becomes Math.floor(_data[d+c])
			//Also removes extra parenthesis if it's a group e.g: (_data[rs+c] as uint)
		$str = preg_replace('@\(?([A-Za-z_.\[\]\+]+) as (?:uint|int)\)?@', 'Math.floor($1)', $str);
		$str = preg_replace('/ as [A-zA-z_]+/', '', $str);		//remove other "as" casting
			//superclass methods...with backreferences. Matches super() or super(X, Y), etc but not super.update()
			//This is the magic that pulls out the () with all parameters inside: \(([^\)]*)\)
		$str = preg_replace('@super\(([^\)]*)\)@', 'this.parent($1)', $str);
			//replaces: super.method(X,Y) with: this.parent(X, Y)
		$str = preg_replace('@super\.[A-Za-z_]+\(([^\)]*)\)@', 'this.parent($1)', $str);
		$str = preg_replace('@ is @', ' instanceof ', $str);
			 //remove standard type annotations, including untyped - :*
		$str = preg_replace('@:(?:uint|String|Array|void|int|Number|Boolean|Object|\*)@', '', $str);
			//remove type annotations corresponding to AS3 class names
		$str = preg_replace($class_regex, '', $str);
			//remove annotations corresponding to Flixel classes
		$str = preg_replace('@:Flx[A-ZA-z]+@', '', $str);
			//remove embeds FOR NOW. Later, we want to feed these into the asset system
		$str = preg_replace('@\[Embed.+?\;@sm', '', $str);
		$str = preg_replace('@import.+?;@', '', $str);			//remove import lines (useless to us)
		$str = preg_replace('/\n\s*{/', ' {', $str); 			//move { at the end of a line up
		$str = preg_replace('@^package .*{@m', '', $str);		//remove package definition
		$str = preg_replace('@}$@', '', $str);					//remove } at the very end (end of package)
		$str = preg_replace('@^\s+?\n@m', '', $str); 			//remove empty lines

		return $str;
	}

	function class_extract($str) {

		///Extracts into into:
		///		$class_name, $extends, $class_constants, $class_props, $class_static, $found_methods

		//Pull out the class name and the class it extends (if any)
		preg_match('@(?:dynamic )?(?:public|internal) class (\w+)(?: extends (\w+))?@', $str, $matches);
		$class_name = $matches[1];
		$extends = isset($matches[2]) ? $matches[2] : false;

		/**Pull out class properties. Catch values of constants
			public var, protected var, static protected var, static public const something = 0
			get each kind one at a time **/

		//First, normalize the order of static (make it come first)
		$str = preg_replace('@^(\s*)(public|protected|private|internal) static var@m', '$1static $2 var', $str);
		$str = preg_replace('@^(\s*)(public|protected|private|internal) static function@m', '$1static $2 function', $str);

			//class constants
		preg_match_all('@static (?:public|protected) const (\w+) = (.+);@', $str, $class_constants);
			//normal class properties
		preg_match_all('@(?:public|protected|private) var (\w+);@', $str, $class_props);				
			//static class properties
		preg_match_all('@static (?:public|protected|private|internal) var (\w+);@', $str, $class_static);		
			//Class methods. Includes getters and setters
			//NOTE: Had to update parameter capturing to be non-greedy - (.*?) and (.+?) - in case a function is
			//defined on one, line as with flicker() and flickering() in FlxObject
		preg_match_all('@(?:override )?(static)?\s*(?:public|protected|private|internal) function (?:(get|set) )?(.+?)\((.*?)\)@', $str, $found_methods);

		///Loop through and separate out getters/setters from other methods

		$class_mutators = Array();
		$class_methods = Array();
		$class_tokens = Array();
		$class_tokens = $class_props[1];

		for ($i = 0; $i < count($found_methods[0]); $i++) {
			//0 - full match, 1-static, 2-get/set, 3-method name, 4-params
			$is_static = (array_shift($found_methods[1]) === "static") ? true : false;
			$get_set = array_shift($found_methods[2]);
			$name = array_shift($found_methods[3]);
			$params = array_shift($found_methods[4]);
			$class_tokens[] = $name;

			if ($get_set !== "") {
				$class_mutators[$name][$get_set] = Array('static' => $is_static, 'params' => $params);
			} else {
				$params = preg_replace('@\s*,\s*@', ',', $params);	//remove spaces between commas
				$params = preg_replace('@\s*=\s*@', '=', $params);	//remove spaces between equals signs
				$method_params = false;
				$param_list = Array();
				$method_params = Array();
				$param_str = "";
				if ($params !== "") {	//if a method has a param list...
					$p = explode(',', $params);	//get each param separately
					foreach ($p as $v) {	//handle default values. Record false if it has none, otherwise find defaul val
						$has_default = false;
						$default_val = null;
						$default_numeric = false;
						if (str_contains($v, "=")) { //equals sign means it does have defaults. process them
							$has_default = true;
							$defaults = explode("=", $v);
							$param_name = $defaults[0];
							$default_val = $defaults[1];
							$default_numeric = is_numeric($default_val) ? true : false;
						} else {
							$param_name = $v;
						}
						$param_list[] = $param_name;
						$method_params[$param_name] = Array(
								'has_default' => $has_default, 'val' => $default_val, 'is_numeric' => $default_numeric
						);
					}
				}

				$param_str = implode(", ", $param_list);
				$class_methods[$name] = Array(
					'param_str' => $param_str, 'static' => $is_static,
					'params' => $method_params, 'code' => ''
				);
			}
		}

		return Array($class_name => Array(
			'extends' => $extends, 'mutators' => $class_mutators, 'methods' => $class_methods,
			'properties' => $class_props[1], 'statics' => $class_static[1],
			 'constants' => Array('name' => $class_constants[1], 'value' => $class_constants[2]),
			'tokens' => $class_tokens
			)
		);
	}


	function str_contains($haystack, $needle) {
		return (strpos($haystack, $needle) !== false) ?  true : false;
	}

	function list_dirs() {
		foreach (scandir(getcwd()) as $d) {
			if (is_dir($d) && $d != "." && $d != "..") { $dirs[] = $d; }
		}
		return $dirs;
	}

	function list_files() {
		foreach (scandir(getcwd()) as $f) {
			if (is_file($f) && $f != "." && $f != "..") { $files[] = $f; }
		}
		return $files;
	}

	//List only files with certain extensions
	//exclude hidden files (starting with . or ending with ~)
	//	For now, this is not optional, they're just hidden
	//	* to list files with any extension
	//Returns: A 2-dimensional array, [full filename] = [name, ext]
	function list_some_files($allowed_ext, $show_hidden = false) {
		$files = array();
		$list = list_files();
		$allowed = array();

		if ($allowed_ext === "*") {
			$show_all = true;
		} else {
			$allowed_ext = explode(",", $allowed_ext);
		}

		foreach ($list as $f) {
			$leading_period = false;
			$hidden = false;
			$tilde = false;

			if (strpos($f, "~") == strlen($f) - 1) { $tilde = true; $hidden = true; }
			if (strpos($f, ".") === 0) { $leading_period = true; $hidden = true; }

			$s = str_replace('~', '', $f);
			if (!$leading_period && !$tilde) {
				$split = explode(".", $s);
				$extension = array_pop($split);
				$name = implode($split, ".");
				if ($show_all || in_array($extension, $allowed_ext)) {
					$files[$s] = Array('name' => $name, 'ext' => $extension, 'full_path' => getcwd() . "/" . $s);
				}
			}
		}

		return $files;
	}

?>