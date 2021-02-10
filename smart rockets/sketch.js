var population;
var lifespan = 600;
var lifeP;
var count = 0;
var target;
var maxforce = 0.2;

//obstacle dimensions
var rx;
var ry;
var rw;
var rh;

function setup() {
    // windowWidth can only be used in setup, so i gotta assign them here instead of above
    rx = windowWidth / 2;
    ry = windowHeight / 3;
    rw = windowWidth / 4;
    rh = 10;

    createCanvas(windowWidth, windowHeight);
    rocket = new Rocket();
    population = new Population();
    lifeP = createP();
    target = createVector(width / 2, 50);
}

function draw() {
    background(0);
    population.run();
    //displays count to browser
    lifeP.html(count);

    count++;
    if (count == lifespan) {
        population.evaluate();
        population.selection();
        //population = new Population();
        count = 0;
    }

    //obstacle render
    push();
    fill(255);
    rectMode(CENTER);
    rect(rx, ry, rw, rh);
    pop();

    //target render
    ellipse(target.x, target.y, 16, 16);
}

function Population() {
    this.rockets = [];
    this.popsize = 25;
    this.matingpool = [];

    //makes rocket for each array index
    for (var i = 0; i < this.popsize; i++) {
        this.rockets[i] = new Rocket();
    }

    this.evaluate = function() {
        //determining fitness/how good it is as a rocket
        var maxfit = 0;
        for (var i = 0; i < this.popsize; i++) {
            this.rockets[i].calcFitness();
            if (this.rockets[i].fitness > maxfit) {
                maxfit = this.rockets[i].fitness;
            }
        }


        for (var i = 0; i < this.popsize; i++) {
            //normalise ftness
            this.rockets[i].fitness /= maxfit;
        }

        this.matingpool = [];
        // puts rockets on a scale of 1-100
        // high fitness scores are more likely to be in mating pool
        for (var i = 0; i < this.popsize; i++) {
            var n = this.rockets[i].fitness * 100;
            for (var j = 0; j < n; j++) {
                this.matingpool.push(this.rockets[i]);
            }
        }
    }

    this.selection = function() {
        //natural selection/passing on genes for child
        var newRockets = [];
        for (var i = 0; i < this.rockets.length; i++) {
            var parentA = random(this.matingpool).dna;
            var parentB = random(this.matingpool).dna;
            var child = parentA.crossover(parentB);
            child.mutation();
            newRockets[i] = new Rocket(child);
        }
        this.rockets = newRockets;
    }


    this.run = function() {
        for (var i = 0; i < this.popsize; i++) {
            this.rockets[i].update();
            this.rockets[i].show();
        }
    }
}



function DNA(genes) {
    if (genes) {
        //receiveing genes and create object
        this.genes = genes;
    } else {
        //else randomly make new genes
        this.genes = [];
        for (var i = 0; i < lifespan; i++) {
            this.genes[i] = p5.Vector.random2D();
            this.genes[i].setMag(maxforce);
        }
    }
    
    this.crossover = function(partner) {
        //mixing of dna with another rocket
        var newgenes = [];
        var mid = floor(random(this.genes.length));
        // determining which partners genes are best to use
        for (var i = 0; i < this.genes.length; i++) {
            if (i > mid) {
                newgenes[i] = this.genes[i];
            } else {
                newgenes[i] = partner.genes[i];
            }
        }
        return new DNA(newgenes);
    }

    
    this.mutation = function() {
        //mutation for variance
        for (var i = 0; i < this.genes.length; i++) {
            if (random(1) < 0.01) {
                this.genes[i] = p5.Vector.random2D();
                this.genes[i].setMag(maxforce);
            }
        }
    }
}



function Rocket(dna) {
    this.pos = createVector(width / 2, height);
    this.vel = createVector();
    this.acc = createVector();
    this.completed = false;
    this.crashed = false;
    this.timetaken = [];
    if (dna) {
        this.dna = dna;
    } else {
        this.dna = new DNA();
    }
    this.fitness = 0;

    //objects can reviece force and add to acceleration
    this.applyForce = function(force) {
        this.acc.add(force);
    }

    //calculate the fitness of rocket
    this.calcFitness = function() {
        //distance from target
        var d = dist(this.pos.x, this.pos.y, target.x, target.y);

        //if the rocket is close to target, increase fitness, decrease if far
        this.fitness = 1 / max(d**2, 1);
        if (this.completed) {
            this.timetaken.push(count);
            this.fitness *= (10 * lifespan / min(this.timetaken));
        }
        if (this.crashed) {
            this.fitness /= 10;
        }
    }

    this.update = function() {

        var d = dist(this.pos.x, this.pos.y, target.x, target.y);
        //check if rocket has reached target
        if (d < 10) {
            this.completed = true;
            this.pos = target.copy();
        }

        //collision with obstacle
        if (this.pos.x > rx - (rw / 2) && this.pos.x < rx + (rw / 2) && this.pos.y > ry - (rh / 2) && this.pos.y < ry + (rh / 2)) {
            this.crashed = true;
        }

        //collision with walls
        if (this.pos.x > width || this.pos.x < 0) {
            this.crashed = true;
        }
        if (this.pos.y > height || this.pos.y < 0) {
            this.crashed = true;
        }


        this.applyForce(this.dna.genes[count]);
        //updating the physics if rocket hasnt crashed and not at goal
        if (!this.completed && !this.crashed) {
            this.vel.add(this.acc);
            this.pos.add(this.vel);
            this.acc.mult(0);
            this.vel.limit(4);
        }
    }

    this.show = function() {
        push();
        noStroke();
        fill(255, 150);
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading());
        rectMode(CENTER);
        rect(0, 0, 25, 5);
        pop();
    }

}
