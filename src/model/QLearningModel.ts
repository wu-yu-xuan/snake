/**
 * @fileoverview do not use. see origin/Q-learning instead.
 */
import { MAX_TRAINING_DATA_LENGTH, SNAKE_ACTION_ARRAY } from "../const";
import { QLearningModelOptions, QTableItem, SnakeAction } from "../types";
import roulette from "../utils/roulette";
import { writeJSON } from "fs-extra";
import BaseModel from "./BaseModel";

const defaultQ = 1;

export default class QLearningModel extends BaseModel {
  learnRate: number;

  attenuationFactor: number;

  QTable: QTableItem[] = [];

  getAllCount = 0;

  getSuccessCount = 0;

  constructor({
    learnRate = 0.5,
    attenuationFactor = 0.9,
    trainingData,
  }: QLearningModelOptions) {
    super({ trainingData });
    this.learnRate = learnRate;
    this.attenuationFactor = attenuationFactor;
  }

  async predict(currentState: number[]): Promise<SnakeAction> {
    if (this.trainingData.trainingDataArray.length < MAX_TRAINING_DATA_LENGTH) {
      return Math.floor(Math.random() * SNAKE_ACTION_ARRAY.length);
    }

    const rouletteArray = SNAKE_ACTION_ARRAY.map((action) => {
      return {
        value: action,
        probability: this.getQ({ currentState, action }),
      };
    });

    if (false) {
      /**
       * 按照轮盘赌算法进行随机
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
    if (!dataArray.length) {
      return;
    }
    dataArray.forEach((data) => {
      const currentQ = this.getQ(data);
      const nextQArray = SNAKE_ACTION_ARRAY.map((action) => {
        return this.getQ({ currentState: data.nextState, action });
      });
      const nextQ = Math.max(...nextQArray);
      const newQ =
        currentQ +
        this.learnRate *
          (data.reward + this.attenuationFactor * nextQ - currentQ);
      if (newQ > 40) {
        debugger;
      }
      this.setQ({
        currentState: data.currentState,
        action: data.action,
        Q: newQ,
      });
    });
  }

  getQ({ currentState, action }: Omit<QTableItem, "Q">) {
    this.getAllCount++;
    const Q = this.QTable.find((x) => {
      return (
        x.action === action &&
        x.currentState.every((y, i) => y === currentState[i])
      );
    })?.Q;
    if (Q) {
      this.getSuccessCount++;
      return Q;
    }
    return defaultQ;
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
      const json = (await import(`../data/Q-learning.json`)).default;
      if (Array.isArray(json)) {
        this.QTable = json;
        console.log(`read q table`, this.QTable.length);
      }
    } catch (e) {}
  }

  async save(): Promise<void> {
    return writeJSON(`./src/data/Q-learning.json`, this.QTable);
  }

  log() {
    console.log(`successful get Q: `, this.getSuccessCount / this.getAllCount);
  }
}
