// A single shared matter.js physics world backing every small "juicy"
// animation in the game (the dialogue portraits' reaction pop, the HUD
// toast's drop-and-bounce entrance) — loaded globally via the CDN script
// tag in index.html. One tiny zero-gravity world with a handful of bodies
// is all these need; there's no reason to spin up a separate Matter.Engine
// per animated value.
const Matter = window.Matter;

const engine = Matter.Engine.create();
engine.world.gravity.x = 0;
engine.world.gravity.y = 0;

// Called once per frame (main.js) before anything reads a spring's value.
export function stepMatterWorld(dt) {
  Matter.Engine.update(engine, Math.min(dt, 0.05) * 1000);
}

// A single-axis spring: a free body tied to a fixed anchor at the origin by
// a real matter.js spring constraint, so `.value` is just how far off rest
// that body currently sits. `kick()` gives it an instant velocity impulse
// (a snappy nudge from rest); `displace()` teleports it away from rest and
// lets the constraint pull it back, which is what gives the toast its
// drop-in-from-above bounce.
// `isSensor: true` on both bodies is load-bearing, not decorative: without
// it these two coincident radius-1 circles physically collide and push
// apart, settling the "spring" at whatever distance their collision
// response balances the constraint's pull at — never back at true rest.
// Sensors keep the constraint as the only thing governing their distance.
export function createAxisSpring({ stiffness = 0.02, damping = 0.15, frictionAir = 0.12 } = {}) {
  const anchor = Matter.Bodies.circle(0, 0, 1, { isStatic: true, isSensor: true });
  const body = Matter.Bodies.circle(0, 0, 1, { frictionAir, mass: 1, isSensor: true, sleepThreshold: Infinity });
  const constraint = Matter.Constraint.create({
    bodyA: anchor, bodyB: body, length: 0, stiffness, damping,
  });
  Matter.World.add(engine.world, [anchor, body, constraint]);

  return {
    get value() { return body.position.x; },
    kick(amount) { Matter.Body.setVelocity(body, { x: amount, y: 0 }); },
    displace(offset) {
      Matter.Body.setPosition(body, { x: offset, y: 0 });
      Matter.Body.setVelocity(body, { x: 0, y: 0 });
    },
    reset() {
      Matter.Body.setPosition(body, { x: 0, y: 0 });
      Matter.Body.setVelocity(body, { x: 0, y: 0 });
    },
  };
}
