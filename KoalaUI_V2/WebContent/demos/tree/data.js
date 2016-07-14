
var treeData = [];
for(var i=1;i<=100;i++){
	var p1 = {};
	p1.pid = "root";
	p1.id = "" + i;
	p1.title = "节点" + i;
	p1.href="#";
	p1.children = [];
	for(var j=1;j<=10;j++){
		var child = {};
		child.pid = i;
		child.title = "节点" + i * 100 + j;
		child.id = "" + i * 100 + j;
		child.href = "#";
		child.children = [];
		
		p1.children.push(child);
	}
	
	treeData.push(p1);
}