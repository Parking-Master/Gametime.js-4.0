/**
  * @license
  * Copyright (c) 2026 Parking-Master / Gametime.js-4.0
  * Licensed under the MIT License (https://mit-license.org)
  * More license and copyright information at https://github.com/Parking-Master/Gametime.js-4.0/blob/main/LICENSE
*/
window.gametime = {
  channel: "world",
  serverURL: "wss://gametime-js-4.serveousercontent.com",
  socket: null,
  players: {},
  player: {},
  username: "Guest",
  connected: false,
  playerPresets: {},
  cache: {
    events: {},
    previousEntry: null,
    previousPlayersAmount: 1
  },
  update: function() {
    if (JSON.stringify(gametime.player.data) == gametime.cache.previousEntry) return;
    gametime.cache.previousEntry = JSON.stringify(gametime.player.data);
    gametime.socket.send(JSON.stringify({
      event: "updatePlayer",
      channel: gametime.channel,
      playerUUID: gametime.player.uuid,
      entry: gametime.player.data
    }));
  },
  set: function(key, value) {
    if (key == "player") {
      if (gametime.connected) {
        gametime.logger.error("Player presets can only be set before Gametime.js connects.");
      } else {
        if (typeof value == "object") {
          gametime.playerPresets = value;
        } else {
          gametime.logger.error("Player presets must be an object.");
        }
      }
    }
    if (key == "username") {
      if (gametime.connected) {
        gametime.logger.error("Player username can only be set before Gametime.js connects.");
      } else {
        if (typeof value == "string") {
          gametime.username = value;
        } else {
          gametime.logger.error("Player username must be a string.");
        }
      }
    }
  },
  logger: {
    warn: function(message) {
      console.log("%cWarning: Gametime.js: " + message, "color: #c1780b;");
    },
    error: function(message) {
      console.log("%cError: Gametime.js: " + message, "color: #dd1111;");
    },
    success: function(message) {
      console.log("%cGametime.js: " + message, "color: #229922;");
    },
    info: function(message) {
      console.log("Gametime.js: " + message);
    }
  },
  on: function(name, handler) {
    if (typeof name !== "string") return gametime.logger.error("Event name must be a string when calling gametime.on()");
    if (typeof handler !== "function") return gametime.logger.error("Event handler must be a function when calling gametime.on()");
    gametime.cache.events[name] = handler;
  },
  run: function(name, args) {
    if (typeof name !== "string") return gametime.logger.error("Event name must be a string when calling gametime.run()");
    if (typeof args !== "object" || !(args instanceof Array)) return gametime.logger.error("Event name must be a string when calling gametime.run()");
    gametime.socket.send(JSON.stringify({
      event: "run",
      channel: gametime.channel,
      name: name,
      args: args
    }));
  },
  onconnect: null,
  onupdate: null,
  connect: function() {
    gametime.logger.info("Connecting...");
    const startTime = Date.now();
    gametime.socket = new WebSocket(gametime.serverURL);
    gametime.socket.onopen = function() {
      gametime.socket.onmessage = function(message) {
        const data = JSON.parse(message.data);
        const event = data.event;
        if (event == "joinCallback") {
          sessionStorage.setItem("multiplayerUUID", data.playerUUID);
          gametime.player = data.entry;
          gametime.connected = true;
          const time = Date.now() - startTime;
          gametime.logger.success("Successfully connected in " + time + "ms");
          if (typeof gametime.onconnect === "function") gametime.onconnect();
        }
        if (event == "updateAllPlayers") {
          if (data.channel === gametime.channel) {
            gametime.players = data.players;
            if (Object.keys(data.players).length > gametime.cache.previousPlayersAmount) {
              gametime.cache.previousPlayersAmount = Object.keys(data.players).length;
              gametime.logger.info("Player joined. There are now " + Object.keys(data.players).length + " connected players");
            }
            const player = gametime.players[data.uuid];
            if (typeof gametime.onupdate === "function") gametime.onupdate(player);
          }
        }
        if (event == "runCallback") {
          if (data.channel === gametime.channel) {
            gametime.cache.events[data.name].apply(this, data.args);
          }
        }
      };
      gametime.socket.send(JSON.stringify({
        event: "join",
        channel: gametime.channel,
        playerUUID: sessionStorage["multiplayerUUID"],
        presets: gametime.playerPresets,
        username: gametime.username
      }));
    };
    
    gametime.socket.onerror = function() {
      gametime.logger.error("Public server is currently down. Please wait for it to come back up or report an issue at https://github.com/Parking-Master/Gametime.js-4.0/issues");
    };
    
    gametime.socket.onclose = function() {
      if (gametime.connected) {
        gametime.logger.warn("Disconnected from server");
        gametime.connected = false;
      }
    };
  },
  disconnect: function() {
    if (gametime.connected) {
      gametime.socket.close();
    }
  }
};
