import { Rank, Tensor, tensor } from "@tensorflow/tfjs";
import {
  SNAKE_DELTA,
  SNAKE_DIRECTION,
  SNAKE_FOOD_ITERATION,
  SNAKE_STATE_LENGTH,
} from "./const";
import Network from "./Network";
import { Point, SnakeOptions } from "./types";
import { generateFood } from "./utils";

export default class Snake {
  isDead = false;

  network: Network;

  body: Point[];

  food: Point;

  width: number;

  height: number;

  step = 0;

  /**
   * 最大偷懒步数
   */
  maxIdleStep: number;

  currentIdleStep: number = 0;

  score = 0;

  victory = false;

  inputTrainingTensor: Tensor | null = null;

  outputTrainingTensor: Tensor | null = null;

  constructor({ network, width, height }: SnakeOptions) {
    this.network = network;
    this.width = width;
    this.height = height;
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
    this.maxIdleStep = width * height;
  }

  async move() {
    if (this.isDead || this.victory) {
      return;
    }

    const currentState = tensor(this.getState(), [1, SNAKE_STATE_LENGTH]);

    const predictTensor = this.network.model.predict(currentState) as Tensor;

    const array = (await predictTensor.array()) as number[][];

    const directionIndex = array[0].indexOf(Math.max(...array[0]));

    const direction = SNAKE_DIRECTION[directionIndex];

    const currentPoint = this.body[this.body.length - 1];

    const nextPoint = {
      x: currentPoint.x + direction.x,
      y: currentPoint.y + direction.y,
    };

    /**
     * 撞墙或者撞到自身就死咯
     */
    const isDead = this.isWall(nextPoint);

    if (isDead) {
      this.isDead = true;
      return;
    }

    this.step++;

    this.currentIdleStep++;

    this.body.push(nextPoint);

    const eaten = this.food!.x === nextPoint.x && this.food!.y === nextPoint.y;

    const outputArray = new Array(4).fill(0);
    outputArray[directionIndex] = 1;
    const outputTensor = tensor(outputArray, [1, 4]);
    outputTensor.round;
    /**
     * 吃到食物了
     */
    if (eaten) {
      const food = generateFood({
        width: this.width,
        height: this.height,
        body: this.body,
      });
      this.score += 1;
      this.currentIdleStep = 0;
      if (food) {
        this.food = food;
      } else {
        this.victory = true;
      }
      /**
       * 吃到食物了，把这个动作重复 10 次
       */
      for (let index = 0; index < SNAKE_FOOD_ITERATION * this.score; index++) {
        this.pushInputData(currentState);
        this.pushOutputData(outputTensor);
      }
      return;
    }

    /**
     * 偷懒次数过多，直接干掉
     */
    if (this.currentIdleStep > this.maxIdleStep) {
      this.isDead = true;
      return;
    }

    /**
     * 正常前进
     */
    this.body.shift();
    this.pushInputData(currentState);
    this.pushOutputData(outputTensor);
  }

  getState() {
    const state: number[] = [];
    /**
     * 距离食物的距离的倒数
     */
    const currentPoint = this.body[this.body.length - 1];
    const x = currentPoint.x - this.food!.x;
    state.push(x === 0 ? 0 : 1 / x);
    const y = currentPoint.y - this.food!.y;
    state.push(y === 0 ? 0 : 1 / y);

    /**
     * 八个距离上，到墙或者自身的距离的倒数
     */
    for (const direction of SNAKE_DELTA) {
      const position = { ...currentPoint };

      while (true) {
        position.x += direction.x;
        position.y += direction.y;
        const isWall = this.isWall(position);
        if (isWall) {
          if (direction.x) {
            state.push(1 / (position.x - currentPoint.x));
          }
          if (direction.y) {
            state.push(1 / (position.y - currentPoint.y));
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

  pushInputData(tensor: Tensor) {
    if (!this.inputTrainingTensor) {
      this.inputTrainingTensor = tensor;
      return;
    }
    this.inputTrainingTensor = this.inputTrainingTensor.concat(tensor);
  }

  pushOutputData(tensor: Tensor) {
    if (!this.outputTrainingTensor) {
      this.outputTrainingTensor = tensor;
      return;
    }
    this.outputTrainingTensor = this.outputTrainingTensor.concat(tensor);
  }
}
