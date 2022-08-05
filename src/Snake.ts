/**
 * 无用文件，先不删
 */
import { sigmoid, tensor, tensor1d } from "@tensorflow/tfjs";
import {
  EIGHT_DIMENSION,
  SNAKE_ACTION_ARRAY,
  SNAKE_DIRECTION_ACTION_MAP,
  SNAKE_STATE_LENGTH,
} from "./const";
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

  constructor({
    model,
    width,
    height,
    trainingData,
    maxScore = 200,
  }: SnakeOptions) {
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

    /**
     * 生成训练数据。
     * 不需要训练的话可以跳过这一步
     */
    this.generateTrainingData();

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
      return;
    }

    this.step++;

    this.leftStep--;

    const eaten = this.food!.x === nextPoint.x && this.food!.y === nextPoint.y;

    /**
     * 吃到食物了
     */
    if (eaten) {
      const reward = 1;
      this.score += reward;
      this.leftStep += 10;

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

    /**
     * 没有剩余步数了
     */
    if (this.leftStep < 0) {
      this.isDead = true;
      return;
    }
  }

  generateTrainingData() {
    const currentState = this.getState();

    const nextArray = SNAKE_ACTION_ARRAY.map((action) => {
      const nextPoint = this.getNextPoint(action);
      const nextState = this.getState(nextPoint);
      const isDead = this.isWall(nextPoint);
      /**
       * 撞墙死亡
       */
      if (isDead) {
        return {
          action,
          reward: -0.0001,
          nextState,
          done: true,
        };
      }

      const eaten =
        this.food!.x === nextPoint.x && this.food!.y === nextPoint.y;
      if (eaten) {
        /**
         * 吃到食物了
         */
        return {
          action,
          reward: 1,
          nextState,
          done: false,
        };
      }

      return {
        action,
        reward: 0,
        nextState,
        done: false,
      };
    });

    this.trainingData.push({ currentState, nextArray });
  }

  getState(body = this.body) {
    const wallArray = EIGHT_DIMENSION.map((point) => {
      const newPoint = {
        x: body.x + point.x,
        y: body.y + point.y,
      };
      return this.isWall(newPoint) ? 1 : 0;
    });

    const foodArray = EIGHT_DIMENSION.map((point) => {
      const newPoint = {
        x: body.x + point.x,
        y: body.y + point.y,
      };
      return this.food!.x === newPoint.x && this.food!.y === newPoint.y ? 1 : 0;
    });

    return [...wallArray, ...foodArray];
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
