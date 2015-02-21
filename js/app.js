var partspartsparts = function(p) {
    var camW; var camH;
    var numFrames = 30;
    var framesAdded = 0;
    var gif = null;
    var gifData = null;
    var scaleDownFactor = 2;
    var selection = [];
    var captureOn = false;
    var initialMessage = "";
    var showedInitialMessage = false;
    var showedLassoTip = false;
    var showedAddingInfo = false;
    var defaultRoom = "hello/";
    var confirmOpen = false;
    var thisRoom = defaultRoom;
    var init = true;
    var fragments = [];
    var buttons = [];
    var pickedUp = -1;
    var mask = null;
    var baby = false;
    var babyBorn = 1;
    var showBabyFor =  40;
    var whiteMask = null;
    var recording = false;
    var rendering = false;
    var enableYourCam; 
    var shared = false;
    var layer = 0;
    var minPt = {x:0, y:0};
    var maxPt = {x:0, y:0};
    var imH; var imH;
    var capture = null;
    var canvas;
    var captureButton;
    var w; var h;
    var newX; var newY; var newW; var newH;
    var fbUrl = "https://torid-fire-4253.firebaseIO.com/";
    var fbRef;

    function saveToFB(thisUrl, thisX, thisY, thisImW, thisImH) {
        fbRef.push({
            url: thisUrl,
            x: thisX,
            y: thisY,
            imW: thisImW,
            imH: thisImH
        });
    }

    function buildEndPoint (key) {
        return new Firebase(fbUrl + key);
    }

    function updateFragment(key, x, y) {
        updateRef = buildEndPoint(key);
        updateRef.update({x:x,y:y});
    }

    function share(){
        var reader = new window.FileReader();
        reader.readAsDataURL(gifData);
        reader.onloadend = function () {
            $.ajax({
                url: 'https://api.imgur.com/3/upload.json',
                type: 'POST',
                headers: {
                    Authorization: 'Client-ID 2a3f1f63c9b0857'
                },
                data: {
                    image: (reader.result).replace('data:image/gif;base64,',''),
                    type: 'base64',
                    name: 'hehehe',
                    title: 'hehehe',
                    description: 'hehehe',
                },
                dataType: 'json'
            }).success(function(data) {
                var url = 'http://imgur.com/' + data.data.id + '.gif';
                var thisX = p.random(p.windowWidth*.2,p.windowWidth*.8); 
                var thisY = p.random(p.windowHeight*.2,p.windowHeight*.8);
                p.print("Uploaded to imgur successfully.");
                p.print(url);
                saveToFB(url, thisX, thisY, Math.round(imW/scaleDownFactor), Math.round(imH/scaleDownFactor));
            }).error(function() {
                p.print("upload error");
            });
        }
    }

    function fragmentAdded(key) {
        for(i = 0; i < fragments.length; i++) if(fragments[i].key === key) return i;
        return -1;
    }

    function setupRemoveFragment() {
        fbRef.on("child_removed", function(snapshot) {
            key = snapshot.key();
            var i = fragmentAdded(key);
            if(i != -1) {
                fragments[i].img.remove();
                fragments.splice(i,1);
            }
        });
    }

    function addFragLocally(data,key) {
        var url = data[key].url;
        var thisImW = data[key].imW;
        var thisImH = data[key].imH;
        var thisX = data[key].x;
        var thisY = data[key].y;
        var imgDiv = p.createDiv("");

        if(captureOn) thisImg.hide();
        imgDiv.position(thisX-thisImW/2, thisY-thisImH/2);
        imgDiv.style("width", thisImW);
        imgDiv.style("height", thisImH);
        imgDiv.style("background", "url('"+url+"') no-repeat");
        fragments.push({img:imgDiv,x:thisX,y:thisY,imW:thisImW,imH:thisImH,key:key,url:url,layer:layer}); 
        layer++;

        if(!init) {
            baby = true;
            babyBorn = p.frameCount;
        } 
    }   

    function setupReceiveFragment() {
        fbRef.on("value", function(snapshot) {
            var data = snapshot.val();
            
            for (var key in data) {
                var thisX = data[key].x;
                var thisY = data[key].y;

                if(data.hasOwnProperty(key)) {
                    var fragIndex = fragmentAdded(key);
                    if(fragIndex != -1) {
                      fragments[fragIndex].img.position(thisX-fragments[fragIndex].imW/2, thisY-fragments[fragIndex].imH/2);
                      fragments[fragIndex].x = thisX;
                      fragments[fragIndex].y = thisY;
                    }
                    else {
                      addFragLocally(data,key);
                    }
                }
            }
            if(init) init = false;

        }, function (errorObject) {
          console.log("The read failed: " + errorObject.code);
        });
    }

    function setupFb() {
        fbRef = new Firebase(fbUrl);
        setupRemoveFragment();
        setupReceiveFragment();
    }

    function moveToTop(i) {
        layer++;
        fragments[i].img.remove();
        fragments[i].img = p.createDiv("");
        fragments[i].img.position(fragments[i].x-fragments[i].imW/2,fragments[i].y-fragments[i].imH/2);
        fragments[i].img.style("width",fragments[i].imW);
        fragments[i].img.style("height",fragments[i].imH);
        fragments[i].img.style("background","url('"+fragments[i].url+"') no-repeat");
        fragments[i].layer = layer;
    }

    function hideFragments() {
        for(i = 0; i < fragments.length; i++) fragments[i].img.hide();
    }

    function showFragments() {
        for(i = 0; i < fragments.length; i++) fragments[i].img.show();
    }

    function startCam() {
        showedInitialMessage = true;
        if(!camEnabled()) enableYourCam.show();
        if(capture == null) {
            capture = p.createCapture(p.VIDEO);
            capture.size(camW, camH);
            capture.hide();
        }
        captureOn = true;
        p.cursor(p.CROSS);
        hideButtons();
        setFragmentOpacity(1.0);
        hideFragments();    
    }

    function hasGetUserMedia() {
      return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia || navigator.msGetUserMedia);
    }

    function setupButton() {
        captureButton = p.createButton("+");
        captureButton.mousePressed(startCam); 
        captureButton.position(20,20);
        captureButton.style("background","none");
        captureButton.style("padding","0");
        captureButton.style("border","1px solid");
        captureButton.style("width","40");
        captureButton.style("height","40");
        captureButton.style("font-size","19");
        captureButton.style("zIndex","1");
        buttons.push(captureButton);
    }

    function createEnableYourCamDiv() {
        enableYourCam = p.createDiv("enable your cam");
        enableYourCam.style("width", "auto");
        enableYourCam.style("height", "auto");
        enableYourCam.style("position", "absolute");
        enableYourCam.style("white-space", "nowrap");
        enableYourCam.style("font-family", "Helvetica Neue");
        enableYourCam.style("font-size", "large");
        enableYourCam.style("text-align", "center");
        enableYourCam.style("zIndex","-1");
        enableYourCam.position(w/2 - enableYourCam.elt.clientWidth/2,h/2);
        enableYourCam.hide();
    }

    function setupPage() {
        var loadedFrom = ((window.location != window.parent.location) ? document.referrer: document.location).toString();
        var local = "file:///Users/milespeyton/Desktop/bdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbd/index.html";
        var inDefault = false;
        vex.dialog.buttons.YES.text = 'ok';
        vex.dialog.buttons.NO.text = 'no';
        if(loadedFrom != local && loadedFrom.slice("http://".length,17) != "partsparts") {
            var endPoint = loadedFrom.indexOf(".partsparts");
            var room = loadedFrom.slice("http://".length, endPoint);
            thisRoom = room;
            fbUrl += room.concat("/");
        }
        else {
            fbUrl += defaultRoom;
            inDefault = true;
            thisRoom = "partsparts.parts";
        }
        window.document.title = thisRoom;

        w = Math.round(p.windowWidth);
        h = Math.round(p.windowHeight);

        camW = w; camH = h;
        canvas = p.createCanvas(w, h);
    
        createEnableYourCamDiv();

        p.devicePixelScaling(false);
        p.noStroke();
        p.textFont("Helvetica");
    }

    p.setup = function() {
        setupPage();
        setupFb();
        
        if(hasGetUserMedia()) {
            setupButton();
            initialMessage = "<p>move parts</p> <p>or add your own</p>";
        }
        else {
            initialMessage = "<p>arrange parts..</p> <p>you need a browser like Chrome</p> <p>to record new ones..</p>";  
        }
    };

    function hideButtons() {
        for(i = 0; i < buttons.length; i++) buttons[i].hide();
    }

    function showButtons() {
        for(i = 0; i < buttons.length; i++) buttons[i].show();
    }

    function drawSelectionShape() {
        p.push();
        p.fill(255,80);
        p.stroke(0);
        p.strokeWeight(4);
        p.beginShape();
        for(var i = 0; i < selection.length; i++) {
           p.vertex(selection[i].x, selection[i].y); 
        } 
        p.endShape(p.CLOSE);
        p.pop();
    }

    function generateMask() {
        var imWDown = Math.round(imW/scaleDownFactor); var imHDown = Math.round(imH/scaleDownFactor);
        mask = p.createImage(imWDown, imHDown);
        mask.loadPixels();
        whiteMask = p.createImage(imWDown, imHDown);
        whiteMask.loadPixels();
        for(y = 0; y < imHDown; y++) {
            for(x = 0; x < imWDown; x++) {
               var xOriginal = (scaleDownFactor*x)+minPt.x; 
               var yOriginal = (scaleDownFactor*y)+minPt.y;

               if(ptInSelection(xOriginal,yOriginal)) {
                   mask.set(x,y,p.color(255,0));
                   whiteMask.set(x,y,p.color(255,0));
               }   
               else {
                   mask.set(x,y,p.color(0,255,0));
                   whiteMask.set(x,y,p.color(255));
               }
            }
        }
        mask.updatePixels();
        whiteMask.updatePixels();
    }

    function drawFragmentOutlines() {
        for(i = 0; i < fragments.length; i++) {
            var thisW = fragments[i].imW; var thisH = fragments[i].imH;
            rect(fragments[i].x-thisW/2,fragments[i].y-thisH/2,fragments[i].imW,fragments[i].imH);
        }
    }

    function camEnabled() {
        return(capture != null && capture.attribute("src") != null);
    }

    function setFragmentOpacity(val,exception) {
        if(typeof(exception) === "undefined") {
            for(i = 0; i < fragments.length; i++) fragments[i].img.style("opacity",val.toString());
        }
        else for(i = 0; i < fragments.length; i++) if(i != exception) fragments[i].img.style("opacity",val.toString());
    }

    function drawRecording() {
        p.clear();
        p.push();
            p.translate(newW,0);
            p.scale(-1.0,1.0);
            p.image(capture,-newX,newY,newW,newH);
        p.pop();
        p.image(mask,0,0);
        if(!rendering && framesAdded < numFrames) {
            gif.addFrame(canvas.elt, {delay : 50, copy : true});
            framesAdded++;
        }   
        else if(!rendering) {
            rendering = true;
            gif.render();
        }
        p.clear();
        var pct;
        if(typeof(gif.finishedFrames) == "undefnied") pct = 0;
        else pct = (gif.finishedFrames+1)/numFrames;
        p.push();
            p.translate(newW,0);
            p.scale(-1.0,1.0);
            p.image(capture,-newX,newY,newW,newH);
        p.pop();
        var start = -p.PI/2;
        p.fill(255,255);
        p.rect(0,p.height*(1-pct),p.width,p.height);
        p.image(whiteMask,0,0);
    }

    function drawCapture() {
        if(camEnabled()) {
            if(!showedLassoTip) {
                vex.dialog.alert('click and drag to select the part');
                showedLassoTip = true;
            }
            if(recording) drawRecording();
            else {
                p.clear();

                p.push(); 
                p.translate(capture.width,0); 
                p.scale(-1.0,1.0); 
                p.image(capture,0,0); 
                p.pop();

                drawSelectionShape(); 
            }
        }
    }

    p.draw = function() {
        if(captureOn) drawCapture();

        else {
            if(pickedUp != -1) updateFragment(fragments[pickedUp].key, p.mouseX, p.mouseY);
            
            if(baby) {
                if(fragments.length > 0 && p.frameCount - babyBorn > showBabyFor) {
                    baby = false;
                }
                else {
                    var pct = (p.frameCount - babyBorn) / showBabyFor;
                    setFragmentOpacity(pct,fragments.length-1);
                }
            }
        }
    };


    p.mousePressed = function() {
        if(captureOn && !confirmOpen && !recording) selection = [];
        if(!showedInitialMessage) {
            vex.dialog.alert(initialMessage);
            showedInitialMessage = true;
        }
    };

    p.mouseDragged = function() {
        if(camEnabled() && p.focused && !(p.mouseX == 0 && p.mouseY == 0) 
           && captureOn && p.mouseX < camW && p.mouseY < camH && !recording) {
            selection.push({x:p.mouseX,y:p.mouseY}); 
            var convexHull = new ConvexHullGrahamScan();
            for(i = 0; i < selection.length; i++) convexHull.addPoint(selection[i].x,selection[i].y);
            selection = convexHull.getHull();
        }
        if(pickedUp == -1 && !captureOn) {
            topLayer = 0;
            for(i = 0; i < fragments.length; i++) {
                var w = fragments[i].imW; var h = fragments[i].imH;
                if(p.mouseX > fragments[i].x - w/2 && p.mouseX < fragments[i].x + w/2 &&
                   p.mouseY > fragments[i].y - h/2 && p.mouseY < fragments[i].y+ h/2) {
                    if(pickedUp == -1 || fragments[i].layer > topLayer) {
                        pickedUp = i;
                        topLayer = fragments[pickedUp].layer;
                    }
                }
            }
            if(pickedUp != -1) moveToTop(pickedUp);
        }
    };

    function ptInSelection(x, y) {
        var oddNodes = false;
        var n = selection.length - 1;

        for(i = 0; i < selection.length; i++) {
            if(selection[i].y < y && selection[n].y >= y 
            || selection[n].y < y && selection[i].y >= y) {
                if(selection[i].x + (y-selection[i].y)/(selection[n].y-selection[i].y)*(selection[n].x-selection[i].x)<x)  {
                    oddNodes = !oddNodes;
                }
            }
            n = i;
        }
        return oddNodes;
    }

    function getSelectionCenter() {
        var totalX = 0;
        var totalY = 0;
        for(i = 0; i < selection.length; i++) {
           totalX += selection[i].x;
           totalY += selection[i].y; 
        }
        var centerPt = {x : (totalX/selection.length), y : (totalY/selection.length)};
        return centerPt;
    }

    function setupRecording() {
        newX = -Math.round(minPt.x/scaleDownFactor); newY = -Math.round(minPt.y/scaleDownFactor);
        newW = Math.round(camW/scaleDownFactor); newH = Math.round(camH/scaleDownFactor);
        recording = true;
        window.document.title = "RECORDING";
        rendering = false;
        imW = Math.round(Math.abs(maxPt.x - minPt.x));
        imH = Math.round(Math.abs(maxPt.y - minPt.y));
        generateMask();
        gif = new GIF({workers: 2, quality: 10, repeat : 0, transparent : 0x00FF00});
        p.resizeCanvas(Math.round(imW/scaleDownFactor), Math.round(imH/scaleDownFactor));        
        canvas.position(0,0);
        canvas.style("width",w);
        canvas.style("height",h);

        gif.on('finished', function(blob) {
            gifData = blob;
            share();

            framesAdded = 0;
            p.resizeCanvas(w, h);        
            canvas.position(0,0);
            p.clear();
            p.background(255);
            recording = false;
            window.document.title = thisRoom;
            selection = [];
            showButtons();
            enableYourCam.hide();
            showFragments();
            captureOn = false;
            p.cursor(p.ARROW);
            selectionImg = null;
            shared = true;
            if(!showedAddingInfo) {
                vex.dialog.alert("adding your part. it'll take a moment.")
                showedAddingInfo = true;
            }
        });
    }

    function cross(o, a, b) {
       return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    }

    function calculateMinMax() {
        minPt = {x : -1, y : -1}; maxPt = {x : -1, y : -1};
        for(i = 0; i < selection.length; i++) {
            if((minPt.x == -1) || (selection[i].x < minPt.x)) minPt.x = selection[i].x;
            if((minPt.y == -1) || (selection[i].y < minPt.y)) minPt.y = selection[i].y;

            if((maxPt.x == -1) || (selection[i].x > maxPt.x)) maxPt.x = selection[i].x;
            if((maxPt.y == -1) || (selection[i].y > maxPt.y)) maxPt.y = selection[i].y;
        }
    }

    p.mouseReleased = function() {
        if(pickedUp != -1) pickedUp = -1;
        if(!confirmOpen && selection.length >= 3 && !recording) {
            calculateMinMax();
            confirmOpen = true;
            vex.dialog.confirm({
                message: 'record this part?',
                callback: function(value) {
                    if(value) {
                        setupRecording();
                    }
                    else selection = [];
                    confirmOpen = false;
                }
            });
        }
    };

    //do something about this
    p.keyPressed = function() {
        if(p.keyCode == 88) {
            if(pickedUp != -1) {
                var selRef = buildEndPoint(fragments[pickedUp].key);
                fragments[pickedUp].img.remove();
                fragments.splice(pickedUp, 1);
                selRef.remove();
                pickedUp = -1;
            }
        } 
    };
};

var myp5 = new p5(partspartsparts);
