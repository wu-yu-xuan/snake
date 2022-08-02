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
      SNAKE_STATE_LENGTH,
      8,
      16,
      32,
      16,
      8,
      4,
      /**
       * action 个数个 Q。
       * 如果 action 作为输入层，则需要记得进行 oneHot 编码。
       */
      SNAKE_ACTION_ARRAY.length,
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

    this.fixedModel.setWeights(this.trainingModel.getWeights());
  }

  async predict(currentState: number[]): Promise<SnakeAction> {
    if (this.trainingData.trainingDataArray.length < MAX_TRAINING_DATA_LENGTH) {
      return Math.floor(Math.random() * SNAKE_ACTION_ARRAY.length);
    }

    /**
     * 4 * 1
     */
    const outputTensor = this.trainingModel.predict(
      tensor2d(currentState, [1, SNAKE_STATE_LENGTH])
    ) as Tensor;

    const outputArray = ((await outputTensor.array()) as [number[]])[0];

    return outputArray.reduce<number>((acc, cur, index) => {
      if (outputArray[acc] >= cur) {
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

    const inputArray = dataArray.map((x) => x.currentState).flat();

    /**
     * batchSize * 3
     */
    const inputTensor = tensor2d(inputArray, [
      this.nodeLengthOfLayers[0],
      batchSize,
    ]).transpose();

    /**
     * 4 * batchSize
     */
    const oldQTensor = this.trainingModel.predict(inputTensor) as Tensor;

    /**
     * 4 * batchSize
     */
    const oldQArray = (await oldQTensor.array()) as number[][];

    const outputArray = await Promise.all(
      dataArray.map(async (x, index) => {
        return Promise.all(
          x.nextArray.map(async ({ action, nextState, reward, done }) => {
            const outputTensor = this.fixedModel.predict(
              tensor2d(nextState, [1, SNAKE_STATE_LENGTH])
            ) as Tensor;

            const outputArray = ((await outputTensor.array()) as number[][])[0];

            const maxQ = Math.max(...outputArray);

            const oldQ = oldQArray[index][action];

            /**
             * Q 学习核心公式
             */
            const newQ =
              oldQ +
              this.learnRate *
                (reward + (done ? 0 : this.attenuationFactor * maxQ) - oldQ);

            return newQ;
          })
        );
      })
    );

    /**
     * batchSize * 4
     */
    const outputTensor = tensor2d(outputArray, [
      batchSize,
      this.nodeLengthOfLayers[this.nodeLengthOfLayers.length - 1],
    ]);

    const res = await this.trainingModel.fit(inputTensor, outputTensor);

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
    const modelLayers = this.nodeLengthOfLayers
      .map((units, index) => {
        if (index === 0) {
          return layers.batchNormalization({ inputShape: [units] });
        }

        if (index === this.nodeLengthOfLayers.length - 1) {
          const layer = layers.dense({
            units,
            useBias: true,
          });

          const activation = layers.leakyReLU();

          return [layer, activation];
        }

        const layer = layers.dense({
          units,
          useBias: true,
          activation:
            index === this.nodeLengthOfLayers.length - 1 ? "relu" : "sigmoid",
        });

        return layer;
      })
      .flat();

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
