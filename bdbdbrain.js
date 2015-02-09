/*
todo
autodocumentation
*/

var camW; var camH;
var numFrames = 30;
var framesAdded = 0;
var gif = null;
var gifData = null;
var scaleDownFactor = 2;
var selection = [];
var captureOn = false;
var defaultRoom = "secret/";
var init = true;
var fragments = [];
var showedTip = false;
var buttons = [];
var pickedUp = -1;
var mask = null;
var baby = false;
var babyBorn = 1;
var showBabyFor =  40;
var whiteMask = null;
var recording = false;
var rendering = false;
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
            var thisX = random(displayWidth*.2,displayWidth*.8); var thisY = random(displayHeight*.2,displayHeight*.8);
            print("Uploaded to imgur successfully.");
            print(url);
            saveToFB(url, thisX, thisY, Math.round(imW/scaleDownFactor), Math.round(imH/scaleDownFactor));
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
    fbRef.on("child_removed", function(snapshot) {
        key = snapshot.key();
        var i = fragmentAdded(key);
        if(i != -1) {
            fragments[i].img.remove();
            fragments.splice(i,1);
        }
    });

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
                    if(captureOn) thisImg.hide();
                    thisImg.position(thisX-thisImW/2, thisY-thisImH/2);
                    thisImg.style("width", thisImW);
                    thisImg.style("height", thisImH);
                    thisImg.style("background", "url('"+url+"') no-repeat");
                    fragments.push({img:thisImg,x:thisX,y:thisY,imW:thisImW,imH:thisImH,key:key,url:url,layer:layer}); 
                    layer++;

                    if(!init) {
                        baby = true;
                        babyBorn = frameCount;
                    } 
                }
            }
        
            //this does something heh
            //var selRef = buildEndPoint(key);
            //selRef.remove();
        }
        if(init) init = false;

    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
    });
}

function moveToTop(i) {
    layer++;
    fragments[i].img.remove();
    fragments[i].img = createDiv("");
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
    if(capture == null) {
        capture = createCapture(VIDEO);
        capture.size(camW, camH);
        capture.hide();
    }
    captureOn = true;
    cursor(CROSS);
    hideButtons();
    setFragmentOpacity(1.0);
    hideFragments();    
}

function setup() {
    devicePixelScaling(false);
    var loadedFrom = ((window.location != window.parent.location) ? document.referrer: document.location).toString();
    var local = "file:///Users/milespeyton/Desktop/bdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbd/index.html";
    if(loadedFrom != local && loadedFrom.slice("http://".length,17) != "partsparts") {
        var endPoint = loadedFrom.indexOf(".partsparts");
        var room = loadedFrom.slice("http://".length, endPoint);
        fbUrl += room.concat("/");
    }
    else {
        fbUrl += defaultRoom;
        vex.dialog.alert('<p>drag parts around on the screen</p> <p>add your own</p> <p>or create a new room like: http://newsecretroom.partsparts.parts</p>')
    }
    fbRef = new Firebase(fbUrl);

    h = Math.round(displayHeight);
    w = Math.round(displayWidth);

    camW = w; camH = h;
    canvas = createCanvas(w, h);
    noStroke();
    textFont("Arial");
    setupFb();
    
    //todo
    //this doesn't work on chrome
    //var is_safari = navigator.userAgent.indexOf("Safari") > -1;
    //var is_explorer = navigator.userAgent.indexOf('MSIE') > -1;
    //if((!is_safari) && (!is_explorer)) {
        captureButton = createButton("+");
        captureButton.mousePressed(startCam); 
        captureButton.position(20,20);
        captureButton.style("zIndex","1");
        buttons.push(captureButton);
}

function hideButtons() {
    for(i = 0; i < buttons.length; i++) buttons[i].hide();
}

function showButtons() {
    for(i = 0; i < buttons.length; i++) buttons[i].show();
}

function drawSelectionShape() {
    push();
    fill(255,80);
    stroke(20);
    strokeWeight(8);
    beginShape();
    for(var i = 0; i < selection.length; i++) {
       vertex(selection[i].x, selection[i].y); 
    } 
    endShape(CLOSE);
    pop();
}

function generateMask() {
    var imWDown = Math.round(imW/scaleDownFactor); var imHDown = Math.round(imH/scaleDownFactor);
    mask = createImage(imWDown, imHDown);
    mask.loadPixels();
    whiteMask = createImage(imWDown, imHDown);
    whiteMask.loadPixels();
    for(y = 0; y < imHDown; y++) {
        for(x = 0; x < imWDown; x++) {
           var xOriginal = (scaleDownFactor*x)+minPt.x; 
           var yOriginal = (scaleDownFactor*y)+minPt.y;

           if(ptInSelection(xOriginal,yOriginal)) {
               mask.set(x,y,color(255,0));
               whiteMask.set(x,y,color(255,0));
           }   
           else {
               mask.set(x,y,color(0,255,0));
               whiteMask.set(x,y,color(255));
           }
            
        }
    }
    mask.updatePixels();
    whiteMask.updatePixels();
}

