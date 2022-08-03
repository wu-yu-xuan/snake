import Game from "./Game";

const game = new Game({});

async function main() {
  game.iterate(100);
}

main();
