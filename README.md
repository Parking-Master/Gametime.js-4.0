# Gametime.js-4.0
An open source library for enabling multiplayer game functionality in JavaScript without a server.

Gametime.js-4.0 allows multiple regular webpages on different devices to interact with each other specifically for Multiplayer Games and Chat Rooms. No server is required but _is optional_ in case you want to use your own socket endpoint, especially for LAN multiplayer.

## Quickstart
First, import it into your page using a CDN:
```html
<script src="https://cdn.jsdelivr.net/gh/Parking-Master/Gametime.js-4.0@latest/gametime.js"></script>
```

Or for the minified version:
```html
<script src="https://cdn.jsdelivr.net/gh/Parking-Master/Gametime.js-4.0@latest/gametime.min.js"></script>
```

Then you're ready to use Gametime.js-4.0.

## Usage
### For multiplayer games
Gametime.js-4.0 lets you define what a player in your game actually is. For example, in FPS games, you can define things like what weapons that player starts out with, how much health they have, or what character they set. Then on the second player's screen, when the first player connects, the second player can load the first player's character model and initial weapons.

Later when the game is ongoing, you can easily update a player's data (like their health or score) whenever necessary.

To define a player:
```javascript
gametime.set("player", {
  health: 100,
  position: [0, 0, 0],
  score: 0
});
```

Then after you have set up the player's data, you can set the channel and connect to the Gametime.js-4.0 socket server. This is very simple to do:
```javascript
gametime.set("channel", "example-fps-game123");
gametime.connect();
```

_Tip: Channels allow you to separate your game from other Gametime.js-4.0 users and players of your game._

###### Using your own server
The default server for Gametime.js-4.0 is `gametime-js-4.serveousercontent.com`. It is maintained by us and almost always up, so you don't need to worry about using your own server. If you still want to use your own server, you can do this before calling `gametime.connect()`:
```javascript
gametime.serverURL = "ws://YOUR_SERVER_HERE";
```

For example, if you want to run a LAN multiplayer game, you could download and run the server script on `192.168.1.12:8080`, then on the page, do:
```
gametime.set("channel", "example-fps-game123");
gametime.serverURL = "ws://192.168.1.12:8080";
gametime.connect();
```

Now that Gametime.js-4.0 is finally set up, let's show you how to update player data during the game.

###### Updating players
In order for the multiplayer to actually work, you need to do two things: you need to send _your player's data_ to all other players, then you need to receive and update _all other player's data_ on the same page.

On every animation frame, set your player's data (that you defined earlier) to the current actual data (like the player's position, health, etc.):
```javascript
gametime.player.data.position = [10, 0, -15];
gametime.player.data.health = 45;
```

_Tip: This data will automatically be updated by Gametime.js and receieved by all other connected players._

Now, on every animation frame, you need to update the data of every other player:
```
// Iterate over each player
for (player in gametime.players) {
  // Make sure that player isn't you
  if (player != gametime.player.uuid) {
    const position = gametime.players[player].data.position;
    const health = gametime.players[player].data.health;
    characters[player].position.set(position[0], position[1], position[2]);
    characters[player].health = health;
    if (health <= 0) {
      // You could implement some dying logic here for the other player
    }
  }
}
```

That's it! You now have a working multiplayer game. To see all features of Gametime.js-4.0, go [here](#).

### For chat rooms
Gametime.js-4.0 uses the same event-calling logic all other versions of Gametime.js use. This allows you to easily create chat rooms instead of just multiplayer games.

For this, you don't need to define players like before (although you still can, in order to keep track of things like usernames and profile pictures) - and you also don't update player data.

First, define the channel and connect to Gametime.js-4.0:
```javascript
gametime.set("channel", "example-world-chat123");
gametime.connect();
```

Then define the events for all users on the page using `gametime.on(...)`:
```javascript
gametime.on("postChatMessage", function(message) {
  const item = document.createElement("li");
  item.textContent = message;
  document.getElementById("messages").appendChild(item);
});
```

Then when you post a message, you would call `gametime.run(...)` which calls that event for every other player:
```javascript
document.getElementById("post-message").addEventListener("click", function(event) {
  if (input.value) {
    gametime.run("postChatMessage", [input.value]);
    input.value = "";
  }
});
```

###### Example
To see how everything works, we've put together a full [Chat Room Demo](https://parking-master.github.io/Gametime.js-4.0/example.html) so you can test out Gametime.js-4.0 and learn how it works.

## Documentation
- `gametime.set(key: String, value: String | Object)`: Sets a global setting.
  - `key`: What you want to set. Can be "channel", "player", or "username".
  - `value`: any
- `gametime.on(eventName: String, handler: Function(args))`: Defines an event for all players.
  - `eventName`: The custom name of the event you want to define.
  - `handler`: The function that runs when this event is called.
- `gametime.run(eventName: String, args: Array[])`: Runs a defined event on all connected players' pages.
  - `eventName`: The event name that was defined using `gametime.on(...)`.
  - `args`: An array of arguments that will be passed to the function.
- `gametime.connect()`: Connects to the socket server set with `gametime.serverURL`.
- `gametime.disconnect()`: Disconnects from the currently connected socket server.
- `gametime.onconnect()`: A custom function to run when Gametime.js-4.0 connects. Default is `null`.
- `gametime.onupdate(player)`: A custom function to run when any player's data changes. Returns the player whose data changed. Default is `null`.
- `gametime.serverURL`: The URL to the socket server that Gametime.js-4.0 will connect to. Default is `"wss://gametime-js-4.serveousercontent.com"`.
- `gametime.players`: An object containing connected players, with each key being the player's UUID.
  - Entry: `{ username: String, connected: Boolean, position: Number, data: Object{}, uuid: String }`
- `gametime.player`: Object containing your player's data. Shortcut to `gametime.players[gametime.player.uuid]`.
- `gametime.username`: String representing your player's username. Shortcut to `gametime.player.username`.
- `gametime.connected`: Boolean which tells if you are connected to the socket server. Shortcut to `gametime.player.connected`.
- `gametime.channel`: String which tells what channel you're currently connected to. Defined with `gametime.set("channel", channel

## Support
For feature requests and bug reports, open an [Issue](https://github.com/Parking-Master/Gametime.js-4.0/issues).

You can also contact us at [parkingmaster@email.com](mailto:parkingmaster@email.com).

# License
Gametime.js-4.0 is licensed under the MIT License.

###### Copyright (c) 2026 Gametime.js-4.0 / Parking-Master.
