import { useState } from "react";
import Game from "../Game";
import "./styles.css";

const game = new Game({
  maxScore: Number.MAX_SAFE_INTEGER,
});

game.load();

export default function App() {
  const [running, setRunning] = useState(false);

  const [_, setNumber] = useState(0);

  const update = async () => {
    const snake = await game.iterateOnce();
    if (!snake) {
      setNumber((x) => x + 1);
      setTimeout(() => {
        update();
      }, 100);
    } else {
      setRunning(false);
    }
  };

  const onClick = () => {
    setRunning(true);
    if (game.snake.score || game.snake.isDead || game.snake.victory) {
      game.reset();
    }
    update();
  };

  return (
    <>
      <div>
        <button disabled={running} onClick={onClick}>
          Start
        </button>
        <div>score: {game.snake.score}</div>
      </div>
      <div
        className="container"
        style={{
          gridTemplate: `repeat(${game.width}, 1fr) / repeat(${game.height}, 1fr)`,
        }}
      >
        {new Array(game.width).fill(0).map((_, x) => {
          return new Array(game.height).fill(0).map((_, y) => {
            const key = [x, y].join(",");
            if (x === game.snake.body.x && y === game.snake.body.y) {
              return <div key={key}>🐍</div>;
            }
            if (x === game.snake.food?.x && y === game.snake.food?.y) {
              return <div key={key}>🍰</div>;
            }
            return <div key={key} />;
          });
        })}
      </div>
    </>
  );
}
