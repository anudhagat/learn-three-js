export const FLOOR_SIZE = 60;

export type CandyKind = "lollipop" | "gumdrop" | "cupcake" | "donut" | "candyCane" | "macaron";

export interface CandyProp {
  kind: CandyKind;
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
  { kind: "gumdrop", position: [0.6, -12.5], size: 1.3, color: "#4dc3ff" },
  { kind: "gumdrop", position: [11, -9], size: 1.5, color: "#ff7a45" },
  { kind: "cupcake", position: [-8.5, -0.5], size: 0.9, color: "#ff8fc8" },
  { kind: "cupcake", position: [8.2, -7.5], size: 1, color: "#8fe0ff" },
  { kind: "donut", position: [-3.2, -6.5], size: 0.9, color: "#ff6fa8" },
  { kind: "donut", position: [7.4, -2.6], size: 0.8, color: "#ffd24d" },
  { kind: "candyCane", position: [-3, -3.8], size: 0.8, color: "#e8334a" },
  { kind: "candyCane", position: [9.5, -4.2], size: 1, color: "#3a7bff" },
  { kind: "macaron", position: [-1.8, -9.5], size: 0.8, color: "#b9f0a0" },
  { kind: "macaron", position: [3.2, -4.2], size: 0.7, color: "#ffb3d9" },
];
