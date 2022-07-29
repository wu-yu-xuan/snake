import { Tensor } from "@tensorflow/tfjs";
import { readJSON, writeJSON } from "fs-extra";
import { MAX_TRAINING_DATA_LENGTH } from "../const";
import { QLearningModelOptions, QTableItem, SnakeAction } from "../types";
import roulette from "../utils/roulette";
import BaseModel from "./BaseModel";

const snakeActions = [
  SnakeAction.straight,
  SnakeAction.left,
  SnakeAction.right,
];

const defaultQ = 1;

export default class QLearningModel extends BaseModel {
  learnRate: number;

  attenuationFactor: number;

  QTable: QTableItem[] = [];

  constructor({
    learnRate = 0.1,
    attenuationFactor = 0.5,
    trainingData,
  }: QLearningModelOptions) {
    super({ trainingData });
    this.learnRate = learnRate;
    this.attenuationFactor = attenuationFactor;
  }

  async predict(currentStateTensor: Tensor): Promise<SnakeAction> {
    const currentState = (await currentStateTensor.array()) as number[];
    if (this.trainingData.trainingDataArray.length < MAX_TRAINING_DATA_LENGTH) {
      console.log("random");
      /**
       * 没有足够的训练集，则随机进行，积累数据
       */
      if (Math.random() < 0.5) {
        return SnakeAction.straight;
      }
      return Math.random() < 0.5 ? SnakeAction.left : SnakeAction.right;
    }

    const rouletteArray = snakeActions.map((action) => {
      return {
        value: action,
        probability: this.getQ({ currentState, action }),
      };
    });

    if (false) {
      /**
       * 没有足够的 Q，按照轮盘赌算法进行随机
       */
      return roulette(rouletteArray);
    }

    /**
     * 否则找最大的 Q
     */
    return rouletteArray.reduce((acc, cur) => {
      if (acc.probability > cur.probability) {
        return acc;
      }
      return cur;
    }).value;
  }

  async fit() {
    const dataArray = this.trainingData.take(100);
    dataArray.forEach((data) => {
      const currentQ = this.getQ(data);
      const nextQArray = snakeActions.map((action) => {
        return this.getQ({ ...data, action });
      });
      const nextQ = Math.max(...nextQArray);
      const newQ =
        currentQ +
        this.learnRate *
          (data.reward + this.attenuationFactor * nextQ - currentQ);
      this.setQ({
        currentState: data.currentState,
        action: data.action,
        Q: newQ,
      });
    });
  }

  getQ({ currentState, action }: Omit<QTableItem, "Q">) {
    return (
      this.QTable.find((x) => {
        return (
          x.action === action &&
          x.currentState.every((y, i) => y === currentState[i])
        );
      })?.Q ?? defaultQ
    );
  }

  setQ({ currentState, action, Q }: QTableItem) {
    const index = this.QTable.findIndex((x) => {
      return (
        x.action === action &&
        x.currentState.every((y, i) => y === currentState[i])
      );
    });
    if (index !== -1) {
      this.QTable[index].Q = Q;
    } else {
      this.QTable.push({ currentState, action, Q });
    }
  }

  async load(): Promise<void> {
    try {
      const json = await readJSON(`Q-learning.json`);
      if (Array.isArray(json)) {
        this.QTable = json;
        console.log(`read q table`, this.QTable.length);
      }
    } catch (e) {}
  }

  async save(): Promise<void> {
    return writeJSON(`Q-learning.json`, this.QTable);
  }
}
