import { layers, Sequential, sequential } from "@tensorflow/tfjs";
import { NetworkOptions } from "./types";
import { Dense } from "@tensorflow/tfjs-layers/dist/layers/core";

/**
 * 人工神经网络
 */
export default class Network {
  model: Sequential;
  layers: Dense[];

  constructor({ nodeLengthOfLayers, inputNode }: NetworkOptions) {
    this.layers = nodeLengthOfLayers.map((units, index) => {
      return layers.dense({
        units,
        useBias: true,
        inputShape: index === 0 ? [inputNode] : undefined,
        activation:
          index === nodeLengthOfLayers.length - 1 ? "sigmoid" : "relu",
      });
    });

    this.model = sequential({
      layers: this.layers,
    });

    this.model.compile({
      loss: "meanSquaredError",
      optimizer: "sgd",
    });
  }
}
