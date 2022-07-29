import { Point } from "../types";

interface GenerateFoodOptions {
  width: number;
  height: number;
  body: Point[];
}

export default function generateFood({
  width,
  height,
  body,
}: GenerateFoodOptions) {
  const availablePoints = [];

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (!body.some(({ x: bodyX, y: bodyY }) => bodyX === x && bodyY === y)) {
        availablePoints.push({ x, y });
      }
    }
  }

  if (!availablePoints.length) {
    return null;
  }

  return availablePoints[Math.floor(Math.random() * availablePoints.length)];
}
