var firebaseConfig = {
  apiKey: "AIzaSyDolW-LxcVMBEdkPpXoIS_SjkZKtlufnxk",
  authDomain: "rps-multi-b502c.firebaseapp.com",
  databaseURL: "https://rps-multi-b502c.firebaseio.com",
  projectId: "rps-multi-b502c",
  storageBucket: "rps-multi-b502c.appspot.com",
  messagingSenderId: "779311652551",
  appId: "1:779311652551:web:6305d15c2ef76095c668e2",
  measurementId: "G-0YHG52E7T1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
// firebase.analytics();

// Enable logging
// firebase.database.enableLogging(true);

const db = firebase.database();

let rpsObj = {};

// Web socket
// socket = new WebSocket(url [, protocols ] )

db.ref().on("value", snapshot => {
  rpsObj = snapshot.val();
  console.log(rpsObj);
});

db.ref().on("child_changed", snapshot => {
  // console.log("child changed");
  let multi = snapshot.val();
  console.log(`child changed snapshot ${multi}`);
  console.log(`child changed snapshot user name ${multi.userName}`);
});

// >>>>>>>>>>>>>> START BUTTON >>>>>>>>>>>>>>>>
$("#start").on("click", function(event) {
  event.preventDefault();
  $("#comment-in").css({ display: "block" });
  $(this).remove();
  playerCreate();
});
let playerId;
let playerArr = [];
const playerCreate = () => {
  let players = rpsObj.players;
  players++;

  const dbPlayer = {
    comment: "",
    losses: 0,
    player: players,
    wins: 0
  };
  db.ref().push(dbPlayer);
  db.ref().update({ players: players });
  db.ref().on("child_added", snapshot => {
    playerArr.push(snapshot.key);
  });

  console.log(playerId);
  console.log(playerArr);

  $("#player-1").text("Welcome! add a username?");
  // add data-play to display for different players
  $("#player-1, #player-2").attr({ "data-play": playerArr[players - 1] });
  // console.log($(""))
  $("#comment-in").attr({ placeholder: "enter username" });
  const noBtn = $("<button>")
    .attr({ id: "no-button" })
    .text("no thanks");
  const userNameBtn = $("<button>")
    .attr({ id: "username-button", type: "submit" })
    .text("submit");
  $("#player-2").append(noBtn);
  $("#submit-button").append(userNameBtn);
  
};

// XXXXXXXXXXXXX No thanks button XXXXXXXXXXXXX
$(document).on("click", "#no-button", function(event) {
  event.preventDefault();
  // let player;
  // rpsObj.player1.username || rpsObj.player2.username
  //   ? (player = `player 2`)
  //   : (player = `player 1`);
  // userNameAdd(player);
});

// $$$$$$$$$$$$$ enter user name $$$$$$$$$$$$$
$(document).on("click", "#username-button", function(event) {
  event.preventDefault();
  userNameAdd();
});

const checkSubmit = e => {
  if (e && e.keyCode == 13) {
    userNameAdd();
  }
};

const userNameAdd = player => {
  const user = $("#comment-in")
    .val()
    .trim();

  let name;
  rpsObj.players === 1 ? (name = "player1") : (name = "player2");

  if (player) {
    playerDisplay(player);
    sendFirebase(player, name);
    rpsButtons(name);
    otherPlayer(player);
  }

  if (user) {
    playerDisplay(user);
    sendFirebase(user, name);
    rpsButtons(name);
    $("#comment-in").val("");
    otherPlayer(user);
  } else {
    $("#comment-in").attr({
      placeholder: "PLEASE ENTER A USERNAME OR YOU ARE IN TROUBLE MISTER"
    });
  }
};

// ^^^^^^^^^^^^^ Other Player ^^^^^^^^^^^^^
const otherPlayer = player => {
  if (!rpsObj.player1.userName || !rpsObj.player2.userName) {
    $("#player-2").text("awaiting 2nd player");
  }
  let otherGuy;
  if (rpsObj.player1.userName === player && rpsObj.player2.userName) {
    otherguy = rpsObj.player1.userName;
    $("#player-2").text(`${otherGuy} awaits!`);
  }
};

// !!!!!!!!!!!!! Dynamic r p s buttons !!!!!!!!!!!!!
const rpsButtons = dataPlayer => {
  $(".rps-buttons").css({ display: "block" });
  $(".rps-buttons").attr({ "data-player": dataPlayer });
};

// %%%%%%%%%%%%% SEND FIREBASE %%%%%%%%%%%%%
const sendFirebase = (userName, player) => {
  console.log(player);
  db.ref(player)
    .update({ userName: userName })
    .then(function() {
      console.log(`user name added`);
    })
    .catch(function(err) {
      console.log(err);
    });
};

// const game = {
//   playerArr: [],
//   playerObj: {},
//   guess: ""
// };

const playerDisplay = data => {
  $("#player-1").text(`Welcome ${data}! Make your selection!`);
  // $("#player-2").remove();
  $("#comment-in").remove();
  $("#submit-button").remove();
};

// $$$$$$$$$$$$$ ROCK PAPER SCISSORS Buttons $$$$$$$$$$$$$

$(document).on("click", ".rps-buttons", function(event) {
  event.preventDefault();
  const guess = $(this).attr("id");
  let dbGuess = 0;
  if (guess === "p") dbGuess = 1;
  if (guess === "s") dbGuess = 2;
  const id = $(this).data("player");
  guessSubmit(id, dbGuess);
  let text = $(this).text();
  $("#player-1").text(`You chose ${text}`);
});

const guessSubmit = (id, guess) => {
  db.ref(id)
    .update({ guess: guess })
    .then(() => {
      console.log("guess updated");
      if (
        typeof rpsObj.player1.guess === "number" &&
        typeof rpsObj.player2.guess === "number"
      )
        rpsLogic(rpsObj.player1.guess, rpsObj.player2.guess);
    })
    .catch(err => console.log(err));
  console.log(typeof rpsObj.player1.guess);
  console.log(typeof rpsObj.player2.guess);
};

// ############# CLEAR DATABASE #############

$(document).on("click", "#clear", function(event) {
  event.preventDefault();

  db.ref()
    .remove()
    .then(function() {
      location.reload();
    })
    .catch(function(error) {
      console.log("Remove failed: " + error.message);
    });
  db.ref().update({ players: 0 });
});

const rpsLogic = (guess1, guess2) => {
  console.log(`guess 1 = ${guess1}`);
  console.log(`guess 2 = ${guess2}`);
  // location.reload();
  console.log($("[data-play='1']").text());
  console.log($("[data-play='2']").text());
  if (guess1 === guess2) {
    $("#player-1").text("It's a tie");
  } else if ((guess1 - guess2 + 3) % 3 === 1) {
    $("#player-1").text(`${rpsObj.player1.userName} wins!`);
    // let plr1wins = rpsObj.player1.wins;
    // plr1wins++
    // db.ref("player1").update({wins: plr1wins});
    // db.ref("").update({})
  } else {
    $("#player-1").text(`${rpsObj.player2.userName} wins!`);
    // db.ref("").update({})
    // db.ref("").update({})
  }
};
