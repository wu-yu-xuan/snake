/**
 * 无用文件，先不删
 */
import { sigmoid, tensor, tensor1d } from "@tensorflow/tfjs";
import { SNAKE_DIRECTION_ACTION_MAP, SNAKE_STATE_LENGTH } from "./const";
import BaseModel from "./model/BaseModel";
import TrainingDataService from "./TrainingDataService";
import { Point, SnakeAction, SnakeOptions } from "./types";
import generateFood from "./utils/generateFood";

export default class Snake {
  isDead = false;

  body: Point;

  food: Point;

  width: number;

  height: number;

  step = 0;

  score = 0;

  victory = false;

  trainingData: TrainingDataService;

  model: BaseModel;

  leftStep: number;

  maxScore: number;

  constructor({ model, width, height, trainingData, maxScore }: SnakeOptions) {
    this.model = model;
    this.width = width;
    this.height = height;
    this.maxScore = maxScore;
    this.leftStep = Math.floor(height * width * 0.5);
    this.trainingData = trainingData;
    this.body = {
      x: Math.floor(Math.random() * width),
      y: Math.floor(Math.random() * height),
    };
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

    const currentState = this.getState();

    const action = await this.model.predict(currentState);

    const nextPoint = this.getNextPoint(action);

    this.body = nextPoint;

    /**
     * 撞墙或者撞到自身就死咯
     */
    const isDead = this.isWall(nextPoint);

    if (isDead) {
      this.isDead = true;
      this.trainingData.push({
        currentState,
        action,
        reward: 0,
        nextState: this.getState(),
        done: true,
      });
      return;
    }

    this.step++;

    this.leftStep--;

    const eaten = this.food!.x === nextPoint.x && this.food!.y === nextPoint.y;

    /**
     * 吃到食物了
     */
    if (eaten) {
      /**
       * 记录状态
       */
      const nextState = this.getState();

      const reward = 1;
      this.score += reward;
      this.leftStep += reward;
      this.trainingData.push({
        currentState,
        action,
        reward,
        nextState,
        done: false,
      });

      /**
       * 生成下个食物
       */
      const food = generateFood({
        width: this.width,
        height: this.height,
        body: this.body,
      });
      if (food) {
        this.food = food;
      } else {
        this.victory = true;
      }

      if (this.score >= this.maxScore) {
        this.victory = true;
      }
      return;
    }

    const nextState = this.getState();
    const reward =
      this.getRewardByState(nextState) - this.getRewardByState(currentState);
    this.score += reward;
    if (this.leftStep < 0) {
      this.isDead = true;
      return;
    }

    /**
     * 正常前进
     */

    this.trainingData.push({
      currentState,
      action,
      reward,
      nextState,
      done: false,
    });
  }

  getState() {
    return [
      this.body.x - (this.food?.x ?? 0),
      this.body.y - (this.food?.y ?? 0),
    ];
  }

  /**
   * 这个点是否位于墙上
   */
  isWall(position: Point): boolean {
    return (
      position.x < 0 ||
      position.x >= this.width ||
      position.y < 0 ||
      position.y >= this.height
    );
  }

  getNextPoint(action: SnakeAction) {
    const movement = SNAKE_DIRECTION_ACTION_MAP[action];
    return {
      x: this.body.x + movement.x,
      y: this.body.y + movement.y,
    };
  }

  getRewardByState(state: number[]) {
    return 0.001 / Math.sqrt(state.reduce((acc, cur) => acc + cur * cur, 0));
  }
}
