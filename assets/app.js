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
console.log("persist in main file =", persist);
let clear;
let clearConsole;
const dbDefault = {
  userName: "",
  opponent: "",
  guess: null,
  guessName: null,
  wins: 0,
  losses: 0
};

const assignStorage = () => {
  if (!persist) {
    db.ref("player")
      .push(dbDefault)
      .once("value")
      .then(snapshot => {
        const entry = snapshot.key;
        persist = entry;
        sessionStorage.setItem(player, entry);
      });
  }
};

const pageRefresh = () => {
  // clearInterval(clear);
  // clearInterval(clearConsole);
  // autoClear();
  db.ref().once("value", snapshot => {
    let start = snapshot.val().state;
    switch (start) {
      case 1:
        playerDisplay(start);
        break;
      case 2:
        setTimeout(playerDisplay(start), 100);
        commentDisplay();
        break;
      case 3:
        playerDisplay(start); // 125
        commentDisplay();
        break;
      case 4:
        setTimeout(winDisplay, 100); // 342
        commentDisplay();
        break;
      default:
        defaultState();
    }
  });
};

window.onload = pageRefresh;

const defaultState = () => {
  $("#header").text("rock paper scissors");
  $("#player").html("Welcome!<br>Add user name?");
  $("#opponent").empty();
  $("#no-button")
    .css({ display: "block" })
    .text("no thanks");
  $("#text-input")
    .attr({ placeholder: "add username" })
    .css({ display: "block" });
  $("#username-button")
    .css({ display: "block" })
    .text("submit user name");
};

// Set rps.Object
let state;
db.ref().on("value", snapshot => {
  rpsObj = snapshot.val();
  state = rpsObj.state;
  console.log("rps object", rpsObj);
});

// Enter user name or comment button
$(document).on("click", "#username-button", function(event) {
  event.preventDefault();
  assignStorage();
  state <= 1 ? setTimeout(playerCreate, 100) : commentSave;
});

// Send Player object to database Step 1.1
const playerCreate = () => {
  const userAddedName = $("#text-input")
    .val()
    .trim();
  let username;
  if (!userAddedName && state === 0) {
    username = "player 1";
  } else if (!userAddedName && state === 1) {
    // change to ternary
    username = "player 2";
  } else {
    username = userAddedName;
  }

  if (state === 0) {
    db.ref(`player/${persist}`).update({ userName: username });
    // .then(() => playerDisplay(1));
    db.ref().update({ state: 1 });
  } else if (state === 1) {
    db.ref(`player/${persist}`).update({ userName: username });
    db.ref().update({ state: 2 });
  }

  db.ref("player")
    .orderByKey()
    .once("value")
    .then(snapshot => {
      snapshot.forEach(snapChild => {
        let key = snapChild.key;
        if (key != persist) {
          otherUser = rpsObj.player[key];
          db.ref(`player/${key}`).update({
            opponent: username,
            oppoKey: persist
          });
          db.ref(`player/${persist}`).update({
            opponent: otherUser.userName,
            oppoKey: key
          });
        }
      });
    });
};

const checkSubmit = e => {
  if (e && e.keyCode == 13) {
    assignStorage();
    state < 2 ? setTimeout(playerCreate, 100) : commentSave();
  }
};

let thisUser;
const playerDisplay = state => {
  // console.log("@ playerDisplay, state=", rpsObj.state, "persist=", persist);
  thisUser = rpsObj.player[persist];
  if (thisUser) {
    $("#player").text(`${thisUser.userName}`);
    $("#reset").css({ display: "none" });
    if (state === 2) {
      $("#text-input").css({ display: "none" });
      $("#vs").text("vs");
      $("#opponent").text(thisUser.opponent);
      $("#header").text("Rock, Paper, or Scissors?");
      $(".rps-buttons, #text-input, #username-button").css({
        display: "block"
      });
    } else if (state === 1 && thisUser.userName) {
      $("#opponent").text(`awaiting 2nd player`);
      $("#text-input, #username-button").css({ display: "none" });
    } else if (state === 1 && !thisUser.opponent) {
      defaultState();
    } else if (state === 3) {
      $("#opponent").text(thisUser.opponent);
      if (thisUser.guessName) {
        $(".rps-buttons").css({ display: "none" });
        $("#header").text(`you chose ${thisUser.guessName}`);
      } else {
        $(".rps-buttons").css({ display: "block" });
        $("#header").text("Rock, Paper, or Scissors?");
      }
    }
    buttonHide();
  } else {
    defaultState();
  }
};

const buttonHide = () => {
  $("#no-button").css({ display: "none" });
  $("#username-button").text("submit comment");
  $("#text-input")
    .val("")
    .attr({ placeholder: "add comment" });
};

const commentSave = () => {
  const comment = $("#text-input")
    .val()
    .trim();
  console.log(comment, "at commentSave");
  comment
    ? db
        .ref("comment")
        .push({ comment: `${comment}`, commenter: persist })
        .then(() => location.reload())
        .catch(err => console.log(err))
    : $("#text-input").attr({ placeholder: "please type a comment you dope" });
};

