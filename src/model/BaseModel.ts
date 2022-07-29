import TrainingDataService from "../TrainingDataService";
import { BaseModelOptions, SnakeAction } from "../types";

/**
 * 所有模型的基础抽象类
 */
export default abstract class BaseModel {
  trainingData: TrainingDataService;

  constructor({ trainingData }: BaseModelOptions) {
    this.trainingData = trainingData;
  }

  async predict(currentState: number[]): Promise<SnakeAction> {
    return SnakeAction.up;
  }

  async fit() {}

  async save() {}

  async load() {}

  log() {}
}
