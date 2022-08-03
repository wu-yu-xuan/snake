import { Point, SnakeAction } from "./types";

/**
 * - 八个方向上是否有障碍物。
 * - 八个方向上是否有食物。
 */
export const SNAKE_STATE_LENGTH = 16;

export const MAX_TRAINING_DATA_LENGTH = 1500;

export const SNAKE_DIRECTION_ACTION_MAP: Record<SnakeAction, Point> = {
  [SnakeAction.up]: { x: 0, y: 1 },
  [SnakeAction.right]: { x: 1, y: 0 },
  [SnakeAction.down]: { x: 0, y: -1 },
  [SnakeAction.left]: { x: -1, y: 0 },
};

export const SNAKE_ACTION_ARRAY = [
  SnakeAction.up,
  SnakeAction.right,
  SnakeAction.down,
  SnakeAction.left,
];

/**
 * 从0点方向顺时针绕一圈的八个方向
 */
export const EIGHT_DIMENSION: Point[] = [
  {
    x: 0,
    y: 1,
  },
  {
    x: 1,
    y: 1,
  },
  {
    x: 1,
    y: 0,
  },
  {
    x: 1,
    y: -1,
  },
  {
    x: 0,
    y: -1,
  },
  {
    x: -1,
    y: -1,
  },
  {
    x: -1,
    y: 0,
  },
  {
    x: -1,
    y: 1,
  },
];
