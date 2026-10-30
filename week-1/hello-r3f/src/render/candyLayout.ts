export const FLOOR_SIZE = 60;

export interface CandyProp {
  kind: "lollipop" | "gumdrop";
  position: [number, number]; // x and z on the floor
  size: number; // Radius of the candy
  color: string;
}

// Kept to the sides and back, clear of the ball and its dust
export const CANDY_PROPS: CandyProp[] = [
  { kind: "lollipop", position: [-5.5, -3], size: 0.9, color: "#ff5fa2" },
  { kind: "lollipop", position: [6.5, -5], size: 1.1, color: "#7a5cff" },
  { kind: "lollipop", position: [-10, -10], size: 1.4, color: "#ffb347" },
  { kind: "gumdrop", position: [4.2, 0.5], size: 0.7, color: "#ff4d6d" },
  { kind: "gumdrop", position: [-4.5, 1], size: 0.6, color: "#ffe14d" },
  { kind: "gumdrop", position: [-7.5, -6], size: 1, color: "#4de1a0" },
  { kind: "gumdrop", position: [9, -1.5], size: 0.9, color: "#b36bff" },
  { kind: "gumdrop", position: [2.5, -8], size: 1.1, color: "#ff8fd0" },
  { kind: "gumdrop", position: [-2, -12], size: 1.3, color: "#4dc3ff" },
  { kind: "gumdrop", position: [11, -9], size: 1.5, color: "#ff7a45" },
];
