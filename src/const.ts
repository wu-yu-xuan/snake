import { Point, SnakeAction, SnakeDirection } from "./types";

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
 * 3 是指：
 * - 蛇头朝向
 * - 距离食物的 x 距离
 * - 距离食物的 y 距离
 */
export const SNAKE_STATE_LENGTH =
  3 +
  SNAKE_DELTA.reduce((acc, cur) => {
    return acc + Number(Boolean(cur.x)) + Number(Boolean(cur.y));
  }, 0);

export const MAX_TRAINING_DATA_LENGTH = 1000;

export const SNAKE_DIRECTION_ACTION_MAP: Record<
  SnakeDirection,
  Record<SnakeAction, Point>
> = {
  [SnakeDirection.up]: {
    [SnakeAction.left]: { x: -1, y: 0 },
    [SnakeAction.straight]: { x: 0, y: 1 },
    [SnakeAction.right]: { x: 1, y: 0 },
  },
  [SnakeDirection.right]: {
    [SnakeAction.left]: { x: 0, y: 1 },
    [SnakeAction.straight]: { x: 1, y: 0 },
    [SnakeAction.right]: { x: 0, y: -1 },
  },
  [SnakeDirection.down]: {
    [SnakeAction.left]: { x: 1, y: 0 },
    [SnakeAction.straight]: { x: 0, y: -1 },
    [SnakeAction.right]: { x: -1, y: 0 },
  },
  [SnakeDirection.left]: {
    [SnakeAction.left]: { x: 0, y: -1 },
    [SnakeAction.straight]: { x: -1, y: 0 },
    [SnakeAction.right]: { x: 0, y: 1 },
  },
};
