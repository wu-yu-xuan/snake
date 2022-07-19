import Game from "./Game";

const game = new Game({
  width: 10,
  height: 10,
});

async function main() {
  game.iterate(100);
}

main();
