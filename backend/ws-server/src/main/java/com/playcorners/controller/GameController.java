package com.playcorners.controller;

import com.playcorners.controller.message.Reason;
import com.playcorners.controller.message.GameError;
import com.playcorners.model.Game;
import com.playcorners.service.GameService;
import com.playcorners.service.PlayerService;
import com.playcorners.websocket.LobbyWsEndpoint;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;

import java.util.List;

import static com.playcorners.controller.message.Reason.CANNOT_JOIN_GAME_GENERAL;

@Path("/games")
public class GameController {

    @Inject
    private GameService gameService;

    @Inject
    private PlayerService playerService;

    @Inject
    private LobbyWsEndpoint lobbyWsEndpoint;

    @GET
    public List<Game> getAllGames(@HeaderParam("userName") String userName) {
        return gameService.getAllGames();
    }

    @GET
    @Path("/{gameId}")
    public Game getGameById(@PathParam("gameId") String gameId) {
        return gameService.getGameById(gameId).orElseThrow(() -> new GameError(Reason.GAME_NOT_FOUND));
    }

    @POST
    public Response createGame(@HeaderParam("userName") String userName) {
        playerService.getPlayerByName(userName)
                .map(p -> {
                    var game = gameService.createGame(p);
                    game.ifPresent(g -> lobbyWsEndpoint.broadcastGameUpdate(g));
                    return game;
                })
                .orElseThrow(() -> new GameError(Reason.USER_NOT_FOUND))
                .orElseThrow(() -> new GameError(Reason.GAME_NOT_CREATED));

        return Response.ok().build();
    }

    @POST
    @Path("/join")
    public Response joinGame(@HeaderParam("userName") String userName, @HeaderParam("gameId") String gameId) {
        lobbyWsEndpoint.broadcastGameUpdate(playerService.getPlayerByName(userName)
                .map(p -> gameService.joinGame(p, gameId))
                .orElseThrow(() -> new GameError(CANNOT_JOIN_GAME_GENERAL)));

        return Response.ok().build();
    }

}
