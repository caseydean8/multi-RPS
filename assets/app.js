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
  console.log(rpsObj);
});

const pageRefresh = () => {
  console.log("page refresh");
  console.log(rpsObj.players);
  if (rpsObj.players > 0) pageDisplay();
};
const playerArr = [];

// Send Player object to database Step 1.1
const playerCreate = () => {
  // let players = gameObArr.length;
  // console.log(players);

  const dbPlayer = {
    comment: "",
    losses: 0,
    // player: players,
    display1: "",
    display2: "",
    wins: 0
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
  // const playerObjId = playerArr[0];
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
  $("#player-2").append(noBtn);
  $("#submit-button").append(userNameBtn);
};

// XXXXXXXXXXXXX No thanks button XXXXXXXXXXXXX
$(document).on("click", "#no-button", function(event) {
  event.preventDefault();
  const noUserName = $(this).data("no");
  const player = `player ${rpsObj[noUserName].player}`;
  userNameAdd(player, noUserName);
});

// $$$$$$$$$$$$$ enter user name $$$$$$$$$$$$$
$(document).on("click", "#username-button", function(event) {
  event.preventDefault();
  const userNameParent = $(this).data("username");
  const userAddedName = $("#comment-in")
    .val()
    .trim();
  userAddedName
    ? userNameAdd(userAddedName, userNameParent)
    : $("#comment-in").attr({
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
  sendFirebase(player, dataId);
  rpsButtons(dataId);
};

// !!!!!!!!!!!!! Dynamic r p s buttons !!!!!!!!!!!!!
const rpsButtons = dataPlayer => {
  $(".rps-buttons").css({ display: "block" });
  $(".rps-buttons").attr({ "data-player": dataPlayer });
};

// %%%%%%%%%%%%% SEND FIREBASE %%%%%%%%%%%%%
const sendFirebase = (userName, player) => {
  // console.log(player);
  db.ref(player)
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
  // $("#player-2").remove();
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
  if (guess === "p") dbGuess = 1;
  if (guess === "s") dbGuess = 2;
  const id = $(this).data("player");
  guessSubmit(id, dbGuess);
  let text = $(this).text();
  $("#player-1").text(`You chose ${text}`);
});

const guessSubmit = (id, guess) => {
  console.log(playerArr);
  db.ref(id)
    .update({ guess: guess })
    .then(() => {
      console.log("guess updated");
      console.log(rpsObj[id].guess);
      console.log(rpsObj[playerArr[1]].guess);
      console.log(rpsObj[playerArr[0]].guess);
    })
    .then(() => {
      if (rpsObj[playerArr[1]].guess > -1 && rpsObj[playerArr[0]].guess > -1) {
        rpsLogic(rpsObj[playerArr[0]], rpsObj[playerArr[1]]);
      }
    })
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
  console.log(player1);
  console.log(player2);
  const guess1 = player1.guess;
  const guess2 = player2.guess;
  // location.reload();
  console.log(guess1);
  console.log(guess2);
  if (guess1 === guess2) {
    $("#player-1").text("It's a tie");
    // tie();
  } else if ((guess1 - guess2 + 3) % 3 === 1) {
    $("#player-1").text(`${player1.userName} wins!`);
    // let plr1wins = rpsObj.player1.wins;
    // plr1wins++
    // db.ref("player1").update({wins: plr1wins});
    // db.ref("").update({})
  } else {
    $("#player-1").text(`${player2.userName} wins!`);
    // db.ref("").update({})
    // db.ref("").update({})
  }
};

db.ref().on("child_changed", snapshot => {
  console.log("child changed below");
  let otherPage = snapshot.val();
  console.log(otherPage);
  console.log(otherPage.player);

  if (otherPage.player === 2 && otherPage.userName) {
    console.log(`player arr ${playerArr}`);
    console.log(playerArr);
    playerArr.forEach(item => {
      console.log(rpsObj[item].userName, item);
      userNameAdd(rpsObj[item].userName, item);
    });
  }
});

const tie = () => {
  db.ref().on("child_changed", snapshot => {
    console.log(snapshot.val());
  });
};
