import Game from "./Game";

const game = new Game({
  width: 5,
  height: 5,
});

async function main() {
  game.iterate(1000);
}

main();
