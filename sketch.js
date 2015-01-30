var rootRef = new Firebase('https://docs-examples.firebaseio.com/web/data');
rootRef.child('users/mchen/name');
var selection = [];
var selectionImg;
var selectionCreated = false;
var shared = false;
var minPt = {x:0, y:0};
var maxPt = {x:0, y:0};
var capture;
var canvas;
var width; var height;

function share(){
    var img;
    try {
        img = canvas.elt.toDataURL('image/jpeg', 0.9).split(',')[1];
    } catch(e) {
        img = canvas.elt.toDataURL().split(',')[1];
    }
    $.ajax({
        url: 'https://api.imgur.com/3/upload.json',
        type: 'POST',
        headers: {
            Authorization: 'Client-ID 2a3f1f63c9b0857'
        },
        data: {
            type: 'base64',
            name: 'mileshirooleasonpeyton.jpg',
            title: 'mileshirooleasonpeyton',
            description: 'mileshirooleasonpeyton',
            image: img
        },
        dataType: 'json'
    }).success(function(data) {
        var url = 'http://imgur.com/' + data.data.id + '?tags';
        print("Uploaded to imgur successfully.");
        print(url);
    }).error(function() {
        print("upload error");
    });
}

function setup() {
    height = displayHeight;
    width = displayWidth;
    canvas = createCanvas(width, height);
    capture = createCapture(VIDEO);
    capture.size(320, 240);
    noFill();
}

function drawSelectionShape() {
    beginShape();
    for(var i = 0; i < selection.length; i++) {
       vertex(selection[i].x, selection[i].y); 
    } 
    endShape(CLOSE);
}

function draw() {
    clear();
    capture.loadPixels();
    
    if(selectionCreated) {
        image(selectionImg, 0, 0);
        if(!shared) {
            shared = true;
            share();
        }
    }
    else {
        image(capture,0,0);
        drawSelectionShape();
    }

}

function mouseDragged() {
    if(mouseX < minPt.x || selection.length === 0) minPt.x = mouseX;
    if(mouseY < minPt.y || selection.length === 0) minPt.y = mouseY;
    if(mouseX > maxPt.x || selection.length === 0) maxPt.x = mouseX;
    if(mouseY > maxPt.y || selection.length === 0) maxPt.y = mouseY;
    selection.push({x:mouseX,y:mouseY}); 
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
    if(selection.length > 3 && !selectionCreated) {
        var imW = Math.abs(maxPt.x - minPt.x);
        var imH = Math.abs(maxPt.y - minPt.y);
        selectionImg = createImage(imW, imH);
        selectionImg.loadPixels();
        
        for(x = minPt.x; x < maxPt.x; x++) {
            for(y = minPt.y; y < maxPt.y; y++) {
               if(ptInSelection(x,y)) {
                    var i = x - minPt.x;
                    var j = y - minPt.y; 
                    var colorAtPt = get(x,y);
                    selectionImg.set(i, j, colorAtPt);
                }   
            }
        }           

        selectionImg.updatePixels();
        selectionCreated = true;
    }
}

function keyPressed() {
    //clear selection
    if(keyCode === 67) {
        selection = [];
    }
    
    //fullscreen
    if(keyCode === 70) {
        var fs = fullscreen();
        fullscreen(!fs);
    }
}

