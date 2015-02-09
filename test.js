var capture; 

function setup() {
    createCanvas(displayWidth,displayHeight);
    capture = createCapture(VIDEO);
    capture.size(displayWidth,displayHeight);
    print("yo");
}

function draw() {
    push(); 
    translate(width,0); 
    scale(-1.0,1.0); 
    image(capture,width/2,-height/2); 
    pop();
}
