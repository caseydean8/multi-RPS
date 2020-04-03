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
const persist = sessionStorage.getItem(player);
const pageRefresh = () => {
  console.log("page refresh");
  $(".parent, #header").attr({ "data-player": persist });
};

window.onload = pageRefresh;

// >>>>>>>>>>>>>> Start Button Step 1>>>>>>>>>>>>>>>>
$("#no-button").on("click", function(event) {
  event.preventDefault();
  rpsObj.state === 0 ? playerCreate("player 1") : playerCreate("player 2");
});

db.ref().on("value", snapshot => {
  rpsObj = snapshot.val();
  console.log(rpsObj);
  // if (rpsObj.state === 1) {
  //   playerDisplay(rpsObj.player1.userName, 1)
  // }
});

const playerArr = [];
// console.log(playerArr);
let p1Id = playerArr[1];
let p2Id = playerArr[0];

// Send Player object to database Step 1.1
const playerCreate = username => {
  // console.log(rpsObj.state);
  if (rpsObj.state === 0) {
    db.ref().update({ state: 1 });
    db.ref("player1")
      .update({ userName: username })
      // .then(() => {
      //   $(".parent").attr({ "data-player": "player1" });
      //   $("#header").attr({ "data-player": "player1" });
      // })
      .then(() => playerDisplay("player1", 1));
    sessionStorage.setItem(player, "player1");
  } else if (rpsObj.state === 1) {
    db.ref().update({ state: 2 });
    db.ref("player1").update({ opponent: username });
    db.ref("player2")
      .update({
        userName: username,
        opponent: rpsObj.player1.userName
      })
      // .then(() => {
      //   $(".parent").attr({ "data-player": "player2" });
      //   $("#header").attr({ "data-player": "player2" });
      // })
      .then(() => playerDisplay("player2", 2));
    sessionStorage.setItem(player, "player2");
  }
};

// Display after Start Button, UX Step 2
const pageDisplay = id => {
  $("#player-1, #opponent").attr({ "data-play": id });

  $("#add-username").attr({ "data-input": id });
  $(".rps-buttons").attr({ "data-player": id });
  $(".win-loss-column").attr({ "data-win": id });
};

// $$$$$$$$$$$$$ enter user name $$$$$$$$$$$$$
$(document).on("click", "#username-button", function(event) {
  event.preventDefault();
  const userAddedName = $("#add-username")
    .val()
    .trim();
  if (userAddedName) {
    playerCreate(userAddedName);
  } else
    $("#add-username").attr({
      placeholder: "PLEASE ENTER A USERNAME OR YOU ARE IN TROUBLE MISTER"
    });
});

const checkSubmit = e => {
  if (e && e.keyCode == 13) {
    const inputName = $("#add-username")
      .val()
      .trim();
    playerCreate(inputName);
  }
};