function drawFragmentOutlines() {
    for(i = 0; i < fragments.length; i++) {
        var w = fragments[i].imW; var h = fragments[i].imH;
        rect(fragments[i].x-w/2,fragments[i].y-h/2,fragments[i].imW,fragments[i].imH);
    }
}

function showMessage(message,rand,color,pos) {
    push();
    textAlign(CENTER);
    if(typeof(color) === 'undefined') fill(0);
    if(typeof(pos) === 'undefined') pos = {x: w/2, y: h*.4};
    else fill(color);
    if(rand) textSize(random(20,20.8));
    else textSize(20);
    text(message, pos.x, pos.y);
    pop();
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

function draw() {
    if(captureOn) {
        if(camEnabled()) {
            if(!showedTip) {
                vex.dialog.alert('click and drag to select a part');
                showedTip = true;
            }
            if(recording){
                clear();
                push();
                    translate(newW,0);
                    scale(-1.0,1.0);
                    image(capture,-newX,newY,newW,newH);
                pop();
                image(mask,0,0);
                
                if(!rendering && framesAdded < numFrames) {
                    gif.addFrame(canvas.elt, {delay : 50, copy : true});
                    framesAdded++;
                }   
                else if(!rendering) {
                    rendering = true;
                    gif.render();
                }
                clear();
                var pct;
                if(typeof(gif.finishedFrames) == "undefnied") pct = 0;
                else pct = (gif.finishedFrames+1)/numFrames;
                push();
                    translate(newW,0);
                    scale(-1.0,1.0);
                    image(capture,-newX,newY,newW,newH);
                pop();
                var start = -PI/2;
                fill(255,255);
                rect(0,height*(1-pct),width,height);
                image(whiteMask,0,0);
            }
            else {
                clear();

                push(); 
                translate(capture.width,0); 
                scale(-1.0,1.0); 
                image(capture,0,0); 
                pop();

                drawSelectionShape(); 
            }
        }

        else {
            background(255);
            showMessage("enable your webcam",false);
        }
    }

    else {
        if(pickedUp != -1) updateFragment(fragments[pickedUp].key, mouseX, mouseY);
        
        if(baby) {
            if(fragments.length > 0 && frameCount - babyBorn > showBabyFor) {
                baby = false;
            }
            else {
                var pct = (frameCount - babyBorn) / showBabyFor;
                setFragmentOpacity(pct,fragments.length-1);
            }
        }
    }
}


function mousePressed() {
}

function mouseDragged() {
    if(camEnabled() && focused && !(mouseX == 0 && mouseY == 0) && captureOn && mouseX < camW && mouseY < camH) {
        if(mouseX < minPt.x || selection.length === 0) minPt.x = mouseX;
        if(mouseY < minPt.y || selection.length === 0) minPt.y = mouseY;
        if(mouseX > maxPt.x || selection.length === 0) maxPt.x = mouseX;
        if(mouseY > maxPt.y || selection.length === 0) maxPt.y = mouseY;
        selection.push({x:mouseX,y:mouseY}); 
    }
    if(pickedUp == -1 && !captureOn) {
        topLayer = 0;
        for(i = 0; i < fragments.length; i++) {
            var w = fragments[i].imW; var h = fragments[i].imH;
            if(mouseX > fragments[i].x - w/2 && mouseX < fragments[i].x + w/2 &&
               mouseY > fragments[i].y - h/2 && mouseY < fragments[i].y+ h/2) {
                if(pickedUp == -1 || fragments[i].layer > topLayer) {
                    pickedUp = i;
                    topLayer = fragments[pickedUp].layer;
                }
            }
        }
        if(pickedUp != -1) moveToTop(pickedUp);
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
        newX = -Math.round(minPt.x/scaleDownFactor); newY = -Math.round(minPt.y/scaleDownFactor);
        newW = Math.round(camW/scaleDownFactor); newH = Math.round(camH/scaleDownFactor);
        recording = true;
        rendering = false;
        imW = Math.round(Math.abs(maxPt.x - minPt.x));
        imH = Math.round(Math.abs(maxPt.y - minPt.y));
        generateMask();
        gif = new GIF({workers: 2, quality: 10, repeat : 0, transparent : 0x00FF00});
        resizeCanvas(Math.round(imW/scaleDownFactor), Math.round(imH/scaleDownFactor));        
        canvas.position(0,0);
        canvas.style("width",w);
        canvas.style("height",h);

        gif.on('finished', function(blob) {
            gifData = blob;
            share();

            framesAdded = 0;
            resizeCanvas(w, h);        
            canvas.position(0,0);
            clear();
            background(255);
            recording = false;
            selection = [];
            showButtons();
            showFragments();
            captureOn = false;
            cursor(ARROW);
            selectionImg = null;
            shared = true;
        });
    }
}

function keyPressed() {
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

