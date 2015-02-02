var camW; var camH;
var numFrames = 15;
var framesAdded = 0;
var gif = null;
var gifData = null;
var rootRef = new Firebase('https://docs-examples.firebaseio.com/web/data');
rootRef.child('users/mchen/name');
var scaleDownFactor = 3;
var selection = [];
var captureOn = false;
var fragments = [];
var buttons = [];
var pickedUp = -1;
var selectionImg = null;
var mask = null;
var recording = false;
var rendering = false;
var selectionCreated = false;
var shared = false;
var minPt = {x:0, y:0};
var maxPt = {x:0, y:0};
var imH; var imH;
var capture = null;
var canvas;
var captureButton;
var fullscreenButton;
var w; var h;
var fbUrl = "https://torid-fire-4253.firebaseIO.com/fragments/";
var fbRef = new Firebase(fbUrl);

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
            var thisX = random(w); var thisY = random(h);
            print("Uploaded to imgur successfully.");
            print(url);
            saveToFB(url, thisX, thisY, imW/scaleDownFactor, imH/scaleDownFactor);
        }).error(function() {
            print("upload error");
        });
    }
}

function fragmentAdded(key) {
    for(i = 0; i < fragments.length; i++) if(fragments[i].key === key) return i;
    return -1;
}

function setupFb() {
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
                    var url = data[key].url;
                    var thisImW = data[key].imW;
                    var thisImH = data[key].imH;
                    var thisImg = createDiv("");
                    thisImg.position(thisX-thisImW/2, thisY-thisImH/2);
                    thisImg.style("width", thisImW);
                    thisImg.style("height", thisImH);
                    thisImg.style("background", "url('"+url+"')");
                    fragments.push({img:thisImg,x:thisX,y:thisY,imW:thisImW,imH:thisImH,key:key}); 
                }
            }
        
            //UNCOMMENT THIS TO DELETE EVERYTHING
            //var selRef = buildEndPoint(key);
            //selRef.remove();
        }

    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
    });
}

function hideFragments() {
    for(i = 0; i < fragments.length; i++) fragments[i].img.hide();
}

function showFragments() {
    for(i = 0; i < fragments.length; i++) fragments[i].img.show();
}

function startCam() {
    if(capture == null) {
        capture = createCapture(VIDEO);
        capture.size(camW, camH);
        capture.hide();
    }
    captureOn = true;
    cursor(CROSS);
    hideButtons();
    hideFragments();    
}

function changeFullscreen() {
    var fs = fullscreen();
    fullscreen(!fs);
}

function setup() {
    h = displayHeight;
    w = displayWidth;
    camW = w; camH = h;
    canvas = createCanvas(w, h);
    noStroke();
    textFont("Arial");
    setupFb();
    
    captureButton = createButton("add a part");
    captureButton.mousePressed(startCam); 
    captureButton.position(20,20);
    captureButton.style("zIndex","1");

    fullscreenButton = createButton("fullscreen");
    fullscreenButton.position(100,20);
    fullscreenButton.mousePressed(changeFullscreen);
    
    buttons.push(captureButton);
    buttons.push(fullscreenButton);
}

function hideButtons() {
    for(i = 0; i < buttons.length; i++) buttons[i].hide();
}

function showButtons() {
    for(i = 0; i < buttons.length; i++) buttons[i].show();
}

function drawSelectionShape() {
    fill(200,200,255,120);
    beginShape();
    for(var i = 0; i < selection.length; i++) {
       vertex(selection[i].x, selection[i].y); 
    } 
    endShape(CLOSE);
}

function generateMask() {
    var imWDown = int(imW/scaleDownFactor); var imHDown = int(imH/scaleDownFactor);
    mask = createImage(imWDown, imHDown);
    mask.loadPixels();
    for(y = 0; y < imHDown; y++) {
        for(x = 0; x < imWDown; x++) {
           var xOriginal = (scaleDownFactor*x)+minPt.x; 
           var yOriginal = (scaleDownFactor*y)+minPt.y;

           if(ptInSelection(xOriginal,yOriginal)) {
               mask.set(x,y,color(255,0));
           }   
           else mask.set(x,y,color(255));
        }
    }
    mask.updatePixels();
}

function drawFragmentOutlines() {
    for(i = 0; i < fragments.length; i++) {
        var w = fragments[i].imW; var h = fragments[i].imH;
        rect(fragments[i].x-w/2,fragments[i].y-h/2,fragments[i].imW,fragments[i].imH);
    }
}

function showMessage(message) {
    textAlign(CENTER);
    textSize(20);
    fill(0);
    text(message, w/2, h*.4);
}

function draw() {
    if(captureOn) {
        background(255);
        if(recording){
            background(255);
            
            image(capture,-minPt.x/scaleDownFactor,-minPt.y/scaleDownFactor,camW/scaleDownFactor,camH/scaleDownFactor);  
            if(mask == null) print("wtf");
            image(mask,0,0);
            if(!rendering && framesAdded < numFrames) {
                gif.addFrame(canvas.elt, {delay : 50});
                framesAdded++;
            }   
            else if(!rendering) {
                rendering = true;
                gif.render();
            }
        }

        else {
            clear();
            showMessage("please enable your cam");
            image(capture,0,0);
            drawSelectionShape(); 
        }
    }

    if(pickedUp != -1) updateFragment(fragments[pickedUp].key, mouseX, mouseY);
}

function mousePressed() {
}

function mouseDragged() {
    if(!(mouseX == 0 && mouseY == 0) && captureOn && mouseX < camW && mouseY < camH) {
        if(mouseX < minPt.x || selection.length === 0) minPt.x = mouseX;
        if(mouseY < minPt.y || selection.length === 0) minPt.y = mouseY;
        if(mouseX > maxPt.x || selection.length === 0) maxPt.x = mouseX;
        if(mouseY > maxPt.y || selection.length === 0) maxPt.y = mouseY;
        selection.push({x:mouseX,y:mouseY}); 
    }
    if(pickedUp == -1 && !captureOn) {
        for(i = 0; i < fragments.length; i++) {
            var w = fragments[i].imW; var h = fragments[i].imH;
            if(mouseX > fragments[i].x - w/2 && mouseX < fragments[i].x + w/2 &&
               mouseY > fragments[i].y - h/2 && mouseY < fragments[i].y+ h/2) {
                pickedUp = i;
            }
        }
    }
}

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

function mouseReleased() {
    if(pickedUp != -1) pickedUp = -1;
    if(selection.length >= 3 && !recording) {
        recording = true;
        rendering = false;
        imW = Math.abs(maxPt.x - minPt.x);
        imH = Math.abs(maxPt.y - minPt.y);
        generateMask();
        gif = new GIF({workers: 2, quality: 10, repeat : 0, transparent : 0xFFFFFF, w : imW, h : imH});
        resizeCanvas(imW/scaleDownFactor, imH/scaleDownFactor);        

        gif.on('finished', function(blob) {
            framesAdded = 0;
            h = displayHeight;
            w = displayWidth;
            resizeCanvas(w, h);        
            clear();
            background(255);
            recording = false;
            selection = [];
            showButtons();
            showFragments();
            captureOn = false;
            cursor(ARROW);
            selectionImg = null;
            gifData = blob;
            shared = true;
            share();
        });
    }
}

function keyPressed() {
    //delete current one
    if(keyCode == 88) {
        if(pickedUp != -1) {
            var selRef = buildEndPoint(fragments[pickedUp].key);
            fragments[pickedUp].img.remove();
            fragments.splice(pickedUp, 1);
            selRef.remove();
            pickedUp = -1;
        }
    } 
}

