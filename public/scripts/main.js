class Simulation {

	constructor() {

		// These functions should be set by the simulation
		this.render = null;
		this.init = null;

		// Get the canvas element and context
		this.canvas = document.querySelector("canvas");
		this.ctx = this.canvas.getContext("2d");

		// Automatically resize the canvas with the window
		this.resize();
		window.addEventListener("resize", () => this.resize());

		// Initialise empty array of objects to render
		this.objects = [];

		// The number of metres that the canvas should cover.
		this.scale = 5;


		// Track mouse and touches through event listeners

		this.mouse = { pressed: -1, x: 0, y: 0 };

		const mousemove = ({ pageX, pageY }) => {
			this.mouse.x = pageX - this.canvas.offsetLeft;
			this.mouse.y = pageY - this.canvas.offsetTop;
			if (this.onmousemove) this.onmousemove();
		};
		const mousepress = button => {
			this.mouse.pressed = button;
			if (button === -1 && this.onmouseup) this.onmouseup();
			else if (this.onmousedown) this.onmousedown();
		};

		window.addEventListener("touchend", () => mousepress(-1));
		window.addEventListener("mouseup", () => mousepress(-1));
		this.canvas.addEventListener("touchmove", e => mousemove(e.changedTouches[0]));
		this.canvas.addEventListener("mousemove", e => mousemove(e));
		this.canvas.addEventListener("touchstart", e => {
			mousepress(0);
			mousemove(e.changedTouches[0]);
		});
		this.canvas.addEventListener("mousedown", e => {
			mousepress(e.button);
			mousemove(e);
		});

	}



	// Initialising canvas properties

	setColours() {
		// Get colours defined on root element in css
		const style = window.getComputedStyle(document.documentElement);
		this.colours = {
			background: style.getPropertyValue("--background-color"),
			foreground: style.getPropertyValue("--text-color"),
			accent: style.getPropertyValue("--accent-color")
		};
		
		// Init colours
		this.ctx.strokeStyle = this.colours.accent;
		this.ctx.fillStyle = this.colours.foreground;
	}

	resize() {
		const size = Math.min(window.innerHeight * 0.7, document.body.clientWidth);
		this.canvas.width = size;
		this.canvas.height = size;
		this.setColours();
		return this.canvas;
	}

	
	// Conversions between distances

	mToPx(metres) {
		return this.canvas.height * metres / this.scale;
	}
	pxToM(px) {
		return px / this.canvas.height * this.scale;
	}
	percToPx(perc) {
		return this.canvas.height * perc / 100;
	}
	pxToPerc(px) {
		return px / this.canvas.height * 100;
	}
	percToM(perc) {
		return this.pxToM(this.percToPx(perc));
	}
	mToPerc(m) {
		return this.pxToPerc(this.mToPx(m));
	}


	addButton(label, func) {
		const container = document.getElementById("controls");
		const btn = document.createElement("button");
		btn.textContent = label;
		btn.addEventListener("click", func);
		container.appendChild(btn);
	}

	addSlider(name, obj, prop, min, max, step) {
		const id = `range-${prop}`;
		const container = document.getElementById("controls");
		const elt = new DOMParser().parseFromString(`
			<div class="sliderbox">
				<label for="${id}">${name}</label>
				<input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${obj[prop]}"/>
				<output for="${id}">${obj[prop]}</output>
			</div>
		`, "text/html").body.firstChild;
		container.appendChild(elt);
		elt.children.namedItem(id).addEventListener("input", e => {
			// This might be a bit janky idk
			obj[prop] = e.target.nextElementSibling.textContent = parseFloat(e.target.value);
		});
	}


	start() {

		const render = () => {
			// We want all the units in seconds, to make other units more realistic
			const time = performance.now() / 1000 - this.timeStart;
			this.delta = time - this.time;
			this.time = time;

			/*
			 * Calculations are not done if the framerate is less than
			 * 10 per second. This is to counter the issue of the
			 * mass 'jumping' if the script goes idle for any substantial
			 * amount of time (e.g. if the user switches to another tab
			 * and back).
			 * If the rendering is running less than 10 times per
			 * second, nothing will animate. But things would get weird
			 * at very low framerates anyway.
			 */
			if (this.render && 1 / this.delta >= 10) {
				this.render();
			}
			window.requestAnimationFrame(render);
		}

		// Start animation loop
		this.timeStart = performance.now() / 1000;
		this.delta = 0;
		this.time = this.timeStart;
		if (this.init) this.init();
		render();
	}
}
