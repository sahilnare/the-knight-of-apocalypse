window.onload = (event) => {
	var parentElement = document.getElementById("container");
	var childElement = document.getElementById("loader");
	parentElement.removeChild(childElement);
	const canvas = document.getElementById("canvas"); // Get the canvas element 
	const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

	QuickTreeGenerator = function(sizeBranch, sizeTrunk, radius, trunkMaterial, leafMaterial, scene) {

	    var treeparent = BABYLON.Mesh.CreatePlane("treeparent", scene);
	    treeparent.isVisible = false;
	    
	    var leaves = new BABYLON.Mesh("leaves", scene);
	    
	    //var vertexData = BABYLON.VertexData.CreateSphere(2,sizeBranch); //this line for BABYLONJS2.2 or earlier
	    var vertexData = BABYLON.VertexData.CreateSphere({segments:2, diameter:sizeBranch}); //this line for BABYLONJS2.3 or later
	    
	    vertexData.applyToMesh(leaves, false);

	    var positions = leaves.getVerticesData(BABYLON.VertexBuffer.PositionKind);
	    var indices = leaves.getIndices();
	    var numberOfPoints = positions.length/3;

	    var map = [];

	    // The higher point in the sphere
	    var v3 = BABYLON.Vector3;
	    var max = [];

	    for (var i=0; i<numberOfPoints; i++) {
	        var p = new v3(positions[i*3], positions[i*3+1], positions[i*3+2]);

	        if (p.y >= sizeBranch/2) {
	            max.push(p);
	        }

	        var found = false;
	        for (var index=0; index<map.length&&!found; index++) {
	            var array = map[index];
	            var p0 = array[0];
	            if (p0.equals (p) || (p0.subtract(p)).lengthSquared() < 0.01){
	                array.push(i*3);
	                found = true;
	            }
	        }
	        if (!found) {
	            var array = [];
	            array.push(p, i*3);
	            map.push(array);
	        }

	    }
	    var randomNumber = function (min, max) {
	        if (min == max) {
	            return (min);
	        }
	        var random = Math.random();
	        return ((random * (max - min)) + min);
	    };

	    map.forEach(function(array) {
	        var index, min = -sizeBranch/10, max = sizeBranch/10;
	        var rx = randomNumber(min,max);
	        var ry = randomNumber(min,max);
	        var rz = randomNumber(min,max);

	        for (index = 1; index<array.length; index++) {
	            var i = array[index];
	            positions[i] += rx;
	            positions[i+1] += ry;
	            positions[i+2] += rz;
	        }
	    });

	    leaves.setVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
	    var normals = [];
	    BABYLON.VertexData.ComputeNormals(positions, indices, normals);
	    leaves.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
	    leaves.convertToFlatShadedMesh();
	    
	    leaves.material = leafMaterial;
	    leaves.position.y = sizeTrunk+sizeBranch/2-2;

	    var trunk = BABYLON.Mesh.CreateCylinder("trunk", sizeTrunk, radius-2<1?1:radius-2, radius, 10, 2, scene );
	    
	    trunk.position.y = (sizeBranch/2+2)-sizeTrunk/2;

	    trunk.material = trunkMaterial;
	    trunk.convertToFlatShadedMesh();
	    
	    leaves.parent = treeparent;
	    trunk.parent = treeparent;
	    var mTree = BABYLON.Mesh.MergeMeshes([treeparent, trunk, leaves], true, true, undefined, false, true);

	    return mTree;

	};

	let GAMEOVER = false;
	let dispose = false;


	const createScene = function () {
		
	    // Create scene
		const scene = new BABYLON.Scene(engine);
		// scene.debugLayer.show();
		scene.autoClear = false;
		scene.autoClearDepthAndStencil = false;

		//Important variables

		let PAUSE = true;
		let HASGUN = true;
		let ghostCount = 10;


		// Fog
		scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
		scene.fogDensity = 0.005;

		//GUI
	    const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("myUI");


	    // Camera
	    const camera = new BABYLON.UniversalCamera("UniversalCamera", new BABYLON.Vector3(220, 4, 270), scene);
	    camera.setTarget(new BABYLON.Vector3(220, 4, 100));
	    camera.angularSensibility = 3000;
	    camera.attachControl(canvas, true);
	    camera.keysUp = [87];
	    camera.keysDown = [83];
	    camera.keysLeft = [65];
	    camera.keysRight = [68];

	    // Lights
	    scene.ambientColor = new BABYLON.Color3(0.8, 0.8, 0.8);
	    const light1 = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0.2, 1, 0), scene);
	    light1.groundColor = new BABYLON.Color3(0, 0, 0);
	    light1.diffuse = new BABYLON.Color3(0.9, 0.9, 0.9);
	    light1.specular = new BABYLON.Color3(0.1, 0.1, 0.1);
	    light1.intensity = 0.05;
	    const light2 = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(0.3, -1, 0.3), scene);
	    light2.position = new BABYLON.Vector3(0, 60, 0);
	    light2.diffuse = new BABYLON.Color3(1, 1, 1);
	    light2.specular = new BABYLON.Color3(0.1, 0.1, 0.1);
	    light2.intensity = 0.05;

	    

	    // Skybox
	    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:1000.0}, scene);
		const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
		skyboxMaterial.backFaceCulling = false;
		skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/yellowcloud", scene);
		skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
		skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
		skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
		skybox.material = skyboxMaterial;
		// skybox.renderingGroupId = 0;


		const scope = new BABYLON.GUI.Ellipse();
	    scope.width = "20px"
	    scope.height = "20px";
	    scope.color = "White";
	    scope.thickness = 2;
	    scope.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
	    scope.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
		advancedTexture.addControl(scope);

		const scope2 = new BABYLON.GUI.Ellipse();
	    scope2.width = "3px"
	    scope2.height = "3px";
	    scope2.color = "White";
	    scope2.thickness = 2;
	    scope2.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
	    scope2.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
		advancedTexture.addControl(scope2);

		// const text1 = new BABYLON.GUI.TextBlock();
		// text1.text = "Wraiths Left: " + ghostCount;
	    // text1.color = "White";
	    // text1.fontSize = 30;
	    // text1.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
		// text1.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
		// text1.top = "20px";
	    // text1.left = "20px";
		// advancedTexture.addControl(text1);

		const text2 = new BABYLON.GUI.TextBlock();
		text2.text = "Game Over";
	    text2.color = "White";
	    text2.fontSize = 64;
	    text2.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
		text2.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
		text2.isVisible = false;
		advancedTexture.addControl(text2);

		const text3 = new BABYLON.GUI.TextBlock();
		text3.text = "To be Continued...";
	    text3.color = "White";
	    text3.fontSize = 64;
	    text3.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
		text3.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
		text3.isVisible = false;
		advancedTexture.addControl(text3);

		const openingText = new BABYLON.GUI.TextBlock();
		openingText.text = "Kill all the Wraiths\nBe aware of the Monster,\nit cannot be killed permanently\nAfter killing the Wraiths,\ngo to the bunker in the forest";
	    openingText.color = "White";
	    openingText.fontSize = 64;
	    openingText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
		openingText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
		openingText.isVisible = false;
		advancedTexture.addControl(openingText);

		//Map
		// let gameMap = new BABYLON.GUI.Rectangle();
	 //    gameMap.width = "200px";
	 //    gameMap.height = "200px";
	 //    gameMap.cornerRadius = 4;
	 //    gameMap.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
	 //    gameMap.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
	 //    gameMap.color = "orange";
	 //    gameMap.thickness = 3;
	 //    gameMap.background = "orange";
	 //    advancedTexture.addControl(gameMap);

	 //    const mapPlayerPos = new BABYLON.GUI.Ellipse();
	 //    mapPlayerPos.width = "4px"
	 //    mapPlayerPos.height = "4px";
	 //    mapPlayerPos.color = "black";
	 //    mapPlayerPos.thickness = 2;
	 //    mapPlayerPos.background = "black";
	 //    mapPlayerPos.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
	 //    mapPlayerPos.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
	 //    mapPlayerPos.top = "100px";
	 //    mapPlayerPos.right = "100px";
		// advancedTexture.addControl(mapPlayerPos);

		// function mapUpdate() {
		// 	mapPlayerPos.top = 100 + "px";
		// 	mapPlayerPos.right = 100 + "px";
		// }

	    
	    //Health Bar
		let sheal = new BABYLON.GUI.Rectangle();
	    sheal.width = 0.3;
	    sheal.height = "30px";
	    sheal.cornerRadius = 20;
	    sheal.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
	    sheal.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
	    sheal.top = "20px";
	    sheal.left = "20px";
	    sheal.color = "green";
	    sheal.thickness = 3;
	    sheal.background = "green";
	    advancedTexture.addControl(sheal);

	    let playerHealth = 60;
	    // sheal.linkWithMesh(camera);  
	    // sheal.linkOffsetY = -80;

	    function updateHealth() {
	    	sheal.width = playerHealth/200;
	    	if(playerHealth < 0.005) {
	    		playerHealth = 0;
	    	}
	    }



		const borderMesh = BABYLON.MeshBuilder.CreateBox("border0", {width:1, height:1, depth:1}, scene);
	    borderMesh.isVisible = false;

	    const border0 = borderMesh.createInstance("border0");
	    border0.scaling = new BABYLON.Vector3(10, 30, 400);
	    border0.position = new BABYLON.Vector3(-105, 0, 100);
	    border0.isVisible = false;
	    border0.freezeWorldMatrix();

	    const border1 = borderMesh.createInstance("border1");
	    border1.scaling = new BABYLON.Vector3(400, 30, 10);
	    border1.position = new BABYLON.Vector3(100, 0, -105);
	    border1.isVisible = false;
	    border1.freezeWorldMatrix();

	    const border2 = borderMesh.createInstance("border2");
	    border2.scaling = new BABYLON.Vector3(10, 30, 400);
	    border2.position = new BABYLON.Vector3(305, 0, 100);
	    border2.isVisible = false;
	    border2.freezeWorldMatrix();

	    const border3 = borderMesh.createInstance("border3");
	    border3.scaling = new BABYLON.Vector3(400, 30, 10);
	    border3.position = new BABYLON.Vector3(100, 0, 305);
		border3.isVisible = false;
		border3.freezeWorldMatrix();

		const buildingborder1 = BABYLON.MeshBuilder.CreateBox("borderbuilding", {width:34, height:60, depth:70}, scene);
	    buildingborder1.position = new BABYLON.Vector3(142, 30, -31);
		buildingborder1.isVisible = false;
		buildingborder1.freezeWorldMatrix();

		const buildingborder2 = BABYLON.MeshBuilder.CreateBox("borderbuilding", {width:40, height:40, depth:42}, scene);
	    buildingborder2.position = new BABYLON.Vector3(149, 20, 51);
		buildingborder2.isVisible = false;
		buildingborder2.freezeWorldMatrix();

		const buildingborder3 = buildingborder2.createInstance("borderbuilding");
	    buildingborder3.position = new BABYLON.Vector3(149, 20, 106);
		buildingborder3.isVisible = false;
		buildingborder3.freezeWorldMatrix();

		const buildingborder4 = BABYLON.MeshBuilder.CreateBox("border0", {width:72, height:30, depth:25}, scene);
	    buildingborder4.position = new BABYLON.Vector3(80, 0, 142);
		buildingborder4.isVisible = false;
		buildingborder4.freezeWorldMatrix();

		const buildingborder5 = BABYLON.MeshBuilder.CreateBox("border0", {width:47, height:50, depth:34}, scene);
	    buildingborder5.position = new BABYLON.Vector3(0, 0, 131);
		buildingborder5.isVisible = false;
		buildingborder5.freezeWorldMatrix();

		const fountainborder1 = BABYLON.MeshBuilder.CreateBox("borderfountain", {width:33, height:50, depth:34}, scene);
	    fountainborder1.position = new BABYLON.Vector3(220, 0, 81);
		fountainborder1.isVisible = false;
		fountainborder1.freezeWorldMatrix();

		const carsborder1 = BABYLON.MeshBuilder.CreateBox("border0", {width:20, height:30, depth:28}, scene);
	    carsborder1.position = new BABYLON.Vector3(132, 0, 195);
		carsborder1.isVisible = false;
		carsborder1.freezeWorldMatrix();

		const carborder1 = BABYLON.MeshBuilder.CreateBox("border0", {width:23, height:30, depth:12}, scene);
	    carborder1.position = new BABYLON.Vector3(42, 0, 185);
		carborder1.isVisible = false;
		carborder1.freezeWorldMatrix();

		const tankborder = BABYLON.MeshBuilder.CreateBox("border0", {width:30, height:10, depth:58}, scene);
	    tankborder.position = new BABYLON.Vector3(0, 0, 210);
		tankborder.isVisible = false;
		tankborder.freezeWorldMatrix();

		const warehouseBorder = BABYLON.MeshBuilder.CreateBox("border0", {width: 1, height: 20, depth: 28}, scene);
		warehouseBorder.position = new BABYLON.Vector3(233, 0, 265);
		warehouseBorder.isVisible = false;
		warehouseBorder.freezeWorldMatrix();

		const warehouseBorder2 = warehouseBorder.createInstance("border0");
		warehouseBorder2.position = new BABYLON.Vector3(207, 0, 265);
		warehouseBorder2.isVisible = false;
		warehouseBorder2.freezeWorldMatrix();
		
		const warehouseBorder3 = BABYLON.MeshBuilder.CreateBox("border0", {width: 16, height: 20, depth: 2}, scene);
		warehouseBorder3.position = new BABYLON.Vector3(225, 0, 250);
		warehouseBorder3.isVisible = false;
		warehouseBorder3.freezeWorldMatrix();

		const warehouseBorder4 = BABYLON.MeshBuilder.CreateBox("border0", {width: 5, height: 20, depth: 2}, scene);
		warehouseBorder4.position = new BABYLON.Vector3(210, 0, 250);
		warehouseBorder4.isVisible = false;
		warehouseBorder4.freezeWorldMatrix();

		const warehouseBorder5 = BABYLON.MeshBuilder.CreateBox("border0", {width: 26, height: 20, depth: 1}, scene);
		warehouseBorder5.position = new BABYLON.Vector3(220, 0, 279);
		warehouseBorder5.isVisible = false;
		warehouseBorder5.freezeWorldMatrix();

		const bunkerBorder = BABYLON.MeshBuilder.CreateBox("border0", {width: 35, height: 35, depth: 2}, scene);
		bunkerBorder.position = new BABYLON.Vector3(-83, 0, 16);
		bunkerBorder.isVisible = false;
		bunkerBorder.freezeWorldMatrix();

		const bunkerBorder2 = BABYLON.MeshBuilder.CreateBox("border0", {width: 35, height: 35, depth: 2}, scene);
		bunkerBorder2.position = new BABYLON.Vector3(-83, 0, -13);
		bunkerBorder2.isVisible = false;
		bunkerBorder2.freezeWorldMatrix();

		const bunkerBorder3 = BABYLON.MeshBuilder.CreateBox("border0", {width: 2, height: 35, depth: 16}, scene);
		bunkerBorder3.position = new BABYLON.Vector3(-65, 0, -4);
		bunkerBorder3.isVisible = false;
		bunkerBorder3.freezeWorldMatrix();

		const bunkerBorderDoor = BABYLON.MeshBuilder.CreateBox("border0", {width: 2, height: 40, depth: 10}, scene);
		bunkerBorderDoor.position = new BABYLON.Vector3(-65, 0, 9.5);
		bunkerBorderDoor.isVisible = false;
		bunkerBorderDoor.freezeWorldMatrix();

	    
		// Trees

		const trunkMaterial = new BABYLON.StandardMaterial("trunkmaterial", scene);
		trunkMaterial.diffuseColor = new BABYLON.Color3(0.5, 0, 0);

		const leafMaterial = new BABYLON.StandardMaterial("leafmaterial", scene);
		leafMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);

		const treeMesh = QuickTreeGenerator(15, 10, 3, trunkMaterial, leafMaterial, scene);

	    const rotateTree = function() {
		    min = Math.ceil(-314);
		    max = Math.floor(314);
		    return (Math.floor(Math.random() * (max - min + 1)) + min)/100;
		}

	    function randTree(n) {
	    	const tree = treeMesh.createInstance(n);
	    	tree.position = new BABYLON.Vector3(Math.floor(Math.random()*199)-100, 0, Math.floor(Math.random()*199)-100);
	    	tree.rotation.y = rotateTree();
	    	return tree;
	    }

	    const trees = [];
	    let i;
	    for(i = 1; i <= 200; i++) {
	    	trees.push(randTree(i + ''));
		}
		
		//Till here

		// function randTree(n) {
		// 	let i = 0;
		// 	for (i = 1; i <= n; i++) {
		// 		BABYLON.SceneLoader.ImportMesh("", "textures/tree/", "scene.gltf", scene, function (tree) {
		// 			tree[0].scaling = new BABYLON.Vector3(0.15, 0.15, 0.15);
		// 			tree[0].rotation = new BABYLON.Vector3(0, 0, 0);
		// 			tree[0].position = new BABYLON.Vector3(Math.floor(Math.random()*199)-100, 0, Math.floor(Math.random()*199)-100);
		// 		});
		// 	}
		// }
		
		// randTree(50);



		// Ground
		const forestGroundMaterial = new BABYLON.StandardMaterial("forest-ground-material", scene);
		forestGroundMaterial.diffuseTexture = new BABYLON.Texture("textures/grass.png", scene);
		forestGroundMaterial.bumpTexture = new BABYLON.Texture("textures/grassn.png", scene);
		forestGroundMaterial.diffuseTexture.uScale = forestGroundMaterial.diffuseTexture.vScale = 10;
		forestGroundMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
		forestGroundMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
		forestGroundMaterial.specularPower = 32;
		forestGroundMaterial.freeze();

		const cityGroundMaterial = new BABYLON.StandardMaterial("city-ground-material", scene);
		cityGroundMaterial.diffuseTexture = new BABYLON.Texture("textures/floor.png", scene);
		cityGroundMaterial.bumpTexture = new BABYLON.Texture("textures/floorn.png", scene);
		cityGroundMaterial.diffuseTexture.uScale = cityGroundMaterial.diffuseTexture.vScale = 10;
		cityGroundMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
		cityGroundMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
		cityGroundMaterial.specularPower = 32;
		cityGroundMaterial.freeze();

		const forestGroundMesh = BABYLON.MeshBuilder.CreateGround("ground",{width: 100, height: 100}, scene);
		forestGroundMesh.ambientColor = new BABYLON.Color3(0.5, 0.5, 0.5);
		forestGroundMesh.material = forestGroundMaterial;
		forestGroundMesh.position = new BABYLON.Vector3(0, 0, 0);
		forestGroundMesh.isVisible = false;

		const cityGroundMesh = BABYLON.MeshBuilder.CreateGround("ground",{width: 100, height: 100}, scene);
		cityGroundMesh.ambientColor = new BABYLON.Color3(0.5, 0.5, 0.5);
		cityGroundMesh.material = cityGroundMaterial;
		cityGroundMesh.position = new BABYLON.Vector3(0, 0, 0);
		cityGroundMesh.isVisible = false;

		function createForestGround(n, x, y, z) {
			const ground = forestGroundMesh.createInstance(n);
			ground.position = new BABYLON.Vector3(x, y, z);
			ground.freezeWorldMatrix();
			return ground;
		}

		function createCityGround(n, x, y, z) {
			const ground = cityGroundMesh.createInstance(n);
			ground.position = new BABYLON.Vector3(x, y, z);
			ground.freezeWorldMatrix();
			return ground;
		}

		const forestGround1 = createForestGround('0', -50, 0, -50);
		const forestGround2 = createForestGround('1', 50, 0, -50);
		const forestGround3 = createForestGround('2', -50, 0, 50);
		const forestGround4 = createForestGround('3', 50, 0, 50);

		const cityGroundA1 = createCityGround('4', 150, 0, -50);
		const cityGroundA2 = createCityGround('5', 250, 0, -50);
		const cityGroundA3 = createCityGround('6', 150, 0, 50);
		const cityGroundA4 = createCityGround('7', 250, 0, 50);

		const cityGroundB1 = createCityGround('8', 150, 0, 150);
		const cityGroundB2 = createCityGround('9', 250, 0, 150);
		const cityGroundB3 = createCityGround('10', 150, 0, 250);
		const cityGroundB4 = createCityGround('11', 250, 0, 250);

		const cityGroundC1 = createCityGround('12', -50, 0, 150);
		const cityGroundC2 = createCityGround('13', 50, 0, 150);
		const cityGroundC3 = createCityGround('14', -50, 0, 250);
		const cityGroundC4 = createCityGround('15', 50, 0, 250);

		

		const garden = BABYLON.MeshBuilder.CreateDisc("garden", {radius: 45, tessellation: 64}, scene);
		garden.material = forestGroundMaterial;
		garden.position = new BABYLON.Vector3(250, 0.1, -30);
		garden.rotation = new BABYLON.Vector3(1.57, 0, 0);
		garden.freezeWorldMatrix();



		// scene.animationPropertiesOverride = new BABYLON.AnimationPropertiesOverride();
	//       scene.animationPropertiesOverride.enableBlending = true;
	//       scene.animationPropertiesOverride.blendingSpeed = 0.02;
	//       scene.animationPropertiesOverride.loopMode = 1;

		const creature = BABYLON.MeshBuilder.CreateBox("creature", {width:6, height:28, depth:6}, scene);
		creature.bakeCurrentTransformIntoVertices();
		creature.isPickable = true;
		creatureMaterial = new BABYLON.StandardMaterial("creaMat", scene);
		creatureMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
		creatureMaterial.alpha = 0;
		creature.material = creatureMaterial;
		let creatureHealth = 20;
		let creatureDead = false;
		

		BABYLON.SceneLoader.ImportMesh("", "textures/mutant/", "scene.gltf", scene, function (mutant) {
			mutant[0].scaling = new BABYLON.Vector3(0.06, 0.06, 0.06);
			mutant[0].parent = creature;
			mutant[0].rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.LOCAL);
			creature.position = new BABYLON.Vector3(60, 0, 200);
			scene.stopAllAnimations();
			scene.getAnimationGroupByName("idle").play(true);
		}); 



		const creatureRoar = new BABYLON.Sound("creaRoar", "sounds/Growl_High.mp3", scene);

	    let targetVec;
	    let targetVecNorm;
	    let initVec;
	    let distVec;
	    let safeDist = 100;
	    let minDist = 9;
	    let lookAtVec

		function creatureUpdate() {
			targetVec = camera.position.clone();
			lookAtVec = targetVec;
			lookAtVec.y = 0;
			
			initVec = creature.position.clone();
			distVec = BABYLON.Vector3.Distance(targetVec, initVec);

			targetVec = targetVec.subtract(initVec);
			targetVecNorm = BABYLON.Vector3.Normalize(targetVec);

			if (distVec > minDist && !creatureDead && distVec < safeDist){
	    		distVec -= 0.3;
	    		creature.translate(targetVecNorm,0.3,BABYLON.Space.WORLD);
	    		creature.lookAt(lookAtVec);
	    		if(creatureRoar.isPlaying == false) {
	    			creatureRoar.play();
	        	}
	        	if(!scene.getAnimationGroupByName("Run").isPlaying) {
	        		scene.stopAllAnimations();
		    		scene.getAnimationGroupByName("Run").play(true);
		    	}
	    	}
	    	if(distVec < 12 && !creatureDead) {
	    		playerHealth -= 0.05;
	    	}
	    	if(distVec > safeDist) {
	    		if(scene.getAnimationGroupByName("Run").isPlaying) {
	    			scene.stopAllAnimations();
	    			scene.getAnimationGroupByName("idle").play(true);
	    			// scene.animationGroups[4].play(true);
	    		}
	    	}
		};



		let targetVecGhost = 0;
	    let targetVecNormGhost = 0;
	    let initVecGhost = 0;
	    let distVecGhost = 0;
	    let safeDistGhost = 70;
		let minDistGhost = 5;
		let ghc = 0;
		

		function ghostUpdate() {
			ghosts.forEach(ghost => {
				targetVecGhost = camera.position.clone();
				// targetVecGhost.y = 0;
				
				initVecGhost = ghost.position.clone();
				distVecGhost = BABYLON.Vector3.Distance(targetVecGhost, initVecGhost);

				targetVecGhost = targetVecGhost.subtract(initVecGhost);
				targetVecNormGhost = BABYLON.Vector3.Normalize(targetVecGhost);

				if (distVecGhost > minDistGhost && !ghost.isDead && distVecGhost < safeDistGhost){
		    		distVecGhost -= 0.1;
		    		ghost.translate(targetVecNormGhost,0.1,BABYLON.Space.WORLD);
		    		ghost.lookAt(camera.position);
		    	}
		    	if(distVecGhost < 8 && !ghost.isDead) {
		    		playerHealth -= 0.05;
		    	}
		    	if(ghost.isDead) {
		    		// if(ghost.nn < 1) {
		    		// 	ghostHowl.play();
		    		// 	ghost.nn++;
		    		// }
		    		// scene.removeMesh(ghost, true);
		    		ghost.position.y = -100;
		    	}
			});
			// ghc = 0;
			// ghosts.forEach(ghost => {
			// 	if(!ghost.isDead) {
			// 		ghc++;
			// 	}
			// });
			// ghostCount = ghc;
			// text1.text = "Wraiths Left: " + ghostCount;
		};


		function createGhost(fenceMesh) {
			const newGhost = fenceMesh.clone("ghostChild");
			newGhost.position = new BABYLON.Vector3(0, 0, 0);
			newGhost.isPickable = false;
			const ghost = new BABYLON.MeshBuilder.CreateBox("ghost", {width: 2, height: 5, depth: 2}, scene);
			ghost.material = creatureMaterial;
			newGhost.parent = ghost;
			newGhost.translate(BABYLON.Axis.Y, -4, BABYLON.Space.LOCAL);
			ghost.position = new BABYLON.Vector3(Math.random()*150 + 100, 5, Math.random()*150 + 100);
			ghost.health = 5;
			ghost.isDead = false;
			ghost.nn = 0;
			return ghost;
		}
		const ghosts = [];

		BABYLON.SceneLoader.ImportMesh("", "textures/ghost/", "scene.gltf", scene, function (ghost) {
			ghost[0].scaling = new BABYLON.Vector3(1, 1, 1);
			ghost[0].rotation = new BABYLON.Vector3(0, 0, 0);
			ghost[0].position = new BABYLON.Vector3(500, 0, 500);
	    	ghost[0].isVisible = false;
	    	let c;
	    	for(c = 0; c < 10; c++) {
	    		ghosts.push(createGhost(ghost[0]));
	    	}
		});



		const gun = new BABYLON.TransformNode();
		gun.parent = camera;
		gun.scaling = new BABYLON.Vector3(-0.05, 0.05, 0.05);
		gun.position = new BABYLON.Vector3(2, -3, 7);
		gun.rotation = new BABYLON.Vector3(0, Math.PI - 11*Math.PI/18, -Math.PI/6);
	    camera.fov = 1;

		BABYLON.SceneLoader.ImportMesh("", "textures/scifigun1/", "scene.gltf", scene, function (scifigun) {
			scifigun[0].parent = gun;
			scifigun[0].isPickable = false;
			scifigun[1].renderingGroupId = 2;
		});


		BABYLON.SceneLoader.ImportMesh("", "textures/building1/", "scene.gltf", scene, function (building) {
			building[0].rotation = new BABYLON.Vector3(0, 0, 0);
			building[0].scaling = new BABYLON.Vector3(7, 7, 7);
			building[0].position = new BABYLON.Vector3(0, 0, 130);
			building[0].freezeWorldMatrix();
		});


		BABYLON.SceneLoader.ImportMesh("", "textures/building2/", "scene.gltf", scene, function (building) {
	        building[0].scaling = new BABYLON.Vector3(0.6, 0.6, 0.6);
	    	building[0].position = new BABYLON.Vector3(195, 0, -10);
	    	building[0].freezeWorldMatrix();
	    	newBuilding = building[0].clone("newBuilding");
	    	newBuilding.position = new BABYLON.Vector3(195, 0, 45);
	    	newBuilding.freezeWorldMatrix();
		});

		
		BABYLON.SceneLoader.ImportMesh("", "textures/building3/", "scene.gltf", scene, function (building) {
			building[0].rotation = new BABYLON.Vector3(0, Math.PI/2, 0);
		    building[0].scaling = new BABYLON.Vector3(0.03, 0.03, 0.03);
		    building[0].position = new BABYLON.Vector3(150, -1, 5);
		    building[0].freezeWorldMatrix();
		});

		BABYLON.SceneLoader.ImportMesh("", "textures/building5/", "scene.gltf", scene, function (building) {
			building[0].rotation = new BABYLON.Vector3(0, 0, 0);
			building[0].scaling = new BABYLON.Vector3(0.06, 0.06, 0.06);
			building[0].position = new BABYLON.Vector3(-30, 0, 30);
			building[0].freezeWorldMatrix();
		});

		// // const bunkerDoor = scene.getTransformNodeByID("bldg1_doorway_door_door");
		// // bunkerBorderDoor.isVisible = false;


		BABYLON.SceneLoader.ImportMesh("", "textures/building6/", "scene.gltf", scene, function (building) {
			building[0].rotation = new BABYLON.Vector3(0, 0, 0);
	        building[0].scaling = new BABYLON.Vector3(-0.06, 0.03, 0.03);
	    	building[0].position = new BABYLON.Vector3(80, 0, 140);
	    	building[0].freezeWorldMatrix();
		});

		BABYLON.SceneLoader.ImportMesh("", "textures/space-ship/", "scene.gltf", scene, function (spaceship) {
	        spaceship[0].scaling = new BABYLON.Vector3(40, 40, 40);
	    	spaceship[0].position = new BABYLON.Vector3(-60, 20, 230);
	    	spaceship[0].freezeWorldMatrix();
		});

		// const sphere = new BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 1}, scene);
		// sphere.position = new BABYLON.Vector3(220, 5, 265);
		// const warehouseLight = new BABYLON.PointLight("wrpl", new BABYLON.Vector3(220, 5, 265), scene);
		// warehouseLight.specular = new BABYLON.Color3(0, 0, 0);
		// warehouseLight.intensity = 1;

		BABYLON.SceneLoader.ImportMesh("", "textures/warehouse/", "scene.gltf", scene, function (warehouse) {
			warehouse[0].scaling = new BABYLON.Vector3(3, 3, 3);
			warehouse[0].rotation = new BABYLON.Vector3(0, 3.14, 0);
	    	warehouse[0].position = new BABYLON.Vector3(220, 0, 265);
	    	warehouse[0].freezeWorldMatrix();
		});


		BABYLON.SceneLoader.ImportMesh("", "textures/tank/", "scene.gltf", scene, function (tank) {
			tank[0].scaling = new BABYLON.Vector3(7, 7, 7);
			tank[0].rotation = new BABYLON.Vector3(0, 3*Math.PI/2, 0);
	    	tank[0].position = new BABYLON.Vector3(0, 10, 205);
	    	tank[0].freezeWorldMatrix();
		});

		BABYLON.SceneLoader.ImportMesh("", "textures/cars/", "scene.gltf", scene, function (cars) {
	     //    cars[0].scaling = new BABYLON.Vector3(0.09, 0.09, 0.09);
	    	// cars[0].position = new BABYLON.Vector3(40, 0.01, 210);
	    	// cars[0].freezeWorldMatrix();
	  //   	const cars2 = cars[0].clone("cars");
	    	cars[0].scaling = new BABYLON.Vector3(0.09, 0.09, 0.09);
			cars[0].rotation = new BABYLON.Vector3(0, 1.57, 0);
	    	cars[0].position = new BABYLON.Vector3(132, 0.01, 190);
	    	cars[0].freezeWorldMatrix();
		});

		BABYLON.SceneLoader.ImportMesh("", "textures/car/", "scene.gltf", scene, function (car) {
			car[0].scaling = new BABYLON.Vector3(0.03, 0.03, 0.03);
			car[0].rotation = new BABYLON.Vector3(0, 1.57, 0);
	    	car[0].position = new BABYLON.Vector3(43, 0.01, 185);
	    	// const car2 = car[0].clone("car");
	    	// car2.scaling = new BABYLON.Vector3(0.03, 0.03, 0.03);
	    	// car2.position = new BABYLON.Vector3(153, 0.01, 195);
	    	// car2.freezeWorldMatrix();
		});

		BABYLON.SceneLoader.ImportMesh("", "textures/fountain/", "scene.gltf", scene, function (fountain) {
			const fountain1 = fountain[0];
	        fountain1.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
	    	fountain1.position = new BABYLON.Vector3(220, 0.06, 80);
	    	fountain1.freezeWorldMatrix();
		});

		

		BABYLON.SceneLoader.ImportMesh("", "textures/bench/", "scene.gltf", scene, function (bench) {
			bench[0].scaling = new BABYLON.Vector3(4, 4, 4);
			bench[0].rotation = new BABYLON.Vector3(0, 0, 0);
	    	bench[0].position = new BABYLON.Vector3(280, 2, 140);
		});

		// BABYLON.SceneLoader.ImportMesh("", "textures/bench/", "scene.gltf", scene, function (bench) {
		// 	bench[0].scaling = new BABYLON.Vector3(4, 4, 4);
		// 	bench[0].rotation = new BABYLON.Vector3(0, 0, 0);
	 //    	bench[0].position = new BABYLON.Vector3(280, 2, 120);
		// });

		// BABYLON.SceneLoader.ImportMesh("", "textures/bench/", "scene.gltf", scene, function (bench) {
		// 	bench[0].scaling = new BABYLON.Vector3(4, 4, 4);
		// 	bench[0].rotation = new BABYLON.Vector3(0, 0, 0);
	    // 	bench[0].position = new BABYLON.Vector3(280, 2, 100);
		// });

		

		
		const fences = [];

		function createFence(fenceMesh, x, y, z) {
			const newFence = fenceMesh.clone("newFence");
			newFence.position = new BABYLON.Vector3(x, y, z);
			newFence.freezeWorldMatrix();
			return newFence;
		}

		BABYLON.SceneLoader.ImportMesh("", "textures/fence/", "scene.gltf", scene, function (fence) {
			const fenceMesh = fence[0];
			fenceMesh.scaling = new BABYLON.Vector3(0.08, 0.04, 0.02);
			fenceMesh.rotation = new BABYLON.Vector3(0, 1.57, 0);
			fenceMesh.position = new BABYLON.Vector3(100, 0, -60);

			fences.push(createFence(fenceMesh, 100, 0, -20));
			fences.push(createFence(fenceMesh, 100, 0, 20));
			fences.push(createFence(fenceMesh, 100, 0, 40));
			fences.push(createFence(fenceMesh, 100, 0, 80));

			const fenceMesh2 = fenceMesh.clone("newFence");
			fenceMesh2.scaling = new BABYLON.Vector3(0.08, 0.04, 0.02);
			fenceMesh2.position = new BABYLON.Vector3(80, 0, 100);
			fenceMesh2.rotation = new BABYLON.Vector3(0, 0, 0);
			fences.push(createFence(fenceMesh2, 40, 0, 100));
			fences.push(createFence(fenceMesh2, 0, 0, 100));
			fences.push(createFence(fenceMesh2, -40, 0, 100));
			fences.push(createFence(fenceMesh2, -80, 0, 100));

			const fenceMesh3 = fenceMesh.clone("newFence");
			fenceMesh3.scaling = new BABYLON.Vector3(0.02, 0.04, 0.02);
			fenceMesh3.rotation = new BABYLON.Vector3(0, 1.57, 0);
			fenceMesh3.position = new BABYLON.Vector3(100, 0, -95);
		});

		const fenceBorder1 = BABYLON.MeshBuilder.CreateBox("fenceB", {width: 200, height: 30, depth: 2}, scene);
		fenceBorder1.position = new BABYLON.Vector3(0, 0, 100);
		fenceBorder1.isVisible = false;
		const fenceBorder2 = BABYLON.MeshBuilder.CreateBox("fenceB", {width: 2, height: 30, depth: 180}, scene);
		fenceBorder2.position = new BABYLON.Vector3(100, 0, 10);
		fenceBorder2.isVisible = false;
		const fenceBorder3 = BABYLON.MeshBuilder.CreateBox("fenceB", {width: 2, height: 30, depth: 10}, scene);
		fenceBorder3.position = new BABYLON.Vector3(100, 0, -95);		
		fenceBorder3.isVisible = false;



		

		BABYLON.SceneLoader.ImportMesh("", "textures/wall/", "scene.gltf", scene, function (wall) {
			const wall1 = wall[0];
			wall1.scaling = new BABYLON.Vector3(20, 5, 1);
			wall1.position = new BABYLON.Vector3(100, 0, 305);
			const wall2 = wall1.clone("wall2");
			wall2.scaling = new BABYLON.Vector3(20, 5, 1);
			wall2.position = new BABYLON.Vector3(100, 0, -95);
			const wall3 = wall1.clone("wall3");
			wall3.scaling = new BABYLON.Vector3(20, 5, 1);
			wall3.rotation = new BABYLON.Vector3(0, 1.57, 0);
			wall3.position = new BABYLON.Vector3(-104, 0, 100);
			const wall4 = wall1.clone("wall4");
			wall4.scaling = new BABYLON.Vector3(20, 5, 1);
			wall4.rotation = new BABYLON.Vector3(0, 1.57, 0);
			wall4.position = new BABYLON.Vector3(296, 0, 100);
		});


		// Road
		const roadMaterial = new BABYLON.StandardMaterial("road-material", scene);
		roadMaterial.diffuseTexture = new BABYLON.Texture("textures/roadtexture.jpg", scene);
		roadMaterial.freeze();

		const roadMesh = BABYLON.MeshBuilder.CreateGround("plane", {width: 1, height: 1}, scene);
		roadMesh.material = roadMaterial;

		function createRoad(n, x, y, z, scaleX, scaleZ) {
			const road = roadMesh.createInstance(n);
			road.scaling = new BABYLON.Vector3(scaleX, 1, scaleZ);
			road.position = new BABYLON.Vector3(x, y, z);
			road.freezeWorldMatrix();
			return road;
		}

		const road1 = createRoad("1", 125, 0.02, 225, 220, 10);
		const road2 = createRoad("2", 70, 0.01, 195, 10, 60);
		const road3 = createRoad("3", 125, 0.02, 170, 110, 10);
		const road4 = createRoad("4", 175, 0.01, 140, 10, 60);
		const road5 = createRoad("5", 215, 0.02, 115, 80, 10);
		// CHECKPOINT
		const road6 = createRoad("6", 250, 0.01, 75, 10, 80);
		const road7 = createRoad("7", 225, 0.02, 35, 60, 10);
		const road8 = createRoad("8", 195, 0.01, -25, 10, 130);
		const road9 = createRoad("9", 150, 0.02, -85, 100, 10);
		const road10 = createRoad("10", 20, 0.01, 195, 10, 60);
		const road11 = createRoad("11", -5, 0.02, 170, 50, 10);
		const road12 = createRoad("12", -25, 0.01, 230, 10, 120);
		const road13 = createRoad("13", -55, 0.02, 285, 60, 10);
		const road14 = createRoad("11", -80, 0.01, 192.5, 10, 185);

		// Sounds
		
		
		const gunshot = new BABYLON.Sound("gunshot", "sounds/Gun_Shot.mp3", scene);
		const stepsSound = new BABYLON.Sound("stepsound", "sounds/Steps_Sound.mp3", scene);
		const metalSound = new BABYLON.Sound("metal", "sounds/metal.wav", scene);


		// Shadows
		// const shadowGenerator = new BABYLON.ShadowGenerator(1024, light2);
		// shadowGenerator.useBlurExponentialShadowMap = true;
	//       shadowGenerator.blurScale = 3;
	//       shadowGenerator.setDarkness(0);
		// shadowGenerator.getShadowMap().renderList.push(box);

		// light2.shadowMaxZ = 50;
	 //    light2.shadowMinZ = 0.1;
		// shadowGenerator.useCloseExponentialShadowMap = true;
		// ground.receiveShadows = true;


		// Camera Ellipsoid
		camera.ellipsoid = new BABYLON.Vector3(2, 4, 2);
		camera.ellipsoidOffset = new BABYLON.Vector3(0, 4, 0);
		camera.speed = 0.8;

		

		// Gravity
		scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
		camera.applyGravity = true;
		creature.applyGravity = true;
		
		//Collisions
		scene.collisionsEnabled = true;
		camera.checkCollisions = true;
		forestGround1.checkCollisions = true;
		forestGround2.checkCollisions = true;
		forestGround3.checkCollisions = true;
		forestGround4.checkCollisions = true;
		cityGroundA1.checkCollisions = true;
		cityGroundA2.checkCollisions = true;
		cityGroundA3.checkCollisions = true;
		cityGroundA4.checkCollisions = true;
		cityGroundB1.checkCollisions = true;
		cityGroundB2.checkCollisions = true;
		cityGroundB3.checkCollisions = true;
		cityGroundB4.checkCollisions = true;
		cityGroundC1.checkCollisions = true;
		cityGroundC2.checkCollisions = true;
		cityGroundC3.checkCollisions = true;
		cityGroundC4.checkCollisions = true;
		border0.checkCollisions = true;
		border1.checkCollisions = true;
		border2.checkCollisions = true;
		border3.checkCollisions = true;
		bunkerBorder.checkCollisions = true;
		bunkerBorder2.checkCollisions = true;
		bunkerBorder3.checkCollisions = true;
		bunkerBorderDoor.checkCollisions = true;
		buildingborder1.checkCollisions = true;
		buildingborder2.checkCollisions = true;
		buildingborder3.checkCollisions = true;
		buildingborder4.checkCollisions = true;
		buildingborder5.checkCollisions = true;
		fountainborder1.checkCollisions = true;
		carsborder1.checkCollisions = true;
		carborder1.checkCollisions = true;
		tankborder.checkCollisions = true;
		fenceBorder1.checkCollisions = true;
		fenceBorder2.checkCollisions = true;
		fenceBorder3.checkCollisions = true; 
		warehouseBorder.checkCollisions = true;
		warehouseBorder5.checkCollisions = true;
		warehouseBorder2.checkCollisions = true;
		warehouseBorder3.checkCollisions = true;
		warehouseBorder4.checkCollisions = true;
		creature.checkCollisions = true;

		


		
		//Controls...Mouse
	    //We start without being locked.
		let isLocked = false;

		 let viewportwidth;
		 let viewportheight;
		 // the more standards compliant browsers (mozilla/netscape/opera/IE7) use window.innerWidth and window.innerHeight
		  
		 if (typeof window.innerWidth != 'undefined')
		 {
		      viewportwidth = window.innerWidth,
		      viewportheight = window.innerHeight
		 }
		  
		// IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
		 else if (typeof document.documentElement != 'undefined'
		     && typeof document.documentElement.clientWidth !=
		     'undefined' && document.documentElement.clientWidth != 0)
		 {
		       viewportwidth = document.documentElement.clientWidth,
		       viewportheight = document.documentElement.clientHeight
		 }
		 // older versions of IE
		  
		 else
		 {
		       viewportwidth = document.getElementsByTagName('body')[0].clientWidth,
		       viewportheight = document.getElementsByTagName('body')[0].clientHeight
		 }


		 function shoot() {       
		 	if(HASGUN) {
		 		const ray = camera.getForwardRay(80);
	            const pickResult = scene.pickWithRay(ray);
	            // console.log(pickResult.pickedMesh.name);
	            gunshot.play();
	            scene.beginAnimation(gun, 0, 6, true);
	            if(pickResult.pickedMesh.name == "creature") {
					if(!creatureDead) {
						if(creatureHealth <= 0) {
							creatureDead = true;
							// scene.animationGroups[1].pause();
							scene.stopAllAnimations();
				    		scene.getAnimationGroupByName("death").play(false);
				    	}
				    	else {
				    		creatureHealth -= 1;
				    	}
					}
				}

				else if(pickResult.pickedMesh.name == "ghost") {
					pickResult.pickedMesh.health -= 1;
					if(pickResult.pickedMesh.health <= 0) {
						pickResult.pickedMesh.isDead = true;
					}
				}
	    
	            //  if(pickResult.pickedMesh.name == "box") {
				// 	if(pickResult.pickedMesh.health > 0) {
				// 		pickResult.pickedMesh.health -= 0.2;
				// 		scene.beginAnimation(pickResult.pickedMesh.material, 0, 10, true);
				// 		if(pickResult.pickedMesh.health <= 0.1) {
				// 			pickResult.pickedMesh.health = 0;
				// 			pickResult.pickedMesh.material = blackMaterial;
				// 			scene.beginAnimation(pickResult.pickedMesh, 0, 100, true);
				// 		}
				// 	}
				// }
		 	}
	    }

	    function Walk(e) {
	    	if(e.key == "w" || e.key == "a" || e.key == "s" || e.key == "d") {
	    		if(stepsSound.isPlaying == false) {
	    			stepsSound.play();
	        	}
	    	}
	    }

		//  function mouseFunction(e) {
		// 	const pickResult = scene.pick(scene.pointerX, scene.pointerY);
		// 	const pickResult = scene.pick(viewportwidth/2, viewportheight/2);
		// 	if (pickResult.hit) {
		// 		if(pickResult.pickedMesh.name == "creature") {
		// 			console.log("Gotcha!");
		// 			scene.animationGroups[3].pause();
		// 			scene.animationGroups[0].play(false);
		// 		}
	 //            gunshot.play();
		// 	}
		// }
		
		// On click event, request pointer lock
		scene.onPointerDown = function (evt) {
			//true/false check if we're locked, faster than checking pointerlock on each single click.
			if (!isLocked) {
				canvas.requestPointerLock = canvas.requestPointerLock || canvas.msRequestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
				if (canvas.requestPointerLock) {
					canvas.requestPointerLock();
				}
			}

			if(!PAUSE) {
				canvas.addEventListener("mousedown", shoot);
				canvas.addEventListener("keypress", Walk);
			}
			else if(PAUSE) {
				canvas.removeEventListener("mousedown", shoot);
				canvas.removeEventListener("keypress", Walk);
			}
		};
		

		// Event listener when the pointerlock is updated (or removed by pressing ESC for example).
		const pointerlockchange = function () {
			const controlEnabled = document.mozPointerLockElement || document.webkitPointerLockElement || document.msPointerLockElement || document.pointerLockElement || null;
			
			// If the user is already locked
			if (!controlEnabled) {
				// camera.detachControl(canvas);
				isLocked = false;
				canvas.removeEventListener("mousedown", shoot);
			} else {
				//camera.attachControl(canvas);
				isLocked = true;
			}
		};
		
		// Attach events to the document
		document.addEventListener("pointerlockchange", pointerlockchange, false);
		document.addEventListener("mspointerlockchange", pointerlockchange, false);
		document.addEventListener("mozpointerlockchange", pointerlockchange, false);
		document.addEventListener("webkitpointerlockchange", pointerlockchange, false);


		

	 	let dt = 0;

	 	function updateTime() {
	 		if(creatureDead) {
	 			dt += engine.getDeltaTime();
	 			if(dt > 15000) {
	 				creatureDead = false;
	 				creatureHealth = 20;
					scene.getAnimationGroupByName("Run").play(true);
	 				dt = 0;
	 			}
	 		}
	 	}



	 	//Animation

	 	const gunRecoil = new BABYLON.Animation("recoil", "position.z", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
	 	var keysG = []; 

		  keysG.push({
		    frame: 0,
		    value: 7
		  });

		  keysG.push({
		    frame: 3,
		    value: 4
		  });

		  keysG.push({
		    frame: 6,
		    value: 7
		  });

		  gunRecoil.setKeys(keysG);
		  gun.animations= [];
		  gun.animations.push(gunRecoil);

	 	const fallAnimation = new BABYLON.Animation("fall", "position.y", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
	 	var keys = []; 

		  keys.push({
		    frame: 0,
		    value: 4
		  });

		  keys.push({
		    frame: 20,
		    value: 1
		  });

		  fallAnimation.setKeys(keys);

		  camera.animations = [];
		  camera.animations.push(fallAnimation);

		let fallAct = true;
		let toBeContinued = false;

		let dead = 0;
	 	let distVecDoor;
	 	let doorPosition = new BABYLON.Vector3(-72, 4, 9.5);

	 	function doorCheck() {
		 	if(bunkerBorderDoor.checkCollisions == true) {
		 		dead = 0;
		 		ghosts.forEach(ghost => {
		 			if(ghost.isDead) {
		 				dead++;
		 			}
		 		});
		 		if(dead == 10) {
		 			bunkerBorderDoor.checkCollisions = false;
		 		}
		 	}
		 	distVecDoor = BABYLON.Vector3.Distance(camera.position, doorPosition);
		 	if(distVecDoor < 6.6) {
		 		if(fallAct) {
		 			toBeContinued = true;
		 			metalSound.play();
		 			scene.beginAnimation(camera, 0, 20, true);
					 fallAct = false;
		 			GAMEOVER = true;
		 			PAUSE = true;
		 		}
		 	}
	 	}

	 	function updatePlayer() {
	 		if(playerHealth <= 0) {
	 			PAUSE = true;
	 			GAMEOVER = true;
	 		}
		 }
		 
		 const dialogue = new BABYLON.Sound("background", "sounds/Dialogue.mp3", scene, null, { loop: false, autoplay: true });

		 if(!dialogue.isPlaying) {
			const music = new BABYLON.Sound("background", "sounds/Music.mp3", scene, null, { loop: true, autoplay: true });
		 }

		//  let soundCheck = false;

	 	// function soundMaker() {
	 	// 	if(soundCheck == false && !dialogue.isPlaying) {
	 	// 		const music = new BABYLON.Sound("background", "sounds/Music.mp3", scene, null, { loop: true, autoplay: true });
	 	// 		soundCheck = true;
		// 	 }
	 	// }

		
		 let sceneRemove = 0;


		scene.registerBeforeRender(function() {
			
			 if(!GAMEOVER) {
		     	if(!dialogue.isPlaying) {
					PAUSE = false;
					openingText.isVisible = false;
					if(light1.intensity <= 0.7 && light2.intensity <=0.9) {
					   light1.intensity +=0.002;
					   light2.intensity += 0.002;
				   }
				 }
				 else {
					 PAUSE = true;
					 openingText.isVisible = true;
				 }
			 }

			 

		     if(!PAUSE) {
		     	canvas.addEventListener("keypress", Walk);
		    	camera.attachControl(canvas, true);
		    	scope2.isVisible = true;
		    	scope.isVisible = true;
		    	creatureUpdate();
		    	updateHealth();
		    	ghostUpdate();
		    	updateTime();
		    	doorCheck();
		    	updatePlayer();
		    }
		    else if(PAUSE) {
		    	camera.detachControl(canvas);
		    	canvas.removeEventListener("keypress", Walk);
		    	scope2.isVisible = false;
		    	scope.isVisible = false;
		    }
		    if(GAMEOVER) {
		    	if(toBeContinued) {
		    		text3.isVisible = true;
		    	}
		    	else {
		    		text2.isVisible = true;
		    	}
		    	if(light1.intensity >= 0 && light2.intensity >= 0) {
		            light1.intensity -= 0.008;
		            light2.intensity -= 0.008;
		        }
		        sceneRemove += engine.getDeltaTime();
			    if(sceneRemove >= 5000) {
			    	dispose = true;
			    	console.log("End");
			    }
		    }

	    });


		

	    return scene;
	};


	const scene = createScene(); //Call the createScene function

	// Register a render loop to repeatedly render the scene
	scene.executeWhenReady(function() {
		engine.runRenderLoop(function () {
			if(dispose == false) {
				scene.render();
			}
			else {
				scene.dispose();
				window.location.reload(false);
			}
		});
	});


	// Watch for browser/canvas resize events
	window.addEventListener("resize", function () { 
	        engine.resize();
	});


}