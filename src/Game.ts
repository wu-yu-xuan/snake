import { SNAKE_STATE_LENGTH } from "./const";
import Network from "./Network";
import Snake from "./Snake";
import { GameOptions } from "./types";
import { findBestSnake } from "./utils";
import { readJSON, writeJSON } from "fs-extra";
import { tensor } from "@tensorflow/tfjs";

export default class Game {
  snakeArray!: Snake[];

  networkArray: Network[];

  width: number;

  height: number;

  constructor({ snakeLength = 9, width = 100, height = 100 }: GameOptions) {
    this.width = width;

    this.height = height;

    this.networkArray = new Array(snakeLength).fill(0).map(() => {
      return new Network({
        nodeLengthOfLayers: [12, 8, 4],
        inputNode: SNAKE_STATE_LENGTH,
      });
    });

    this.reset();
  }

  reset() {
    this.snakeArray = new Array(this.networkArray.length)
      .fill(0)
      .map((_, index) => {
        return new Snake({
          network: this.networkArray[index],
          width: this.width,
          height: this.height,
        });
      });
  }

  async iterateOnce() {
    await Promise.all(this.snakeArray.map((snake) => snake.move()));

    /**
     * 当所有蛇都死亡时，把最好的蛇作为训练集训练 NN
     */
    if (this.snakeArray.every((snake) => snake.isDead)) {
      const bestSnake = findBestSnake(this.snakeArray);
      if (bestSnake) {
        await Promise.all(
          this.networkArray.map(async (network) => {
            if (
              !bestSnake.inputTrainingTensor ||
              !bestSnake.outputTrainingTensor
            ) {
              console.warn(`warning: no training data found`);
              return;
            }
            await network.model.fit(
              bestSnake.inputTrainingTensor,
              bestSnake.outputTrainingTensor,
              {
                epochs: bestSnake.score * 10,
              }
            );
          })
        );
      }
      this.reset();
      return bestSnake;
    }
  }

  async iterateUntilBestSnake() {
    while (true) {
      const bestSnake = await this.iterateOnce();
      if (bestSnake) {
        return bestSnake;
      }
    }
  }

  async save() {
    const json = await Promise.all(
      this.networkArray.map((network) => {
        return Promise.all(
          network.model.getWeights().map((tensor) => tensor.array())
        );
      })
    );

    return writeJSON("./weights.json", json);
  }

  async load() {
    try {
      const json = await readJSON("./weights.json");
      this.networkArray.forEach((network, index) => {
        const tensorArray = json[index].map((array: number[]) => tensor(array));
        network.model.setWeights(tensorArray);
      });
    } catch (e) {
      console.log(e);
    }
  }

  async iterate(iterateCount: number) {
    this.load();

    for (let index = 0; index < iterateCount; index++) {
      const bestSnake = await this.iterateUntilBestSnake();
      console.log(bestSnake.score, bestSnake.step);
    }

    return this.save();
  }

  draw() {}
}
