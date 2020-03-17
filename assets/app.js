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

var rpsObj = {};

db.ref().on("value", snapshot => {
  rpsObj = snapshot.val();
  console.log(rpsObj);
});

// let appPlayers = 0;
$("#start").on("click", function(event) {
  event.preventDefault();
  $(this).remove();
  // db.ref().update({ players: 0 });
  console.log(rpsObj.players);
  if (rpsObj.players < 2) {
    let players = rpsObj.players;
    players++;
    $("#player-1").text("Welcome! add a username?");
    $("#comment-in").attr({ placeholder: "enter username" });
    const noBtn = $("<button>")
      .attr({ id: "no-button" })
      .text("no thanks");
    const userNameBtn = $("<button>")
      .attr({ id: "username-button" })
      .text("submit");
    $("#player-2").append(noBtn);
    $("#submit-button").append(userNameBtn);
    db.ref().update({ players: players });
  } // $("#submit-button").text("add username");
});

// XXXXXXXXXXXXX No thanks button XXXXXXXXXXXXX
$(document).on("click", "#no-button", function(event) {
  // appPlayers++;
  event.preventDefault();
  const player = `player ${rpsObj.players}`;
  sendFirebase(player);
  playerDisplay(player);
});

$(document).on("click", "#username-button", function(event) {
  event.preventDefault();
  const user = $("#comment-in")
    .val()
    .trim();
  console.log(user);
  sendFirebase(user);
  playerDisplay(user);
  $("#comment-in").val("");
});

const sendFirebase = username => {
  const player = {
    username: username,
    comment: "",
    guess: "",
    // players: appPlayers,
    losses: 0,
    wins: 0
  };
  db.ref()
    .push(player)
    .catch(err => console.log(err));
};

db.ref().on("child_added", function(snapshot) {
  const dbData = snapshot.val();
  dbData.id = snapshot.key;
  // taskButtons(dbData);
  game.playerArr.push(dbData);
  console.log(game.playerArr);
  // playerDisplay(dbData);
});

const game = {
  playerArr: [],
  playerObj: {}
};

const playerDisplay = data => {
  $("#player-1").text(`welcome ${data}!`);
};

$(document).on("click", "#scissors", function(event) {
  event.preventDefault();
  db.ref()
    .remove()
    .then(function() {
      console.log("Remove succeeded.");
    })
    .catch(function(error) {
      console.log("Remove failed: " + error.message);
    });
  db.ref().update({ players: 0 });
  location.reload();
});


const rpsLogic = () => {
  if (userGuess === "r" || userGuess === "p" || userGuess === "s") {
    alert("User guess: " + userGuess);
    alert("Computer guess: " + computerGuess);

    console.log(userChoices.indexOf(userGuess));
    console.log(computerChoices.indexOf(computerGuess));

    if (userGuess === computerGuess) {
      alert("You tied");
    } else if (
      (userChoices.indexOf(userGuess) -
        computerChoices.indexOf(computerGuess) +
        3) %
        3 ==
      1
    ) {
      alert("you win");
    } else {
      alert("you lose");
    }
  }
};
