import { readJSON, writeJSON } from "fs-extra";
import { MAX_TRAINING_DATA_LENGTH } from "./const";
import { SingleTrainingData } from "./types";

export default class TrainingDataService {
  trainingDataArray: SingleTrainingData[] = [];

  async load() {
    try {
      const json = await readJSON("./trainingData.json");
      if (Array.isArray(json)) {
        this.trainingDataArray = json;
      }
    } catch (err) {}
  }

  save() {
    return writeJSON("./trainingData.json", this.trainingDataArray);
  }

  push(trainingData: SingleTrainingData) {
    this.trainingDataArray.push(trainingData);
    if (this.trainingDataArray.length > MAX_TRAINING_DATA_LENGTH) {
      this.trainingDataArray.splice(
        0,
        this.trainingDataArray.length - MAX_TRAINING_DATA_LENGTH
      );
    }
  }

  take(dataLength = 50) {
    if (dataLength > this.trainingDataArray.length) {
      console.log(`warning: training data is not enough`);
      return this.trainingDataArray;
    }
    const indexArray: number[] = [];
    while (indexArray.length < dataLength) {
      const index = Math.floor(Math.random() * this.trainingDataArray.length);
      if (!indexArray.includes(index)) {
        indexArray.push(index);
      }
    }
    return indexArray.map((index) => this.trainingDataArray[index]);
  }
}
