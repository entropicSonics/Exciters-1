// let brushStrokes
// let numPoints = 20;

//Fonts
let dudler, emeritus;

let points = []
let exciters = []
let floorTiles = []
let trailLifetime = 400
let excLifetime = 800
// let notes = {'D': 120, 'E': 120, 'F': 120, 'G': 120, 'A': 120, 'A#': 120, 'C'}

let oscillators = []
let audioContextStarted = false

let notes = [
	{
		noteName: 'A#',
		val: 46
	},
	{
		noteName: 'F',
		val: 53
	},
	{
		noteName: 'A',
		val: 57
	},
	{
		noteName: 'A#',
		val: 58
	},
	{
		noteName: 'D',
		val: 62
	},
	{
		noteName: 'A',
		val: 45
	},
	{
		noteName: 'E',
		val: 52
	},
	{
		noteName: 'G',
		val: 55
	},
	{
		noteName: 'A',
		val: 57
	},
	{
		noteName: 'C#',
		val: 61
	}
]

function preload() {
	dudler = loadFont('assets/Dudler-Regular.woff');
	emeritus = loadFont('assets/Emeritus-Display.woff');
  }

function setup() {
	let cnv = createCanvas(windowWidth, windowHeight)

	let reverb = new p5.Reverb()
	// for (let i = 0; i < 100; i++) {
	// 	exciters.push(new Exciter(width/2, height/2))
	// }
	
	// brushStrokes = []

	// for (let i = 0; i < numPoints; i++) {
	// 	let point = createVector(width/2, height/2)
	// 	points.push(point)

	// 	console.log(point)
	// }

	for (let i=0; i < notes.length; i++) {
		floorTiles.push(new FloorTile(0 + (width/notes.length * i), notes[i], reverb))
	}

	
}

function draw() {

	background('Black')
	fill(255)
	textSize(48)
	textFont(emeritus)
	text('Exciters', width - 200, 55)

	// brushStrokes.forEach(brushStroke => {
	// 	brushStroke.draw()
	// })

	// if (mouseX !== pmouseX && mouseY !== pmouseY) {
	// 	points.shift()

	// 	let point = createVector(mouseX, mouseY)
	// 	points.push(point)
	// }

	// console.log(points);

	// stroke(255)

	// Trail
	console.log(trailLifetime)
	trailLifetime -= 1
	// fill(trailLifetime)
	stroke(trailLifetime)
	strokeWeight(2)
	strokeJoin(ROUND)
	noFill()
	beginShape()
	for (let i=0; i<points.length; i++) {
		let pt = points[i]
		curveVertex(pt.x, pt.y)
	}
	endShape()

	// Exciters
	for (let exciter of exciters) {
		let gravity = createVector(0, 0.5 )
		exciter.applyForce(gravity)
		exciter.update()
		exciter.edges()
		exciter.show()	
	}

	for (let i = exciters.length-1; i >=0; i--) {
		if (exciters[i].finished()) {
			exciters.splice(i, 1)
		}
	}

	// Floor tiles
	for (let floorTile in floorTiles) {
		floorTiles[floorTile].show()
	}

	
	for (let exciter in exciters) {
		for (let floorTile in floorTiles) {
			floorTiles[floorTile].intersects(exciters[exciter])
		}
	}

}

function mouseClicked() {
	userStartAudio();

	exciters.push(new Exciter(mouseX, mouseY, excLifetime))
}

function mouseDragged() {
	// brushStrokes.push(new BrushStroke(mouseX, mouseY))
	userStartAudio();

	trailLifetime = 400

	if (mouseX < windowWidth && mouseY < windowHeight) {
		let point = createVector(mouseX, mouseY)
		points.push(point)

		if (mouseX % 2 == 0) {
			exciters.push(new Exciter(mouseX, mouseY, excLifetime))
		}
	}

	// Causes exciters to fall in a cool, circular pattern
	// for (const point in points) {
	// 	if (mouseX % 10 == 0) {	
	// 		exciters.push(new Exciter(mouseX, mouseY, excLifetime))
	// 	}
	// }

	// console.log(points.length, exciters.length)
}

