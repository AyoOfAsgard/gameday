// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract GameDay {
    struct Game {
        address creator;
        address joiner;
        uint256 betAmount;
        bool isActive;
        address winner;
    }

    mapping(string => Game) public games;
    
    event GameCreated(string gameId, address creator, uint256 betAmount);
    event PlayerJoined(string gameId, address joiner);
    event GameEnded(string gameId, address winner, uint256 amount);

    function createGame(string memory gameId) external payable {
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(!games[gameId].isActive, "Game already exists");

        games[gameId] = Game({
            creator: msg.sender,
            joiner: address(0),
            betAmount: msg.value,
            isActive: true,
            winner: address(0)
        });

        emit GameCreated(gameId, msg.sender, msg.value);
    }

    function joinGame(string memory gameId) external payable {
        Game storage game = games[gameId];
        require(game.isActive, "Game does not exist");
        require(game.joiner == address(0), "Game is full");
        require(msg.value == game.betAmount, "Incorrect bet amount");

        game.joiner = msg.sender;
        emit PlayerJoined(gameId, msg.sender);
    }

    function endGame(string memory gameId, address winner) external {
        Game storage game = games[gameId];
        require(game.isActive, "Game is not active");
        require(winner == game.creator || winner == game.joiner, "Invalid winner");
        
        uint256 totalAmount = game.betAmount * 2;
        game.isActive = false;
        game.winner = winner;

        (bool sent, ) = winner.call{value: totalAmount}("");
        require(sent, "Failed to send winnings");

        emit GameEnded(gameId, winner, totalAmount);
    }

    function getGame(string memory gameId) external view returns (Game memory) {
        return games[gameId];
    }
} 