// 33333333333333 Step 3 Display 3333333333333
const userNameAdd = (player, dataId) => {
  $("#no-button").remove();
  if (playerArr.length < 2)
    $(`#opponent[data-play=${dataId}]`).text(`awaiting second player`);
  if (playerArr.length === 2) {
    playerArr.forEach(id => {
      if (id != dataId) {
        console.log(id);
        $(`#opponent[data-play=${dataId}]`).text(`vs ${rpsObj[id].userName}`);
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

const playerDisplay = (dataPlayer, state) => {
  const persist = sessionStorage.getItem(player);
  console.log(persist);
  console.log(dataPlayer);
  console.log("=== player display hit ===");
  console.log(rpsObj);
  $("#player").text(`${rpsObj[dataPlayer].userName}`);
  if (state > 1) {
    $("#opponent").text(`vs ${rpsObj[dataPlayer].opponent}`);
    $(".rps-buttons").css({ display: "block" });
  } else $("#opponent").text(`awaiting 2nd player`);

  $("#no-button").css({ display: "none" });
  $("#no-button, #username-button").css({ display: "none" });
  $("#add-username").attr({ placeholder: "add comment" });
};

// const playerAdded = id => {
//   $(`player-1[data-play=${id}]`).text(rpsObj[id].display1);
// };

// $$$$$$$$$$$$$ ROCK PAPER SCISSORS Buttons $$$$$$$$$$$$$

$(document).on("click", ".rps-buttons", function(event) {
  event.preventDefault();
  const guess = $(this).attr("id");
  let dbGuess = 0;
  if (guess === "paper") dbGuess = 1;
  if (guess === "scissors") dbGuess = 2;
  const id = $(this)
    .parent()
    .data("player");
  guessSubmit(id, dbGuess, guess);
});

const guessSubmit = (id, guess, display) => {
  console.log("=== guess submit ===");
  console.log(id);
  $("#header").text(`You chose ${display}`);
  db.ref(id)
    .update({ guess: guess, hasGuessed: true })
    .then(() => {
      console.log("guess updated");
    })
    .then(() => guessesIn())
    .catch(err => console.log(err));
  console.log("game object below---");
  console.log(rpsObj.state);
  if (rpsObj.state === 2) {
    db.ref().update({ state: 3 });
  } else if (rpsObj.state === 3) {
    db.ref()
      .update({ state: 4 })
      .then(rpsLogic());
  }
};

// ############# CLEAR DATABASE #############

$(document).on("click", "#clear", function(event) {
  event.preventDefault();
  const dbDefault = {
    userName: "",
    opponent: "",
    guess: null,
    hasGuessed: false,
    wins: 0,
    losses: 0
  };

  db.ref("player1")
    .update(dbDefault)
    .then(function() {
      location.reload();
    })
    .catch(function(error) {
      console.log("Remove failed: " + error.message);
    });

  db.ref("player2")
    .update(dbDefault)
    .then(function() {
      location.reload();
    })
    .catch(function(error) {
      console.log("Remove failed: " + error.message);
    });

  db.ref()
    .update({ state: 0 })
    .then(function() {
      location.reload();
    })
    .catch(function(error) {
      console.log("Remove failed: " + error.message);
    });

  location.reload();
});

const rpsLogic = () => {
  const guess1 = rpsObj.player1.guess;
  const guess2 = rpsObj.player2.guess;
  console.log(guess1, guess2);
  let plr1wins = rpsObj.player1.wins;
  let plr1losses = rpsObj.player1.losses;
  let plr2wins = rpsObj.player2.wins;
  let plr2losses = rpsObj.player2.losses;
  const header1 = $(".parent").data("player");
  let header2 = "";
  header1 === "player1" ? (header2 = "player2") : (header2 = "player1");
  $("#header").text("");
  if (guess1 === guess2) {
    $(`#header`).text("It's a tie");
  } else if ((guess1 - guess2 + 3) % 3 === 1) {
    $(`#header[data-player="player1"]`).text(`you win!`);
    $(`#header[data-player="player2"]`).text(`you lose!`);

    plr1wins++;
    plr2losses++;
  } else {
    $(`#header[data-player="player1"]`).text(`you lose!`);
    $(`#header[data-player="player2"]`).text(`you win!`);

    plr1losses++;
    plr2wins++;
  }

  db.ref("player1")
    .update({ winHold: false, losses: plr1losses, wins: plr1wins })
    .then(() => console.log("player 1 win/loss updated"))
    .catch(err => console.log(err));
  db.ref("player2")
    .update({ winHold: false, losses: plr2losses, wins: plr2wins })
    .then(() => console.log("player 2 win/loss updated"))
    .catch(err => console.log(err));

  winDisplay();
};

// Win Loss Comment Display
const winDisplay = () => {
  $(".rps-buttons").css({ display: "none" });
  // $(".win-loss-column").css({ display: "block" });
  const pageId = $(".parent").data("player");
  let oppoId = "";
  pageId === "player1" ? (oppoId = "player2") : (oppoId = "player1");
  $("#player").text(`${rpsObj[pageId].userName} wins: ${rpsObj[pageId].wins}
  losses: ${rpsObj[pageId].losses}`);
  $("#opponent").text(`${rpsObj[oppoId].userName} wins: ${rpsObj[oppoId].wins}
  losses: ${rpsObj[oppoId].losses}`);
  // $("#comment-in").css({ display: "block" });
  // $("#comment-in").attr({ placeholder: "add comment" });
};

// ************* CHILD CHANGED *************
db.ref().on("child_changed", snapshot => {
  let otherPage = snapshot.val();
  console.log("---child changed---");
  console.log(otherPage);
  if (rpsObj.state === 2) {
    console.log("child changed state === 2");
    // location.reload();
    playerDisplay("player1", 2);
    // playerCreate(rpsObj.player2.userName);
  } else if (otherPage === 4) rpsLogic();
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
