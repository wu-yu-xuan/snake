import Snake from "./Snake";
import { Point } from "./types";

interface GenerateFoodOptions {
  width: number;
  height: number;
  body: Point[];
}

export function generateFood({ width, height, body }: GenerateFoodOptions) {
  const availablePoints = [];

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (!body.some(({ x: bodyX, y: bodyY }) => bodyX === x && bodyY === y)) {
        availablePoints.push({ x, y });
      }
    }
  }

  if (!availablePoints.length) {
    return null;
  }

  return availablePoints[Math.floor(Math.random() * availablePoints.length)];
}

export function findBestSnake(snakeArray: Snake[]) {
  if (snakeArray.some((x) => x.score)) {
    /**
     * 有蛇吃到食物的话，吃到食物用的步数越小越厉害
     */
    return snakeArray.reduce((acc, cur) => {
      const accScore = getScore(acc);
      const curScore = getScore(cur);
      return curScore > accScore ? cur : acc;
    });
  }

  return null;

  /**
   * 都没吃到的话，存活越久越厉害
   */
  return snakeArray.reduce((acc, cur) => {
    return cur.step > acc.step ? cur : acc;
  });
}

function getScore(snake: Snake) {
  if (snake.score === 0 || snake.step === 0) {
    return 0;
  }
  return snake.score / snake.step;
}
