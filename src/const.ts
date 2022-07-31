import { Point, SnakeAction } from "./types";

/**
 * - 蛇的 x 坐标 - 距离食物的 x 坐标
 * - 蛇的 y 坐标 - 距离食物的 y 坐标
 */
export const SNAKE_STATE_LENGTH = 2;

export const MAX_TRAINING_DATA_LENGTH = 5000;

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
