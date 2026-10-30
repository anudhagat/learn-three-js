// Turns a square of heights (0 to 1) into the pixels of a normal map, so flat paint
// catches the light like it has bumps. The edges wrap round, so the result tiles.
// `strength` is how steep the bumps look; zero gives flat ground.
export const normalsFromHeights = (
  heights: Float32Array,
  size: number,
  strength: number,
): Uint8ClampedArray<ArrayBuffer> => {
  const out = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    const above = ((y - 1 + size) % size) * size;
    const below = ((y + 1) % size) * size;
    for (let x = 0; x < size; x++) {
      const left = (x - 1 + size) % size;
      const right = (x + 1) % size;
      // Image rows run downwards, but the normal map's green points up, so a rise
      // down the image tilts the normal towards +green
      const nx = -(heights[y * size + right] - heights[y * size + left]) * strength;
      const ny = (heights[below + x] - heights[above + x]) * strength;
      const length = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      out[i] = Math.round((nx / length) * 127.5 + 127.5);
      out[i + 1] = Math.round((ny / length) * 127.5 + 127.5);
      out[i + 2] = Math.round((1 / length) * 127.5 + 127.5);
      out[i + 3] = 255;
    }
  }
  return out;
};
