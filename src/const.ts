import { Point } from "./types";

/**
 * 八个方向
 */
export const SNAKE_DELTA: Point[] = [
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 1, y: -1 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: -1, y: 0 },
  { x: -1, y: 1 },
  { x: -1, y: -1 },
];

/**
 * css 的上右下左 hhh
 */
export const SNAKE_DIRECTION = [
  { x: 0, y: 1 },
  { x: 1, y: 0 },
  { x: 0, y: -1 },
  { x: -1, y: 0 },
];

export const SNAKE_FOOD_ITERATION = 10;

export const SNAKE_STATE_LENGTH =
  2 +
  SNAKE_DELTA.reduce((acc, cur) => {
    return acc + Number(Boolean(cur.x)) + Number(Boolean(cur.y));
  }, 0);
