import BaseModel from "./model/BaseModel";
import DQNModel from "./model/DQNModel";
import Snake from "./Snake";
import TrainingDataService from "./TrainingDataService";
import { GameOptions } from "./types";

export default class Game {
  snake!: Snake;

  width: number;

  height: number;

  trainingData: TrainingDataService;

  model: BaseModel;

  constructor({ width = 3, height = 3 }: GameOptions) {
    this.width = width;

    this.height = height;

    this.trainingData = new TrainingDataService();

    this.model = new DQNModel({ trainingData: this.trainingData });

    this.reset();
  }

  reset() {
    this.snake = new Snake({
      width: this.width,
      height: this.height,
      trainingData: this.trainingData,
      model: this.model,
    });
  }

  async iterateOnce() {
    await this.snake.move();

    /**
     * 当所有蛇都死亡时，把最好的蛇作为训练集训练 NN
     */
    if (this.snake.isDead || this.snake.victory) {
      let snake = this.snake;
      await this.model.fit();
      return snake;
    }
  }

  async iterateUntilDead() {
    while (true) {
      const snake = await this.iterateOnce();
      if (snake) {
        this.reset();
        return snake;
      }
    }
  }

  async save() {
    return Promise.all([this.trainingData.save(), this.model.save()]);
  }

  async load() {
    return Promise.all([this.trainingData.load(), this.model.load()]);
  }

  async iterate(iterateCount: number) {
    await this.load();

    let length = 0;

    let victory = 0;

    for (let index = 0; index < iterateCount; index++) {
      const snake = await this.iterateUntilDead();

      if (snake.score) {
        console.log(index, "score", snake.score, "step", snake.step);
        length++;
      }

      if (snake.victory) {
        victory++;
      }

      if (index && index % 50 === 0) {
        await this.save();
      }
    }

    console.log(`summary: length of snake that eaten`, length);

    console.log(`summary: victory of snake`, victory);

    this.model.log();

    return this.save();
  }
}
