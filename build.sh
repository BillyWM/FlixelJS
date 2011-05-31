echo "" > build/flixel.js
for a in $(cat build_list.txt)
do
	cat ${a} >> build/flixel.js
done