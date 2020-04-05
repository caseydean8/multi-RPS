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

let persist = sessionStorage.getItem(player);

const pageRefresh = () => {
  console.log("page refresh");
  $(".parent, #header").attr({ "data-player": persist });
  // commentDisplay();
  db.ref().on("value", snapshot => {
    let start = snapshot.val().state;
    switch (start) {
      case 1:
        playerDisplay(start);
        break;
      case 2:
        playerDisplay(start);
        commentDisplay();
        break;
      case 3:
        playerDisplay(2);
        commentDisplay();
        break;
      case 4:
        winDisplay();
        commentDisplay();
        break;
      default:
        defaultState;
    }
  });
};

window.onload = pageRefresh;

const defaultState = () => {
  console.log("defaultState triggered, rps object", rpsObj, persist);
  $("#header").text("rock paper scissors");
  $("#player").text("Welcome! Add user name?");
  $("#no-button")
    .css({ display: "block" })
    .text("no thanks");
  $("#add-username").attr({ placeholder: "add username" });
  $("#username-button")
    .css({ display: "block" })
    .text("submit user name");
};

// >>>>>>>>>>>>>> No Thanks Button Step 1>>>>>>>>>>>>>>>>
$("#no-button").on("click", function(event) {
  event.preventDefault();
  rpsObj.state === 0 ? playerCreate("player 1") : playerCreate("player 2");
});

db.ref().on("value", snapshot => {
  rpsObj = snapshot.val();
  // console.log("rps object at state", rpsObj.state, rpsObj);
  if (rpsObj.state === 0) defaultState();
});

// Send Player object to database Step 1.1
const playerCreate = username => {
  // let username = "";
  const userAddedName = $("#add-username")
    .val()
    .trim();
  userAddedName
    ? (username = userAddedName)
    : $("#add-username").attr({
        placeholder: "PLEASE ENTER A USERNAME OR YOU ARE IN TROUBLE MISTER"
      });
  // sessionStorage.clear();
  if (rpsObj.state === 0) {
    sessionStorage.setItem(player, "player1");

    db.ref("player1")
      .update({ userName: username })
      .then(() => playerDisplay(1));
    db.ref().update({ state: 1 });
  } else if (rpsObj.state === 1) {
    db.ref("player1").update({ opponent: username });
    db.ref("player2")
      .update({
        userName: username,
        opponent: rpsObj.player1.userName
      })
      .then(() => playerDisplay(2));
    db.ref().update({ state: 2 });
    sessionStorage.setItem(player, "player2");
  }
  $(".parent, #header").attr({ "data-player": persist });
};

// $$$$$$$$$$$$$ enter user name $$$$$$$$$$$$$
$(document).on("click", "#username-button", function(event) {
  event.preventDefault();
  playerCreate();
});

const checkSubmit = e => {
  if (e && e.keyCode == 13) {
    rpsObj.state < 2 ? playerCreate() : commentSave();
  }
};

const playerDisplay = state => {
  persist = sessionStorage.getItem(player);
  const thisUser = rpsObj[persist];
  console.log("playerDisplay", persist, thisUser);
  if (thisUser) {
    $("#player").text(`${thisUser.userName}`);
    $("#add-username").css({ display: "none" });
    if (state > 1) {
      $("#opponent").text(`vs ${thisUser.opponent}`);
      $(".rps-buttons, #add-username").css({ display: "block" });
      $("#header").text("choose carefully");
    } else {
      $("#opponent").text(`awaiting 2nd player`);
    }
    buttonHide();
  } else {
    defaultState();
  }
};

const buttonHide = () => {
  $("#no-button").css({ display: "none" });
  $("#username-button").text("submit comment");
  $("#add-username")
    .val("")
    .attr({ placeholder: "add comment" });
};

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
  $("#header").text(`you chose ${guess}`);
  $(".rps-buttons").css({ display: "none" });
});

const guessSubmit = (id, guess, display) => {
  console.log("=== guess submit ===");
  db.ref(persist)
    .update({ guess: guess })
    .then(() => {
      console.log("guess updated at", persist);
    })
    .catch(err => console.log(err));

  if (rpsObj.state === 2) {
    db.ref().update({ state: 3 });
  } else if (rpsObj.state === 3) {
    db.ref()
      .update({ state: 4 })
      .then(rpsLogic());
  }
};

// Comment Button
$(document).on("click", "#comment", function(event) {
  event.preventDefault();
  if (rpsObj.state >= 2) {
    commentSave(); // TODO hide input at state 1
  }
});

const commentSave = () => {
  const commenter = rpsObj[persist].userName;
  const comment = $("#add-username")
    .val()
    .trim();
  db.ref("comment")
    .push({ comment: `${commenter}: ${comment}` })
    .then(() => location.reload())
    .catch(err => console.log(err));
  // db.ref().update({state: 2.5});
};

// Comment display

const commentDisplay = () => {
  $("#comment-out").empty();
  const query = firebase
    .database()
    .ref("comment")
    .orderByKey();
  query.once("value").then(snapshot => {
    snapshot.forEach(childSnapshot => {
      // key is the comment identifier
      // const key = childSnapshot.key;
      // childData will be the actual contents of the child
      const childData = childSnapshot.val().comment;
      console.log(childData);
      const commentTag = $("<p>");
      $(commentTag).text(`${childData}`);
      $("#comment-out").append(commentTag);
    });
  });
};

