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

    this.body = nextPoint;

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
      const reward = 10;
      this.score += reward;
      this.leftStep += reward;
      if (food) {
        this.food = food;
      } else {
        this.victory = true;
      }
      this.trainingData.push({
        currentState,
        action,
        reward,
        nextState: this.getState(),
      });

      if (this.score >= this.maxScore) {
        this.victory = true;
      }
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

    this.trainingData.push({
      currentState,
      action,
      reward,
      nextState,
    });
  }

  getState() {
    return [this.body.x, this.body.y, this.food?.x ?? 0, this.food?.y ?? 0];
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
}
