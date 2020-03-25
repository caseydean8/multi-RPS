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
firebase.analytics();

const db = firebase.database();

let rpsObj = {};

db.ref().on("value", snapshot => {
  rpsObj = snapshot.val();
  console.log(rpsObj);
});

// >>>>>>>>>>>>>> START BUTTON >>>>>>>>>>>>>>>>
$("#start").on("click", function(event) {
  event.preventDefault();
  console.log(`start clicked`);
  $(this).remove();
  playerCreate();
});

const playerCreate = () => {
  if (rpsObj.players < 2) {
    let players = rpsObj.players;
    players++;
    $("#player-1").text("Welcome! add a username?");
    $("#comment-in").attr({ placeholder: "enter username" });
    const noBtn = $("<button>")
      .attr({ id: "no-button" })
      .text("no thanks");
    const userNameBtn = $("<button>")
      .attr({ id: "username-button", type: "submit" })
      .text("submit");
    $("#player-2").append(noBtn);
    $("#submit-button").append(userNameBtn);
    db.ref().update({ players: players });
  }
};

// XXXXXXXXXXXXX No thanks button XXXXXXXXXXXXX
$(document).on("click", "#no-button", function(event) {
  event.preventDefault();
  const player = `player ${rpsObj.players}`;
  let dataUser;
  rpsObj.players === 1 ? (dataUser = "player1") : (dataUser = "player2");
  sendFirebase(player, dataUser);
  playerDisplay(player);
  rpsButtons(dataUser);
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

const userNameAdd = () => {
  const user = $("#comment-in")
    .val()
    .trim();
  if (user) {
    sendFirebase(user, rpsObj.players);
    playerDisplay(user);
    rpsObj.players === 1 ? rpsButtons("player1") : rpsButtons("player2");
    $("#comment-in").val("");
  } else {
    $("#comment-in").attr({
      placeholder: "PLEASE ENTER A USERNAME OR YOU ARE IN TROUBLE MISTER"
    });
  }
};

// !!!!!!!!!!!!! Dynamic r p s buttons !!!!!!!!!!!!!
const rpsButtons = dataPlayer => {
  $(".rps-buttons").css({ display: "block" });
  $(".rps-buttons").attr({ "data-player": dataPlayer });
};

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

const game = {
  playerArr: [],
  playerObj: {},
  guess: ""
};

const playerDisplay = data => {
  $("#player-1").text(`Welcome ${data}! Make your selection!`);
  $("#player-2").remove();
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
  // let dbId = "";
  // id === 1 ? (dbId = "player1") : (dbId = "player2");
  guessSubmit(id, dbGuess);
  let text = $(this).text();
  $("#player-1").text(`You chose ${text}`);
  // const player1Guess = game.playerArr[1].guess;
  // if ((game.playerArr[0] = 2)) {
  //   let player2Guess = game.playerArr[2].guess;
  //   rpsLogic(player1Guess, player2Guess);
  // }
  // if (player1Guess && player2Guess) rpsLogic(player1Guess, player2Guess);
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
  const player1 = {
    comment: "",
    guess: null,
    losses: 0,
    userName: "",
    wins: 0
  };
  const player2 = {
    comment: "",
    guess: null,
    losses: 0,
    userName: "",
    wins: 0
  };

  db.ref()
    .update({ players: 0, player1, player2 })
    .then(function() {
      location.reload();
    })
    .then(function() {
      console.log("clear succeeded");
    })
    .catch(function(error) {
      console.log("Remove failed: " + error.message);
    });
});

const rpsLogic = (guess1, guess2) => {
  console.log(`guess 1 = ${guess1}`);
  console.log(`guess 2 = ${guess2}`);
  if (guess1 === guess2) {
    alert("You tied");
  } else if ((guess1 - guess2 + 3) % 3 == 1) {
    alert("you win");
  } else {
    alert("you lose");
  }
};