function mousePressed() {
	if (!audioContextStarted) {
		audioContextStarted = true
		for (osc of oscillators) {
			osc.start()
		}
	}
	if (mouseX < window.width && mouseY < window.height) {
		points = []
	}
}

class Exciter {
	constructor(x, y, lifetime) {
		this.pos = createVector(x, y)
		this.vel = p5.Vector.random2D()
		this.acc = createVector(0, 0)
		this.lifetime = lifetime
	}

	finished() {
		return (this.lifetime <= 0)
	}

	applyForce(force) {
		this.acc = force
	}

	edges() {
		if (this.pos.y >= height - 40) {
			this.pos.y = height - 40
			if (this.vel.y > 2) {
				// this.vel.x = random(5, -5)
				this.vel.x = random(-this.vel.y * 0.5, this.vel.y * 0.5)
			} else {
				this.vel.x = 0
			}
			// this.vel.y *= -1.5
			this.vel.y *= -0.93
		}

		if (this.pos.x < 0 || this.pos.x > width) {
			this.vel.x *= -0.93
		} 

		// console.log(this.pos.y);
	}

	update() {
		// let mouse = createVector(mouseX, mouseY)
		// this.acc = p5.Vector.sub(mouse, this.pos)
		// this.acc.setMag(1)

		this.vel.add(this.acc)
		this.vel.limit(20)
	
		this.pos.add(this.vel)

		this.lifetime -= 1
	}

	show() {
		// fill(255)
		stroke(255, this.lifetime);
		strokeWeight(1)
		ellipse(this.pos.x, this.pos.y, 10, 10)
	}
}

class FloorTile {
	constructor(x, note, reverb) {
		this.pos = createVector(x, window.height-40)
		this.width = window.width / notes.length
		this.height = 40
		this.fillVal = 200
		this.note = note
		this.hit = false

		this.env = new p5.Envelope()
		
		
		this.osc = new p5.Oscillator()
		this.osc.setType('triangle')
		// this.osc.start()
		this.osc.freq(midiToFreq(this.note.val + 12))
		this.osc.amp(this.env, 0)
		oscillators.push(this.osc)

		reverb.process(this.osc)

		this.playing = false
	}

	onHit(other) {
		let velocity = (other.lifetime / excLifetime)**3 // velocity is between 0 and 1

		this.fillVal = 255 * min(1, sqrt(velocity * 5))

		// console.log(velocity)
		
		if (Math.abs(other.vel.y) > 2) {
			// this.env.setADSR(random(0, 0.2), 0.0, 0.1, 0.5) // RANDOM ATTACK

			this.env.setADSR(0.2 * max(0, 0.9-velocity), 0.0, 0.1, 0.5) // GRADUAL ATTACK SLOWDOWN
			this.env.setRange(velocity, 0)
			// this.env.setRange(0.1, 0)
			this.env.play()
		}
	}

	intersects(other) {
		this.hit = collideRectCircle(this.pos.x, this.pos.y, this.width, this.height, other.pos.x, other.pos.y, 10)
		// if ((this.pos.y <= other.pos.y + 10) && (this.pos.x <= other.pos.x) && (this.pos.x + this.width >= other.pos.x)) {
		// 	this.hit = true
		// } else {
		// 	this.hit = false
		// }

		if (this.hit == true) {
			// console.log(this.note)
			this.onHit(other)
		} else { 
			console.log('Nothing is hit')
		}
	}

	show() {
		// if (this.hit == true) {
		// 	console.log(this.note)
		// } else {
		// 	console.log('Nothing is hit')
		// }
		fill(this.fillVal) //, 10, 100)
		this.fillVal *= 0.8
		noStroke()
		rect(this.pos.x, this.pos.y, this.width, this.height)
		fill(255 - this.fillVal)
		textSize(16)
		textFont((dudler))
		text(this.note.noteName, this.pos.x + 10, this.pos.y + 26)
	}

}

//   class BrushStroke {
// 	constructor(x, y) {
// 		this.x = x
// 		this.y = y
// 	}

// 	draw() {
// 		noStroke()
// 		fill('white')
// 		stroke('white')
// 		strokeWeight(2)
// 		point(this.x, this.y)
// 	}
// }