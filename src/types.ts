import Network from "./Network";

export interface GameOptions {
  /**
   * 蛇的数量，9条展示比较好看
   */
  snakeLength?: number;
  width?: number;
  height?: number;
}

export interface SnakeOptions {
  network: Network;
  width: number;
  height: number;
}

export interface NetworkOptions {
  nodeLengthOfLayers: number[];
  inputNode: number;
}

export interface Point {
  x: number;
  y: number;
}
