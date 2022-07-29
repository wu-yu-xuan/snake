import { sigmoid, tensor, tensor1d } from "@tensorflow/tfjs";
import {
  SNAKE_DELTA,
  SNAKE_DIRECTION_ACTION_MAP,
  SNAKE_STATE_LENGTH,
} from "./const";
import BaseModel from "./model/BaseModel";
import TrainingDataService from "./TrainingDataService";
import { Point, SnakeAction, SnakeDirection, SnakeOptions } from "./types";
import generateFood from "./utils/generateFood";

export default class Snake {
  isDead = false;

  body: Point[];

  food: Point;

  width: number;

  height: number;

  step = 0;

  score = 0;

  victory = false;

  trainingData: TrainingDataService;

  model: BaseModel;

  leftStep: number;

  constructor({ model, width, height, trainingData }: SnakeOptions) {
    this.model = model;
    this.width = width;
    this.height = height;
    this.leftStep = height * width * 0.5;
    this.trainingData = trainingData;
    this.body = [
      {
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height),
      },
    ];
    const food = generateFood({
      width: this.width,
      height: this.height,
      body: this.body,
    });
    this.food = food!;
  }

  async move() {
    if (this.isDead || this.victory) {
      return;
    }

    const currentState = tensor(this.getState(), [1, SNAKE_STATE_LENGTH]);

    const action = await this.model.predict(currentState);

    const nextPoint = this.getNextPoint(action);

    /**
     * 撞墙或者撞到自身就死咯
     */
    const isDead = this.isWall(nextPoint);

    if (isDead) {
      this.isDead = true;
      return;
    }

    this.step++;

    this.leftStep--;

    this.body.push(nextPoint);

    const eaten = this.food!.x === nextPoint.x && this.food!.y === nextPoint.y;

    /**
     * 吃到食物了
     */
    if (eaten) {
      const food = generateFood({
        width: this.width,
        height: this.height,
        body: this.body,
      });
      const reward = this.body.length + 10;
      this.score += reward;
      this.leftStep += reward;
      if (food) {
        this.food = food;
      } else {
        this.victory = true;
      }
      this.trainingData.push({
        currentState: (await currentState.array()) as number[],
        action,
        reward,
        nextState: this.getState(),
      });
      return;
    }

    const nextState = this.getState();
    const reward = 0;
    this.score += reward;
    if (this.leftStep < 0) {
      this.isDead = true;
      return;
    }

    /**
     * 正常前进
     */
    this.body.shift();
    this.trainingData.push({
      currentState: (await currentState.array()) as number[],
      action,
      reward,
      nextState,
    });
  }

  getState() {
    const state: number[] = [this.getDirection()];
    /**
     * 距离食物的距离
     */
    const currentPoint = this.body[this.body.length - 1];
    if (this.food) {
      const x = currentPoint.x - this.food.x;
      state.push(x);
      const y = currentPoint.y - this.food.y;
      state.push(y);
    } else {
      /**
       * 不是出 bug 就是赢了
       */
      state.push(0, 0);
    }

    /**
     * 八个距离上，到墙或者自身的距离
     */
    for (const direction of SNAKE_DELTA) {
      const position = { ...currentPoint };

      while (true) {
        position.x += direction.x;
        position.y += direction.y;
        const isWall = this.isWall(position);
        if (isWall) {
          if (direction.x) {
            state.push(position.x - currentPoint.x);
          }
          if (direction.y) {
            state.push(position.y - currentPoint.y);
          }
          break;
        }
      }
    }

    return state;
  }

  /**
   * 这个点是否位于墙上或者自身
   */
  isWall(position: Point): boolean {
    return (
      this.body.some(
        (body) => body.x === position.x && body.y === position.y
      ) ||
      position.x < 0 ||
      position.x >= this.width ||
      position.y < 0 ||
      position.y >= this.height
    );
  }

  getDirection() {
    const currentPoint = this.body[this.body.length - 1];
    const prevPoint = this.body[this.body.length - 2];

    if (!currentPoint || !prevPoint) {
      /**
       * 可能是第一次，则默认朝上
       */
      return SnakeDirection.up;
    }

    const x = currentPoint.x - prevPoint.x;

    if (x === 1) {
      return SnakeDirection.right;
    }

    if (x === -1) {
      return SnakeDirection.left;
    }

    const y = currentPoint.y - prevPoint.y;

    if (y === 1) {
      return SnakeDirection.up;
    }

    if (y === -1) {
      return SnakeDirection.down;
    }

    console.log(`could not detect direction `, currentPoint, prevPoint);
    return SnakeDirection.up;
  }

  getNextPoint(action: SnakeAction) {
    const direction = this.getDirection();
    const movement = SNAKE_DIRECTION_ACTION_MAP[direction][action];
    const currentPoint = this.body[this.body.length - 1];
    return {
      x: currentPoint.x + movement.x,
      y: currentPoint.y + movement.y,
    };
  }

  async getRewardByState(state: number[]) {
    const length = Math.sqrt(Math.pow(state[1], 2) + Math.pow(state[2], 2));
    const res = await sigmoid(tensor1d([length])).array();
    return -1 * (res[0] / this.body.length);
  }
}
