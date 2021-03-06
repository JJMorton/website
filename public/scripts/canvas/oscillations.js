window.addEventListener("load", function() {

	'use strict';

	const sim = new Simulation();
	
	// Initial parameters
	const params = {
		density: 500,
		m: 1,
		k: 10,
		b: 0.2,
		d_f: 0,
		d_a: 0
		/*
		 * d_a is the amplitude of the displacement of the driver.
		 * I was going to make this the amplitude of the force, but then
		 * the displacement of the driver depended on k, giving kind of
		 * ridiculous displacements for the driver.
		 */
	};

	// Initial state
	const state = {
		pos: 1,
		vel: 0,
		getSize: () => Math.cbrt(params.m / params.density)
	};

	const getAcc = function() {
		const spring_force = -params.k * state.pos;
		const damping_force = -params.b * state.vel;
		const driver_force = params.k * params.d_a * Math.cos(2 * Math.PI * params.d_f * sim.timer.getTime());

		return (spring_force + damping_force + driver_force) / params.m;
	};

	sim.render = function() {

		// Calculate position of mass

		state.vel += getAcc() * sim.delta;
		state.pos += state.vel * sim.delta;

		const size = state.getSize();

		if (sim.mouse.pressed === 0) {
			state.vel = 0;
			const mousePos = Math.max(Math.min(sim.mouse.y,
				sim.percToPx(100) - sim.mToPx(size/2)),
				sim.mToPx(size/2)
			);
			state.pos = sim.pxToM(mousePos - sim.percToPx(50) - sim.mToPx(params.d_a));
		}

		const pos = sim.mToPx(state.pos) - sim.mToPx(size/2) + sim.percToPx(50) + sim.mToPx(params.d_a);
		

		// Draw everything

		sim.ctx.clearRect(0, 0, sim.canvas.width, sim.canvas.height);

		// Equilibrium line
		for (let y = sim.percToPx(50); y < sim.percToPx(100); y += sim.mToPx(1)) {
			sim.ctx.fillRect(0, y, sim.percToPx(10), 1);
			sim.ctx.fillText(`${Math.round((sim.pxToM(y) - sim.scale/2) * 10) / 10} m`, 5, y - 3);
		}
		for (let y = sim.percToPx(50); y > 0; y -= sim.mToPx(1)) {
			sim.ctx.fillRect(0, y, sim.percToPx(10), 1);
		}
		sim.ctx.fillRect(0, sim.percToPx(50), sim.percToPx(100), 1);

		// Mass and string
		sim.ctx.fillRect(sim.percToPx(50) - sim.mToPx(0.01), 0, sim.mToPx(0.02), pos);
		sim.ctx.fillRect(sim.percToPx(50) - sim.mToPx(size/2), pos, sim.mToPx(size), sim.mToPx(size));

		// Driver
		const d_f = params.d_f;
		const d_pos = params.d_a * (1 + Math.cos(2 * Math.PI * d_f * sim.timer.getTime()));
		sim.ctx.fillRect(sim.percToPx(50) - sim.mToPx(0.2), 0, sim.mToPx(0.4), sim.mToPx(d_pos));
	};

	sim.addSlider("springconstant", "Spring Constant", "N/m", params.k, 1, 20, 0.1, value => params.k = value);
	sim.addSlider("damping", "Damping", "kg/s", params.b, 0, 2, 0.01, value => params.b = value);
	sim.addSlider("mass", "Mass", "kg", params.m, 0.1, 5, 0.1, value => params.m = value);
	sim.addSlider("frequency", "Driving Frequency", "Hz", params.d_f, 0, 5, 0.01, value => params.d_f = value);
	sim.addSlider("amplitude", "Driving Amplitude", "m", params.d_a, 0, 0.5, 0.01, value => params.d_a = value);
	sim.addSlider("scale", "Scale", "m", sim.scale, 1, 20, 1, value => sim.scale = value);

	sim.start();

});
