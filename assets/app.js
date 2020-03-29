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

const gameObArr = [];

// >>>>>>>>>>>>>> Start Button Step 1>>>>>>>>>>>>>>>>
$("#start").on("click", function(event) {
  event.preventDefault();
  playerCreate();
});

db.ref().on("value", snapshot => {
  rpsObj = snapshot.val();
  // console.log(rpsObj);
});

const pageRefresh = () => {
  console.log("page refresh");
  console.log(rpsObj.players);
  if (rpsObj.players > 0) pageDisplay();
};
const playerArr = [];
let p1Id = playerArr[1];
let p2Id = playerArr[0];

// Send Player object to database Step 1.1
const playerCreate = () => {
  const dbPlayer = {
    comment: "",
    losses: 0,
    hasGuessed: false,
    display1: "",
    display2: "",
    wins: 0,
    winHold: true
  };
  db.ref().push(dbPlayer);
  let dbRef = "";
  db.ref().on("child_added", snapshot => {
    dbRef = snapshot.key;
    playerArr.unshift(dbRef);
    gameObArr.unshift(snapshot.val());
    console.log(gameObArr);
  });
  console.log(playerArr);
  db.ref(dbRef).update({ player: playerArr.length });
  pageDisplay(dbRef);
};

// Display after Start Button, UX Step 2
const pageDisplay = id => {
  $("#comment-in").css({ display: "block" });
  $("#start").remove();
  $("#player-1").text("Welcome! add a username?");
  // add data-play to display for different players
  // const playerId = playerArr[rpsObj.players - 1];
  $("#player-1, #player-2").attr({ "data-play": id });
  $("#comment-in").attr({ placeholder: "enter username" });
  const noBtn = $("<button>")
    .attr({ id: "no-button", "data-no": id })
    .text("no thanks");
  const userNameBtn = $("<button>")
    .attr({ id: "username-button", type: "submit", "data-username": id })
    .text("submit");
  $("#comment-in").attr({ "data-input": id });
  $(".rps-buttons").attr({ "data-player": id });
  $("#player-2").append(noBtn);
  $("#submit-button").append(userNameBtn);
};

// XXXXXXXXXXXXX No thanks button XXXXXXXXXXXXX
$(document).on("click", "#no-button", function(event) {
  event.preventDefault();
  const noUserName = $(this).data("no");
  const player = `player ${rpsObj[noUserName].player}`;
  userNameAdd(player, noUserName);
  sendFirebase(player, noUserName);
});

// $$$$$$$$$$$$$ enter user name $$$$$$$$$$$$$
$(document).on("click", "#username-button", function(event) {
  event.preventDefault();
  const userNameParent = $(this).data("username");
  const userAddedName = $("#comment-in")
    .val()
    .trim();
  if (userAddedName) {
    userNameAdd(userAddedName, userNameParent);
    sendFirebase(userAddedName, userNameParent);
  } else
    $("#comment-in").attr({
      placeholder: "PLEASE ENTER A USERNAME OR YOU ARE IN TROUBLE MISTER"
    });
});

const checkSubmit = e => {
  if (e && e.keyCode == 13) {
    const inputName = $("#comment-in")
      .val()
      .trim();
    const inputId = $("#comment-in").data("input");
    userNameAdd(inputName, inputId);
    sendFirebase(inputName, inputId);
  }
};

// 33333333333333 Step 3 Display 3333333333333
const userNameAdd = (player, dataId) => {
  $("#no-button").remove();
  if (playerArr.length < 2)
    $(`#player-2[data-play=${dataId}]`).text(`awaiting second player`);
  if (playerArr.length === 2) {
    playerArr.forEach(id => {
      if (id != dataId) {
        $(`#player-2[data-play=${dataId}]`).text(`vs ${rpsObj[id].userName}`);
      }
    });
  }
  playerDisplay(player, dataId);
  $(".rps-buttons").css({ display: "block" });
};

// %%%%%%%%%%%%% SEND FIREBASE %%%%%%%%%%%%%
const sendFirebase = (userName, id) => {
  db.ref(id)
    .update({ userName: userName })
    .then(function() {
      console.log(`user name added`);
    })
    .catch(function(err) {
      console.log(err);
    });
};

const playerDisplay = (player, id) => {
  const text = `Welcome ${player}! Make your selection!`;
  db.ref(id).update({ display1: text });
  $(`#player-1[data-play=${id}]`).text(text);

  $("#comment-in").remove();
  $("#submit-button").remove();
};

const playerAdded = id => {
  $(`player-1[data-play=${id}]`).text(rpsObj[id].display1);
};

// $$$$$$$$$$$$$ ROCK PAPER SCISSORS Buttons $$$$$$$$$$$$$

$(document).on("click", ".rps-buttons", function(event) {
  event.preventDefault();
  const guess = $(this).attr("id");
  let dbGuess = 0;
  if (guess === "paper") dbGuess = 1;
  if (guess === "scissors") dbGuess = 2;
  const id = $(this).data("player");
  guessSubmit(id, dbGuess);
  $("#player-1").text(`You chose ${guess}`);
});

const guessSubmit = (id, guess) => {
  db.ref(id)
    .update({ guess: guess, hasGuessed: true })
    .then(() => {
      console.log("guess updated");
    })
    .then(() => guessesIn())
    .catch(err => console.log(err));
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
  // db.ref().update({ players: 0 });
});

const rpsLogic = (player1, player2) => {
  const guess1 = player1.guess;
  const guess2 = player2.guess;
  console.log(guess1, guess2);
  let plr1wins = rpsObj[playerArr[1]].wins;
  console.log(playerArr[1]);
  console.log(plr1wins);
  let plr1losses = rpsObj[playerArr[1]].losses;
  let plr2wins = rpsObj[playerArr[0]].wins;
  let plr2losses = rpsObj[playerArr[0]].losses;
  if (guess1 === guess2) {
    $(`#player-1[data-play=${playerArr[1]}]`).text("It's a tie");
    $(`#player-1[data-play=${playerArr[0]}]`).text("It's a tie");
    // tie();
  } else if ((guess1 - guess2 + 3) % 3 === 1) {
    $(`#player-1[data-play=${playerArr[1]}]`).text(`you win!`);
    $(`#player-1[data-play=${playerArr[0]}]`).text(`you lose!`);

    plr1wins++;
    plr2losses++;
    
  } else {
    $(`#player-1[data-play=${playerArr[1]}]`).text(`you lose!`);
    $(`#player-1[data-play=${playerArr[0]}]`).text(`you win!`);
    // db.ref("").update({})
    // db.ref("").update({})
  }
  db.ref(playerArr[1])
      .update({ winHold: false, wins: plr1wins })
      .then(() => console.log("player 1 updated"))
      .catch(err => console.log(err));
    db.ref(playerArr[0])
      .update({ winHold: false, losses: plr2losses })
      .then(() => console.log("player 2 updated"))
      .catch(err => console.log(err));
};

db.ref().on("child_changed", snapshot => {
  console.log("child changed below");
  let otherPage = snapshot.val();
  console.log(otherPage);
  if (otherPage.player === 2 && otherPage.userName && !otherPage.hasGuessed) {
    playerArr.forEach(item => {
      userNameAdd(rpsObj[item].userName, item);
    });
  }
  if (otherPage.winHold) guessesIn();
});

const guessesIn = () => {
  const p1 = rpsObj[playerArr[1]];
  const p2 = rpsObj[playerArr[0]];
  if (playerArr.length === 2) {
    if (p1.hasGuessed && p2.hasGuessed) {
      rpsLogic(p1, p2);
    }
  }
};
