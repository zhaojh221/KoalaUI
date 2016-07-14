var datas = [];
for(var i=0;i<1000;i++){
	var data = {};
	data.id = "win" + i;
	data.icon = "icon/icon" + i%12 + ".png";
	data.title = i+1;
	
	datas.push(data);
}