// ############# CLEAR DATABASE #############

$(document).on("click", "#clear", function(event) {
  event.preventDefault();
  sessionStorage.clear();
  const dbDefault = {
    userName: 0,
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
    .update({ state: 0, comment: "" })
    .then(function() {
      location.reload();
    })
    .catch(function(error) {
      console.log("Remove failed: " + error.message);
    });
  // pageRefresh();
  // defaultState();
  location.reload();
});

const rpsLogic = () => {
  console.log("inside game logic ", rpsObj);
  const guess1 = rpsObj.player1.guess;
  const guess2 = rpsObj.player2.guess;
  console.log(guess1, guess2);
  let plr1wins = rpsObj.player1.wins;
  let plr1losses = rpsObj.player1.losses;
  let plr2wins = rpsObj.player2.wins;
  let plr2losses = rpsObj.player2.losses;
  const header1 = $(".parent").data("player");
  console.log(header1);
  let header2 = "";
  header1 === "player1" ? (header2 = "player2") : (header2 = "player1");
  let outcome;
  let oppoOutcome;
  if (guess1 === guess2) {
    outcome = "tie";
    oppoOutcome = "tie";
  } else if ((guess1 - guess2 + 3) % 3 === 1) {
    outcome = "win";
    oppoOutcome = "lose";
    plr1wins++;
    plr2losses++;
  } else {
    outcome = "lose";
    oppoOutcome = "win";
    plr1losses++;
    plr2wins++;
  }

  db.ref("player1")
    .update({
      winHold: false,
      losses: plr1losses,
      wins: plr1wins,
      outcome: outcome
    })
    .then(() => console.log("player 1 win/loss updated"))
    .catch(err => console.log(err));
  db.ref("player2")
    .update({
      winHold: false,
      losses: plr2losses,
      wins: plr2wins,
      outcome: oppoOutcome
    })
    .then(() => console.log("player 2 win/loss updated"))
    .catch(err => console.log(err));
  db.ref().update({ state: 4 });
  winDisplay();
  location.reload(); // needs better solution
};

// Win Loss Comment Display
const winDisplay = () => {
  $(".rps-buttons").css({ display: "none" });
  let oppoId = "";
  persist === "player1" ? (oppoId = "player2") : (oppoId = "player1");
  $("#header").text(`You ${rpsObj[persist].outcome}`);
  $("#player").text(`${rpsObj[persist].userName} wins: ${rpsObj[persist].wins}
  losses: ${rpsObj[persist].losses}`);
  $("#opponent").text(`${rpsObj[oppoId].userName} wins: ${rpsObj[oppoId].wins}
  losses: ${rpsObj[oppoId].losses}`);

  buttonHide();
  // db.ref().update({state: 4})
};

// ************* CHILD CHANGED *************
db.ref("comment").on("child_changed", snapshot => {
  let otherPage = snapshot.val();
  console.log("---child changed---", otherPage);
  // pageRefresh; this fucking caused a lot of problems i think
  location.reload();
  switch (otherPage) {
    // case 1:
    //   playerDisplay(1);
    //   break;
    case 2:
      playerDisplay(2);
      break;
    case 5:
      console.log("child changed case 5");
      winDisplay();
      break;
    // case 5:
    // playerDisplay(2);
  }
});

// RESET BUTTON
$(document).on("click", "#reset", function() {
  console.log("play again");
  db.ref().update({ state: 2 });
  playerDisplay(2);
});

// XXXXXXXXXX NOT USED XXXXXXXXXXXXXXXXXXXXXX
// const guessesIn = () => {
//   const p1 = rpsObj[playerArr[1]];
//   const p2 = rpsObj[playerArr[0]];
//   if (playerArr.length === 2) {
//     if (p1.hasGuessed && p2.hasGuessed) {
//       rpsLogic(p1, p2);
//     }
//   }
// };

// 33333333333333 Step 3 Display 3333333333333
// const userNameAdd = (player, dataId) => {
//   $("#no-button").remove();
//   if (playerArr.length < 2)
//     $(`#opponent[data-play=${dataId}]`).text(`awaiting second player`);
//   if (playerArr.length === 2) {
//     playerArr.forEach(id => {
//       if (id != dataId) {
//         console.log(id);
//         $(`#opponent[data-play=${dataId}]`).text(`vs ${rpsObj[id].userName}`);
//       }
//     });
//   }
//   playerDisplay(player, dataId);
//   $(".rps-buttons").css({ display: "block" });
// };

// %%%%%%%%%%%%% SEND FIREBASE %%%%%%%%%%%%%
// const sendFirebase = (userName, id) => {
//   db.ref(id)
//     .update({ userName: userName })
//     .then(function() {
//       console.log(`user name added`);
//     })
//     .catch(function(err) {
//       console.log(err);
//     });
// };

// Display after Start Button, UX Step 2
// const pageDisplay = id => {
//   $("#player-1, #opponent").attr({ "data-play": id });

//   $("#add-username").attr({ "data-input": id });
//   $(".rps-buttons").attr({ "data-player": id });
//   $(".win-loss-column").attr({ "data-win": id });
// };
