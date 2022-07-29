import { MAX_TRAINING_DATA_LENGTH } from "./const";
import { SingleTrainingData } from "./types";
import { writeJSON } from "fs-extra";

export default class TrainingDataService {
  trainingDataArray: SingleTrainingData[] = [];

  async load() {
    try {
      const json = (await import("./data/trainingData.json")).default;
      if (Array.isArray(json)) {
        console.log(`load training data`, json.length);
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
      return [];
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
