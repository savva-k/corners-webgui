import { useState, useEffect, ReactNode } from "react";
import { Game } from "corners-types/dist/model/Game";
import { GameState } from "../model/GameState";
import { Piece } from "corners-types/dist/model/Piece";
import { Player } from "corners-types/dist/model/Player";
import GameContext from "./GameContext";
import DefaultTheme from "../themes/DefaultTheme";
import wsClient from "corners-client";

interface NodeProps {
  children: ReactNode;
}

const {
  REACT_APP_SECURE_PROTOCOL,
  REACT_APP_BACKEND_HOST,
  REACT_APP_BACKEND_PORT,
} = process.env;

const protocol = REACT_APP_SECURE_PROTOCOL ? "wss" : "ws";
const host = REACT_APP_BACKEND_HOST || "localhost";
const port = REACT_APP_BACKEND_PORT || 8080;

const client = wsClient.connect(protocol, host, port);

export const GameContextProvider = ({ children }: NodeProps) => {
  const [games, setGames] = useState<Game[]>([]);
  const [player, setPlayer] = useState<Player>({
    name: "New Player",
    pieceColor: Piece.White,
    registered: false,
  });
  const [error, setError] = useState<string | null>(null);
  const clearError = () => setError(null);

  useEffect(() => {
    client.onopen(() => {
      console.log("Connected to the server");
    });

    client.onerror((e: string) => {
      console.log("an error occurred: " + e);
      setError("An error occurred: " + e);
    });

    client.onclose((e: string) => {
      console.log("Socket closed: " + e);
      setError("The connection was interrupted. Please refresh the page");
    });

    client.onLogin((games, player) => {
      setPlayer({
        name: player.name,
        pieceColor: player.pieceColor,
        registered: player.registered,
      });
      setGames(games);
    });

    client.onGameCreated((newGame) => {
      if (
        games.filter((game) => game.id === newGame.id).length === 0
      ) {
        console.log("Adding a new game");
        setGames([newGame, ...games]);
      } else {
        console.log("This game has already been added");
      }
    });

    client.onGameUpdated((updatedGame) => {
      if (games.find((g) => g.id === updatedGame.id)) {
        setGames([
          { ...updatedGame },
          ...games.filter((g) => g.id !== updatedGame.id),
        ]);
        console.log("Game was updated");
      }
    });

    client.onError((message) => {
      setError(message);
    });
  }, [games]);

  const value: GameState = {
    player: player,
    games: games,
    theme: DefaultTheme,
    error: error,
    clearError: clearError,
    registerPlayer: client.login,
    makeTurn: client.makeTurn,
    createGame: client.createGame,
    joinGame: client.joinGame,
  };
  return (
    <GameContext.Provider value={value}> {children} </GameContext.Provider>
  );
};
