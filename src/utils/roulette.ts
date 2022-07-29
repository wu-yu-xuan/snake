import { RouletteItem } from "../types";

export default function roulette<T>(rouletteArray: RouletteItem<T>[]) {
  const sum = rouletteArray.reduce((sum, item) => sum + item.probability, 0);

  let random = Math.random() * sum;

  let _sum = 0;

  for (const iterator of rouletteArray) {
    _sum += iterator.probability;
    if (random <= _sum) {
      return iterator.value;
    }
  }

  return rouletteArray[rouletteArray.length - 1].value;
}
