import { Point, SnakeAction } from "./types";

/**
 * 3 是指：
 * - 蛇的 x 坐标
 * - 蛇的 y 坐标
 * - 距离食物的 x 坐标
 * - 距离食物的 y 坐标
 */
export const SNAKE_STATE_LENGTH = 4;

export const MAX_TRAINING_DATA_LENGTH = 2000;

export const SNAKE_DIRECTION_ACTION_MAP: Record<SnakeAction, Point> = {
  [SnakeAction.up]: { x: 0, y: 1 },
  [SnakeAction.right]: { x: 1, y: 0 },
  [SnakeAction.down]: { x: 0, y: -1 },
  [SnakeAction.left]: { x: -1, y: 0 },
};
