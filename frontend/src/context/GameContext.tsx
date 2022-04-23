import { createContext } from "react";

import { Game } from "../model/Game";
import { GameState } from "../model/GameState";

export default createContext<GameState>({
  player: { name: "New Player", registered: false },
  games: [] as Game[],
  theme: {},
  error: null,
  clearError: () => {},
  registerPlayer: (n, r) => {},
  makeTurn: (a, b, c) => {},
  createGame: () => {},
  joinGame: (i) => {},
} as GameState);