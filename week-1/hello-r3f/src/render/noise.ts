import type { Rng } from "../sim/rng";

const smooth = (t: number) => t * t * (3 - 2 * t);

// Smooth random values from 0 to 1 over a size × size square that repeats with no
// seam. `cells` is how many blobs fit across the square at the coarsest level; each
// extra octave adds finer detail at half the strength.
export const tileableNoise = (
  rng: Rng,
  size: number,
  cells: number,
  octaves: number,
): Float32Array => {
  const field = new Float32Array(size * size);
  let amplitude = 1;
  let total = 0;
  for (let octave = 0; octave < octaves; octave++) {
    const count = cells * 2 ** octave;
    const lattice = Float32Array.from({ length: count * count }, () => rng());
    for (let y = 0; y < size; y++) {
      const fy = (y / size) * count;
      const y0 = Math.floor(fy);
      const ty = smooth(fy - y0);
      const row0 = (y0 % count) * count;
      const row1 = ((y0 + 1) % count) * count; // Wraps round, so the edges meet
      for (let x = 0; x < size; x++) {
        const fx = (x / size) * count;
        const x0 = Math.floor(fx);
        const tx = smooth(fx - x0);
        const col0 = x0 % count;
        const col1 = (x0 + 1) % count;
        const top = lattice[row0 + col0] * (1 - tx) + lattice[row0 + col1] * tx;
        const bottom = lattice[row1 + col0] * (1 - tx) + lattice[row1 + col1] * tx;
        field[y * size + x] += amplitude * (top * (1 - ty) + bottom * ty);
      }
    }
    total += amplitude;
    amplitude *= 0.5;
  }
  for (let i = 0; i < field.length; i++) field[i] /= total;
  return field;
};
