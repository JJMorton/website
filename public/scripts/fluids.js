window.addEventListener("load", function() {

	'use strict';

	const sim = new Simulation();
	
	// Initial parameters
	const params = {
		mass: 1,
		b_density: 600,
		f_density: 1000,
		elasticity: 0.7,
		gravity: 9.81,
	};

	// Initial state
	const state = {
		pos: [ sim.percToM(50), sim.percToM(30) ],
		vel: [ 0, 0 ],
		getVolume: () => params.mass / params.b_density,
		getRadius: () => Math.cbrt(3/(4 * Math.PI) * state.getVolume()),
		getArea: () => Math.PI * Math.pow(state.getRadius(), 2)
	};

	// In percentages so as to resize properly
	const regions = [
		[ 0, 50, 100, 50 ]
	];

	const getAcc = function() {

		const acc = [0, params.gravity];
		const radius = state.getRadius();
		const area = state.getArea();

		regions
		.map(x => x.map(y => sim.percToM(y)))
		.forEach(([x, y, w, h]) => {

			const inside =
				x <= state.pos[0] + radius && x + w >= state.pos[0] - radius &&
				y <= state.pos[1] + radius && y + h >= state.pos[1] - radius ;

			if (inside) {

				// Upthrust
				// Made complicated by handling the cases where the ball is not fully submerged
				const isAbove = state.pos[1] - radius < y;
				const isBelow = state.pos[1] + radius > y + h;
				let volume;
				if (isAbove && isBelow) {
					const r1 = Math.pow(radius, 2) - Math.pow(state.pos[1] - y, 2);
					const r2 = Math.pow(radius, 2) - Math.pow(state.pos[1] - y + h, 2);
					volume = 1/6 * Math.PI * h * (3 * r1 + 3 * r2 + Math.pow(h, 2));
				} else if (isAbove) {
					const rel_h = state.pos[1] + radius - y;
					volume = 1/3 * Math.PI * Math.pow(rel_h, 2) * (3 * radius - rel_h);
				} else if (isBelow) {
					const rel_h = y + h - state.pos[1] - radius;
					volume = 1/3 * Math.PI * Math.pow(rel_h, 2) * (3 * radius - rel_h);
				} else {
					volume = state.getVolume();
				}
				acc[1] += -params.f_density * volume * params.gravity / params.mass;
				
				// Drag
				const vel2 = Math.pow(state.vel[0], 2) + Math.pow(state.vel[1], 2);
				if (vel2 > 0) {
					const drag = 0.5 * 0.47 * params.f_density * vel2 * area;
					acc[0] += (-drag * state.vel[0] / vel2) / params.mass;
					acc[1] += (-drag * state.vel[1] / vel2) / params.mass;
				}
			}
		});

		return acc;
	};


	sim.render = function() {

		// Calculate new position
		if (sim.mouse.pressed === 0) {
			state.vel = [0, 0]
		} else {
			const acc = getAcc();
			state.vel[0] += acc[0] * sim.delta;
			state.vel[1] += acc[1] * sim.delta;
			state.pos[0] += state.vel[0] * sim.delta;
			state.pos[1] += state.vel[1] * sim.delta;
		}
		
		const pos = [ sim.mToPx(state.pos[0]), sim.mToPx(state.pos[1]) ];
		const radius = sim.mToPx(state.getRadius());

		// Check collisions
		
		let changed = 0;
		if (pos[0] <= radius) {
			pos[0] = radius;
			changed |= 1;
			state.vel[0] *= -params.elasticity;
		}
		else if (pos[0] >= sim.canvas.width - radius) {
			changed |= 1;
			pos[0] = sim.canvas.width - radius;
			state.vel[0] *= -params.elasticity;
		}
		if (pos[1] >= sim.canvas.width - radius) {
			changed |= 2;
			pos[1] = sim.canvas.width - radius;
			state.vel[1] *= -params.elasticity;
		}
		else if (pos[1] <= radius) {
			changed |= 2;
			pos[1] = radius;
			state.vel[1] *= -params.elasticity;
		}

		if (changed & 1) state.pos[0] = sim.pxToM(pos[0]);
		if (changed & 2) state.pos[1] = sim.pxToM(pos[1]);


		// Draw everything

		sim.ctx.clearRect(0, 0, sim.canvas.width, sim.canvas.height);
		
		sim.ctx.globalAlpha = 0.3;

		regions
			.map(x => x.map(y => sim.percToPx(y)))
			.forEach(([ x, y, w, h ]) => sim.ctx.fillRect(x, y, w, h));
			
		sim.ctx.globalAlpha = 1;

		if (sim.mouse.pressed === 0) {
			sim.ctx.beginPath();
			sim.ctx.moveTo(pos[0], pos[1]);
			sim.ctx.lineTo(sim.mouse.x, sim.mouse.y);
			sim.ctx.closePath();
			sim.ctx.stroke();
		}

		sim.ctx.beginPath();
		sim.ctx.arc(pos[0], pos[1], radius, 0, 2 * Math.PI);
		sim.ctx.closePath();
		sim.ctx.fill();
	};


	// Allow the user to 'fire' the ball with their mouse
	let mouseDownPos = { x: 0, y: 0 };
	sim.onmousedown = function() {
		mouseDownPos = { x: sim.mouse.x, y: sim.mouse.y };
		state.pos = [sim.pxToM(sim.mouse.x), sim.pxToM(sim.mouse.y)];
	};
	sim.onmouseup = function() {
		if (!mouseDownPos.x || !mouseDownPos.y) return;
		state.vel = [
			sim.pxToM(mouseDownPos.x - sim.mouse.x) * 5,
			sim.pxToM(mouseDownPos.y - sim.mouse.y) * 5
		];
		mouseDownPos = { x: 0, y: 0 };
	};


	sim.addSlider("m (kg)", params, "mass", 0.1, 5, 0.1);
	sim.addSlider("ball density (kg/m^3)", params, "b_density", 50, 1500, 10);
	sim.addSlider("liquid density (kg/m^3)", params, "f_density", 50, 1500, 10);
	sim.addSlider("elasticity", params, "elasticity", 0, 1, 0.01);
	sim.addSlider("g (m/s^2)", params, "gravity", 0, 20, 0.01);
	

	sim.start();

});
