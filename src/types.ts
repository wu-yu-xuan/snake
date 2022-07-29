import BaseModel from "./model/BaseModel";
import Network from "./Network";
import TrainingDataService from "./TrainingDataService";

export interface GameOptions {
  width?: number;
  height?: number;
}

export interface SnakeOptions {
  width: number;
  height: number;
  trainingData: TrainingDataService;
  model: BaseModel;
}

export interface NetworkOptions {
  nodeLengthOfLayers: number[];
  inputNode: number;
}

export interface Point {
  x: number;
  y: number;
}

export enum SnakeAction {
  straight = 0,
  left = 1,
  right = 2,
}

export enum SnakeDirection {
  up = 0,
  right = 1,
  down = 2,
  left = 3,
}

export interface SingleTrainingData {
  currentState: number[];
  action: SnakeAction;
  nextState: number[];
  reward: number;
}

export interface BaseModelOptions {
  trainingData: TrainingDataService;
}

export interface QLearningModelOptions extends BaseModelOptions {
  /**
   * 学习率。
   * 取值范围：0～1。
   * 越高学习速度越快，但也有可能过拟合。
   */
  learnRate?: number;
  /**
   * 衰减系数。
   * 取值范围：0～1。
   * 越高越在乎未来奖励，越低越在乎眼前奖励。
   */
  attenuationFactor?: number;
}

export interface QTableItem {
  currentState: number[];
  action: SnakeAction;
  Q: number;
}

export interface RouletteItem<T> {
  value: T,
  probability: number,
}