// Comment display
const commentDisplay = () => {
  // console.log("@commentDisplay, state =", state, "persist =", persist);
  const query = db.ref("comment").orderByKey();

  query
    .once("value")
    .then(snapshot => {
      $("#comment-out").empty(); // must be on this line to work properly
      snapshot.forEach(childSnapshot => {
        // key is the comment identifier
        // const key = childSnapshot.key;
        // childData will be the actual contents of the child
        const commentTag = $("<div>").addClass("comment");
        const childData = childSnapshot.val().comment;
        const textAlign = childSnapshot.val().commenter;
        textAlign === persist
          ? $(commentTag).addClass("my-comment")
          : $(commentTag).addClass("oppo-comment");
        $(commentTag).text(`${childData}`);
        $("#comment-out").append(commentTag);
      });
    })
    .catch(err => console.log(err));
};

// Clear database button
$(document).on("click", "#clear", function(event) {
  event.preventDefault();
  clearDatabase();
  pageRefresh(); // probably redundant
});

// CLEAR DATABASE
const clearDatabase = () => {
  console.log("clear database happened");
  sessionStorage.clear();

  db.ref()
    .update({ state: 0, comment: "", player: "" })
    .then(function() {
      location.reload();
    })
    .catch(function(error) {
      console.log("Remove failed: " + error.message);
    });
  location.reload;
};

const autoClear = () => {
  clearConsole = setTimeout(logClear, 300000);
  clear = setTimeout(clearDatabase, 300000); // possibly change to 180000 (3 minutes)
  console.log(clear, clearConsole, "at autoClear");
};

const logClear = () => console.log("autoClear occured");

// Rock Paper Scissors Button
$(document).on("click", ".rps-buttons", function(event) {
  event.preventDefault();
  const guess = $(this).attr("id");
  let dbGuess = 0;
  if (guess === "paper") dbGuess = 1;
  if (guess === "scissors") dbGuess = 2;
  guessSubmit(dbGuess, guess);
  $("#header").text(`you chose ${guess}`);
  $(".rps-buttons").css({ display: "none" });
  $("#comment-out").empty();
});

let otherUser; // wrong place
const guessSubmit = (guessNumber, guessName) => {
  otherUser = rpsObj.player[thisUser.oppoKey];
  console.log(thisUser, "at guess submit, other user=", otherUser);
  db.ref(`player/${persist}`)
    .update({ guess: guessNumber, guessName: guessName })
    .then(() => {
      console.log("guess updated for", persist, "at guessSubmit");
      pageRefresh();
    })
    .catch(err => console.log(err));

  if (state === 2) {
    db.ref().update({ state: 3 });
  } else if (state === 3) {
    db.ref()
      .update({ state: 4 })
      .then(() => rpsLogic())
      .catch(err => console.log(err));
  }
};

// Main Game Logic
const rpsLogic = () => {
  console.log(
    "inside rpsLogic",
    "this user=",
    thisUser,
    "other user=",
    otherUser
  );
  const guess1 = thisUser.guess;
  const guess2 = otherUser.guess;
  let plr1wins = thisUser.wins;
  let plr1losses = thisUser.losses;
  let plr2wins = otherUser.wins;
  let plr2losses = otherUser.losses;
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

  db.ref(`player/${persist}`)
    .update({
      losses: plr1losses,
      wins: plr1wins,
      outcome: outcome
    })
    .then(() => console.log("player 1 win/loss updated"))
    .catch(err => console.log(err));
  db.ref(`player/${thisUser.oppoKey}`)
    .update({
      losses: plr2losses,
      wins: plr2wins,
      outcome: oppoOutcome
    })
    .then(() => console.log("player 2 win/loss updated"))
    .catch(err => console.log(err));
  db.ref().update({ state: 4 });
};

// Win Loss Comment Display
const winDisplay = () => {
  thisUser = rpsObj.player[persist]; // 370-372 redundant?
  let oppoKey = rpsObj.player[persist].oppoKey;
  otherUser = rpsObj.player[oppoKey];
  console.log("at winDisplay this user=", thisUser, "other user=", otherUser);
  $(".rps-buttons").css({ display: "none" });

  $("#header").text(`You ${thisUser.outcome}`);
  $("#player").html(
    `${thisUser.userName}<br>W ${thisUser.wins} L ${thisUser.losses}`
  );
  $("#opponent").html(
    `${otherUser.userName}<br>W ${otherUser.wins} L ${otherUser.losses}`
  );
  $("#reset").css({ display: "block" });
  buttonHide();
  // db.ref().update({state: 4})
};

// RESET BUTTON
$(document).on("click", "#reset", function() {
  $("#comment-out").empty();
  db.ref().update({ state: 2 });

  const reset = db.ref("player").orderByKey();

  reset.once("value").then(snapshot => {
    snapshot.forEach(childSnapshot => {
      // key is the comment identifier
      const key = childSnapshot.key;
      // childData will be the actual contents of the child
      const guessdata = childSnapshot.val();
      // console.log("key=", key, "guessdata=", guessdata);
      if (guessdata.guessName)
        db.ref(`player/${key}`).update({ guessName: null, guess: null });
    });
  });
});

db.ref().on("child_changed", snapshot => {
  // console.log("at child changed", snapshot.val());
  asyn = true; // trying to fix Synchronous XMLHttpRequest on the main thread error
  if (snapshot.val() === 0) {
    sessionStorage.clear();
    location.reload();
  }
  pageRefresh();
});
