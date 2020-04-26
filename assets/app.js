const firebaseConfig = {
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

const db = firebase.database();

let rpsObj = {};
let state;
let persist = sessionStorage.getItem(player);
let thisUser;
let otherUser;
let timer;

// Set rps.Object
db.ref().on("value", snapshot => {
  rpsObj = snapshot.val();
  state = rpsObj.state;
  thisUser = rpsObj.player[persist];
  if (!state) defaultState();
  if (state >= 1) timer = rpsObj.timeCleared.timer;
  if (state > 2) otherUser = rpsObj.player[thisUser.oppoKey];
  if (state > 0 && state < 4) playerDisplay();
  if (state === 3) gifDisplay();
  if (state === 4) winDisplay();
});

// Enter user name or comment button
$(document).on("click", "#username-button", function(e) {
  e.preventDefault();
  gameSetup();
});

const checkSubmit = e => {
  if (e && e.keyCode == 13) gameSetup();
};

const gameSetup = () => {
  if (!persist) assignStorage();
  state < 2 ? setTimeout(playerCreate, 100) : commentSave();
  db.ref("timeCleared").update({ buttonClear: time });
  autoClear();
};

const dbDefault = {
  dbGif: "",
  userName: "",
  opponent: "",
  guess: null,
  guessName: null,
  wins: 0,
  losses: 0
};

// Set session storage
const assignStorage = () => {
  db.ref("player")
    .push(dbDefault)
    .once("value")
    .then(snapshot => {
      const entry = snapshot.key;
      persist = entry;
      sessionStorage.setItem(player, entry);
    });
};

let header = document.getElementById("header");
let header2 = document.getElementById("header-2");

const defaultState = () => {
  $("#opponent").empty();
  header.textContent = "rock paper scissors";
  fadeIn(header, 50);
  $("#player").html("Welcome!<br>Add user name?");
  $("#text-input")
    .attr({ placeholder: "add username" })
    .css({ display: "block" });
  $("#username-button")
    .css({ display: "block" })
    .text("submit");
};

// Send Player object to database
const playerCreate = () => {
  const userAddedName = $("#text-input")
    .val()
    .trim();

  let username;
  if (!userAddedName) {
    state ? (username = "player 2") : (username = "player 1");
  } else {
    username = userAddedName;
  }

  if (!state) {
    db.ref(`player/${persist}`).update({ userName: username });
    db.ref().update({ state: 1 });
  } else {
    db.ref(`player/${persist}`).update({ userName: username });
    db.ref().update({ state: 2 });
  }
  otherPlayerCreate(username);
};

const otherPlayerCreate = username => {
  db.ref("player")
    .orderByKey()
    .once("value")
    .then(snapshot => {
      snapshot.forEach(snapChild => {
        const key = snapChild.key;
        if (key != persist) {
          db.ref(`player/${key}`).update({
            opponent: username,
            oppoKey: persist
          });
          otherUser = rpsObj.player[key];
          db.ref(`player/${persist}`).update({
            opponent: otherUser.userName,
            oppoKey: key
          });
        }
      });
    })
    .catch(err => console.log(err));
};

const playAgainBtn = document.getElementById("reset");

const playerDisplay = () => {
  if (thisUser) {
    $("#player").text(`${thisUser.userName}`);

    if (state === 2) {
      $("#text-input").css({ display: "none" });
      $("#vs").text("vs");
      $("#opponent").text(thisUser.opponent);
      header.textContent = "";
      header2.textContent = "rock, paper, or scissors?";
      playAgainBtn.style.display = "none";
      playAgainBtn.style.opacity = 0;

      if (thisUser.outcome === undefined) {
        fadeOutAndCallback(header, 50, () => {
          header = header2;
          fadeIn(header, 50);
        });
      } else if (thisUser.wins > 0 || thisUser.losses > 0) {
        fadeIn(header2, 50);
      }

      $(".rps-buttons, #text-input, #username-button").css({
        display: "block"
      });
      gif.innerHTML = "";
    } else if (state === 1 && thisUser.userName) {
      $("#opponent").text(`awaiting 2nd player`);
      $("#text-input, #username-button").css({ display: "none" });
    } else if (state === 1 && !thisUser.opponent) {
      defaultState();
    } else if (state === 3) {
      $("#opponent").text(thisUser.opponent);
      if (!otherUser.guessName) {
        $(".rps-buttons").css({ display: "none" });
        header2.textContent = "";
        header.textContent = `you chose ${thisUser.guessName}`;
        fadeIn(header, 50);
        gifDisplay();
      } else {
        $(".rps-buttons").css({ display: "block" });
        header2.textContent = "rock, paper, or scissors?";
        fadeIn(header2, 50);
      }
    }
    buttonHide();
  } else {
    defaultState();
  }
};

const buttonHide = () => {
  $("#username-button").text("comment");
  $("#text-input")
    .val("")
    .attr({ placeholder: "add comment" });
};

const commentSave = () => {
  const comment = $("#text-input")
    .val()
    .trim();
  comment.length === 0
    ? $("#text-input").attr({ placeholder: "please type a comment you dope" })
    : db
        .ref("comment")
        .push({ comment: `${comment}`, commenter: persist })
        .then(() => $("#text-input").val(""))
        .catch(err => console.log(err));
};

// Comment display
const commentDisplay = () => {
  const query = db.ref("comment").orderByKey();

  query
    .once("value")
    .then(snapshot => {
      $("#comment-out").empty();
      snapshot.forEach(childSnapshot => {
        const commentTag = $("<div>").addClass("comment");
        // childData will be the actual contents of the child
        const childData = childSnapshot.val().comment;
        const textAlign = childSnapshot.val().commenter;
        // set user comments to appear on right side, opponent comments to appear on left side
        textAlign === persist
          ? $(commentTag).addClass("my-comment")
          : $(commentTag).addClass("oppo-comment");
        $(commentTag).text(`${childData}`);
        $("#comment-out").append(commentTag);
      });
    })
    .catch(err => console.log(err));
};

let time = "";

// Clear database button
$(document).on("click", "#clear", function(event) {
  event.preventDefault();
  db.ref("timeCleared")
    .update({ buttonClear: time })
    .catch(err => console.log(err));
  clearDatabase();
});

// CLEAR DATABASE
const clearDatabase = () => {
  sessionStorage.clear();

  db.ref()
    .update({
      state: 0,
      comment: "",
      player: ""
    })
    .then(() => location.reload())
    .catch(error => console.log("Remove failed: " + error.message));

  time = moment().format("MMM D YYYY, h:mm:ss a");

  db.ref("timeCleared").update({ lastTimeCleared: `Cleared at ${time}` });
  location.reload;
};

const autoClear = () => {
  time = moment().format("MMM D YYYY, h:mm:ss a");

  clearTimeout(timer);
  timer = setTimeout(clearDatabase, 180000);
  const autoClearTime = `autoClear set at ${time}`;
  db.ref("timeCleared").update({ autoClearTime: autoClearTime, timer: timer });
};

// Rock Paper Scissors Button
$(document).on("click", ".rps-buttons", function(event) {
  event.preventDefault();
  autoClear();
  db.ref("timeCleared").update({ buttonClear: time });
  const guess = $(this).attr("id");
  let dbGuess = 0;
  if (guess === "paper") dbGuess = 1;
  if (guess === "scissors") dbGuess = 2;
  guessSubmit(dbGuess, guess);
  $(".rps-buttons").css({ display: "none" }); // redundant?
});

const guessSubmit = (guessNumber, guessName) => {
  let dbGif = [
    "/assets/gifs/rock.gif",
    "/assets/gifs/paper.gif",
    "/assets/gifs/scissors.gif"
  ];

  db.ref(`player/${persist}`)
    .update({
      guess: guessNumber,
      guessName: guessName,
      dbGif: dbGif[guessNumber]
    })
    .catch(err => console.log(err));

  state === 2
    ? db
        .ref()
        .update({ state: 3 })
        .catch(err => console.log(err))
    : rpsLogic();
};

// Main Game Logic
const rpsLogic = () => {
  let guess1 = thisUser.guess;
  let guess2 = otherUser.guess;

  let plr1wins = thisUser.wins;
  let plr1losses = thisUser.losses;
  let plr2wins = otherUser.wins;
  let plr2losses = otherUser.losses;

  let outcome;
  let oppoOutcome;

  if (guess1 === guess2) {
    outcome = oppoOutcome = "tie";
    plr1wins += 0.5;
    plr1losses += 0.5;
    plr2wins += 0.5;
    plr2losses += 0.5;
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
    .catch(err => console.log(err));

  db.ref(`player/${thisUser.oppoKey}`)
    .update({
      losses: plr2losses,
      wins: plr2wins,
      outcome: oppoOutcome
    })
    .catch(err => console.log(err));

  db.ref().update({ state: 4 });
  playAgainBtn.style.display = "block";
};

// Win Loss Comment Display
const winDisplay = () => {
  $(".rps-buttons").css({ display: "none" });
  header2.textContent = "";
  header.textContent = `You ${thisUser.outcome}`;
  fadeIn(header);
  header2.classList.remove("fade-in");
  header.classList.remove("fade-in");
  $("#player").html(
    `${thisUser.userName}<br>W: ${thisUser.wins} L: ${thisUser.losses}`
  );
  $("#opponent").html(
    `${otherUser.userName}<br>W: ${otherUser.wins} L: ${otherUser.losses}`
  );
  fadeIn(playAgainBtn, 150);
  buttonHide();
  gifDisplay();
};

const gifDisplay = () => {
  const img = document.createElement("img");
  img.src = thisUser.dbGif;
  const gifDiv = document.getElementById("gif");
  let outcome = thisUser.outcome;
  if (outcome === "lose") {
    gifDiv.innerHTML = "";
    gifDiv.appendChild(img);
    fadeOutAndCallback(img, 50, function() {
      img.src = otherUser.dbGif;
      fadeIn(img, 100);
    });
  } else {
    gifDiv.innerHTML = "";
    gifDiv.appendChild(img);
    fadeIn(img, 100);
  }
};

// RESET BUTTON / PLAY AGAIN
$(document).on("click", "#reset", function() {
  db.ref().update({ state: 2 });
  autoClear();
  const reset = db.ref("player").orderByKey();

  reset.once("value").then(snapshot => {
    snapshot.forEach(childSnapshot => {
      // key is the comment identifier
      const key = childSnapshot.key;
      // childData will be the actual contents of the child
      const guessdata = childSnapshot.val();
      if (guessdata.guessName)
        db.ref(`player/${key}`).update({
          dbGif: "",
          guessName: null,
          guess: null,
          outcome: ""
        });
    });
  });

  header.innerHTML = "";
});

db.ref().on("child_changed", snapshot => {
  changedState = snapshot.val();
  if (changedState === 0) {
    sessionStorage.clear();
    location.reload();
  }
});

db.ref("comment").on("value", () => commentDisplay());

db.ref("player").on("value", () => playerDisplay());

const fadeIn = (element, millisecs) => {
  let op = 0.1; // initial opacity
  element.style.display = "block";
  const fadetimer = setInterval(() => {
    if (op >= 0.99) {
      clearInterval(fadetimer);
    }
    element.style.opacity = op;
    op += 0.1;
  }, millisecs);
};

const fadeOutAndCallback = (image, millisecs, callback) => {
  let opacity = 1;
  const fadeOutTimer = setInterval(() => {
    if (opacity < 0.1) {
      clearInterval(fadeOutTimer);
      image.style.opacity = 0;
      callback(); //executes the callback function to prevent flickering
    }
    image.style.opacity = opacity;
    opacity -= 0.1;
  }, millisecs);
};
