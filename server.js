const app = require("express")();
const WebSocket = require("ws");
const client = new WebSocket.Server({ port: 4656 });

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    let r = Math.random() * 16 | 0;
    let v = (c == "x" ? r : (r & 0x3 | 0x8));
    return v.toString(16);
  });
}

app.use(function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type,ngrok-skip-browser-warning");
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Content-Security-Policy", "frame-ancestors *");
  next();
});

let channels = {};

function sendAllSockets(channel, data) {
  for (player in channels[channel].players) {
    channels[channel].players[player].socket.send(data);
  }
}

function playersWithoutSocket(players) {
  return Object.fromEntries(Object.entries(players).map(([k, {socket, ...rest}]) => [k, rest]));
}

function playerWithoutSocket(player) {
  return (({ socket, ...rest }) => rest)(player);
}

function updateAllPlayers(channel, players, playerChangedUUID) {
  const formattedPlayers = Object.fromEntries(Object.entries(players).map(([k, {socket, ...rest}]) => [k, rest]));
  sendAllSockets(channel, JSON.stringify({
    event: "updateAllPlayers",
    channel: channel,
    players: playersWithoutSocket(players),
    uuid: playerChangedUUID
  }));
}

function findFreePosition(players) {
  let positions = Array.from(Array(16).keys());
  let takenPositions = Object.values(players).map(player => player.position);
  for (let i = 0; i < positions.length; i++) {
    if (!takenPositions.includes(positions[i] + 1)) return positions[i] + 1;
  }
}

client.on("connection", (socket) => {
  socket.on("message", function(data) {
    data = JSON.parse(data.toString());
    const event = data.event;
    if (event == "join") {
      const channel = data.channel;
      if (!channel) return;

      if (typeof channels[channel] == "undefined") channels[channel] = { players: {} };
      const players = channels[channel].players;

      let uuid = null;

      if (data.playerUUID) {
        uuid = data.playerUUID;
        console.log("Player " + uuid + " reconnected");
      } else {
        uuid = uuidv4();
      }

      const entry = {
        socket: socket,
        username: data.username || "Guest",
        connected: true,
        position: players[uuid] ? players[uuid].position : findFreePosition(players),
        data: data.presets || {},
        uuid: uuid
      };

      players[uuid] = entry;

      socket.send(JSON.stringify({
        event: "joinCallback",
        playerUUID: uuid,
        entry: playerWithoutSocket(entry)
      }));

      updateAllPlayers(channel, players, uuid);

      socket.on("close", () => {
        if (typeof players[uuid] == "undefined") return;
        players[uuid].connected = false;
        console.log("Player " + uuid + " disconnected");
        updateAllPlayers(channel, players, uuid);
        setTimeout(() => {
          if (typeof players[uuid] == "undefined") return;
          if (!players[uuid].connected) {
            delete players[uuid];
            if (Object.keys(players).length == 0) delete channels[channel];
            console.log("Player " + uuid + " deleted");
          }
        }, 10000);
      });
    } else if (event == "updatePlayer") {
      const channel = data.channel;
      if (!channel) return;
      if (typeof channels[channel] == "undefined") return;

      const players = channels[channel].players;
      const newEntry = data.entry;
      const uuid = data.playerUUID;

      players[uuid].data = newEntry;

      updateAllPlayers(channel, players, uuid);
    } else if (event == "run") {
      const channel = data.channel;
      if (!channel) return;
      if (typeof channels[channel] == "undefined") return;

      const players = channels[channel].players;

      sendAllSockets(channel, JSON.stringify({
        event: "runCallback",
        channel: channel,
        name: data.name,
        args: data.args
      }));
    }
  });
});
