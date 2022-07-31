import {
  layers,
  Sequential,
  sequential,
  tensor,
  Tensor,
  tensor2d,
} from "@tensorflow/tfjs";
import { writeJSON } from "fs-extra";
import {
  MAX_TRAINING_DATA_LENGTH,
  SNAKE_ACTION_ARRAY,
  SNAKE_STATE_LENGTH,
} from "../const";
import { DQNModelOptions, SnakeAction } from "../types";
import BaseModel from "./BaseModel";

export default class DQNModel extends BaseModel {
  trainingModel: Sequential;

  fixedModel: Sequential;

  nodeLengthOfLayers: number[];

  learnRate: number;

  attenuationFactor: number;

  syncEpoch: number;

  syncEpochLeft: number;

  constructor({
    trainingData,
    learnRate = 0.7,
    attenuationFactor = 0.8,
    syncEpoch = 20,
    nodeLengthOfLayers = [
      /**
       * +1 是指 action
       */
      SNAKE_STATE_LENGTH + 1,
      8,
      16,
      32,
      16,
      8,
      4,
      /**
       * 仅一个 Q。
       * 当然也可以设计成 action 个数个 Q，不过有点难度了。
       */
      1,
    ],
  }: DQNModelOptions) {
    super({ trainingData });

    this.nodeLengthOfLayers = nodeLengthOfLayers;

    this.learnRate = learnRate;

    this.attenuationFactor = attenuationFactor;

    this.syncEpoch = syncEpoch;

    this.syncEpochLeft = syncEpoch;

    this.trainingModel = this.createModel();

    this.fixedModel = this.createModel();
  }

  async predict(currentState: number[]): Promise<SnakeAction> {
    if (
      this.trainingData.trainingDataArray.length < MAX_TRAINING_DATA_LENGTH
    ) {
      return Math.floor(Math.random() * SNAKE_ACTION_ARRAY.length);
    }

    const outputArray = await this.getOutputArray(
      this.trainingModel,
      currentState
    );

    return outputArray.reduce<number>((acc, cur, index) => {
      if (outputArray[acc][0] >= cur[0]) {
        return acc;
      }
      return index;
    }, 0);
  }

  async fit() {
    const batchSize = 300;
    const dataArray = this.trainingData.take(batchSize);

    if (!dataArray.length) {
      return;
    }

    if (this.syncEpochLeft <= 0) {
      this.fixedModel.setWeights(this.trainingModel.getWeights());
      this.syncEpochLeft = this.syncEpoch;
    }

    const inputArray = dataArray
      .map((x) => [...x.currentState, x.action])
      .flat();

    /**
     * batchSize * 3
     */
    const inputTensor = tensor2d(inputArray, [
      this.nodeLengthOfLayers[0],
      batchSize,
    ]).transpose();

    const oldQTensor = this.fixedModel.predict(inputTensor) as Tensor;

    /**
     * 1 * batchSize
     */
    const oldQArray = (await oldQTensor.array()) as [number][];

    const outputArray = await Promise.all(
      dataArray.map(async (x, index) => {
        const outputArray = await this.getOutputArray(
          this.fixedModel,
          x.nextState
        );

        const maxQ = Math.max(...outputArray.flat());

        const oldQ = oldQArray[index][0];

        /**
         * Q 学习核心公式
         */
        const newQ =
          oldQ +
          this.learnRate * (x.reward + this.attenuationFactor * maxQ - oldQ);
        return newQ;
      })
    );

    const outputTensor = tensor2d(outputArray, [batchSize, 1]);

    const res = await this.trainingModel.fit(inputTensor, outputTensor, {
      batchSize,
    });

    console.log(`loss:`, res.history.loss?.[0]);

    this.syncEpochLeft--;
  }

  async getOutputArray(model: Sequential, currentState: number[]) {
    const inputArray = SNAKE_ACTION_ARRAY.map((action) => {
      return [...currentState, action];
    }).flat();

    const input = tensor2d(inputArray, [
      this.nodeLengthOfLayers[0],
      SNAKE_ACTION_ARRAY.length,
    ]).transpose();

    const output = model.predict(input) as Tensor;

    const outputArray = (await output.array()) as [number][];

    /**
     * 1 * 4
     */
    return outputArray;
  }

  createModel() {
    const modelLayers = this.nodeLengthOfLayers.map((units, index) => {
      if (index === 0) {
        return layers.batchNormalization({ inputShape: [units] });
      }
      const layer = layers.dense({
        units,
        useBias: true,
        activation: "relu",
      });
      return layer;
    });

    const model = sequential({
      layers: modelLayers,
    });

    model.compile({
      loss: "meanSquaredError",
      optimizer: "sgd",
    });

    return model;
  }

  async load(): Promise<void> {
    try {
      const json = (await import(`../data/DQN.json`)).default;
      if (Array.isArray(json) && json.length) {
        const jsonTensor = json.map((x) => tensor(x));
        this.trainingModel.setWeights(jsonTensor);
        this.fixedModel.setWeights(jsonTensor);
        console.log(`read DQN weight`);
      }
    } catch (e) {}
  }

  async save(): Promise<void> {
    const json = await Promise.all(
      this.trainingModel.getWeights().map((x) => x.array())
    );
    return writeJSON(`./src/data/DQN.json`, json);
  }
}
