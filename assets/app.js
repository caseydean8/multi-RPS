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

const header = document.getElementById("header");
const header2 = document.getElementById("header-2");
// let clear;
// let clearConsole;
const dbDefault = {
  userName: "",
  opponent: "",
  guess: null,
  guessName: null,
  wins: 0,
  losses: 0
};

// console.log(moment().format("MMM D YYYY, h:mm a"));

const pageRefresh = () => {
  // console.log(rpsObj, "at page refresh");
  db.ref().once("value", snapshot => {
    state = snapshot.val().state;
    // console.log(state);
    switch (state) {
      case 1:
        playerDisplay();
        break;
      case 2:
        playerDisplay();
        // setTimeout(playerDisplay(), 100); // why is the timeout here?
        commentDisplay();
        break;
      case 3:
        playerDisplay(); // 125
        commentDisplay();
        break;
      case 4:
        // winDisplay();
        setTimeout(winDisplay, 200); // 342
        commentDisplay();
        break;
      default:
        defaultState();
    }
  });
};

window.onload = pageRefresh;

const defaultState = () => {
  $("#opponent").empty();
  header.textContent = "rock paper scissors";
  header.classList.add("fade-in");
  // unfade(header);
  $("#player").html("Welcome!<br>Add user name?");
  $("#no-button")
    .css({ display: "block" })
    .text("no thanks");
  $("#text-input")
    .attr({ placeholder: "add username" })
    .css({ display: "block" });
  $("#username-button")
    .css({ display: "block" })
    .text("submit");
};

let state; // moved to top
let thisUser;
let otherUser;
let timer;

// Set rps.Object
db.ref().on("value", snapshot => {
  rpsObj = snapshot.val();
  state = rpsObj.state;
  thisUser = rpsObj.player[persist];
  if (state >= 1) timer = rpsObj.timeCleared.timer;
  if (state > 2) otherUser = rpsObj.player[thisUser.oppoKey];
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

// Send Player object to database Step 1.1
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
          otherUser = rpsObj.player[key]; // might be redundant
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
    })
    .catch(err => console.log(err));
};

const playerDisplay = () => {
  if (thisUser) {
    $("#player").text(`${thisUser.userName}`);
    $("#reset").css({ display: "none" });

    if (state === 2) {
      $("#text-input").css({ display: "none" });
      $("#vs").text("vs");
      $("#opponent").text(thisUser.opponent);
      // header.classList.toggle("fade-in");
      header.textContent = "";
      header2.textContent = "rock, paper, or scissors?";
      // header2.classList.toggle("fade-in");

      // unfade(header);
      $(".rps-buttons, #text-input, #username-button").css({
        display: "block"
      });
      gif.style.backgroundImage = "none";

      // $("#gif").css({ "background-image": "none" });
    } else if (state === 1 && thisUser.userName) {
      // header2.textContent = "rock paper scissors";
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
        unfade(header);
        // unfade(backgroundDisplay(thisUser.guessName))
        // backgroundDisplay(thisUser.guessName);
        // unfade(backgroundDisplay);
      } else {
        $(".rps-buttons").css({ display: "block" });
        header2.textContent = "rock, paper, or scissors?";
        unfade(header2);
      }
    }
    buttonHide();
  } else {
    defaultState();
  }
};

const buttonHide = () => {
  $("#no-button").css({ display: "none" });
  $("#username-button").text("comment");
  $("#text-input")
    .val("")
    .attr({ placeholder: "add comment" });
};

const commentSave = () => {
  const comment = $("#text-input")
    .val()
    .trim();

  comment
    ? db
        .ref("comment")
        .push({ comment: `${comment}`, commenter: persist })
        .then(() => pageRefresh())
        .catch(err => console.log(err))
    : $("#text-input").attr({ placeholder: "please type a comment you dope" });
};

// Comment display
const commentDisplay = () => {
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

let time = "";

// Clear database button
$(document).on("click", "#clear", function(event) {
  event.preventDefault();
  db.ref("timeCleared").update({ buttonClear: time });
  clearDatabase();
  pageRefresh(); // probably redundant
});

// CLEAR DATABASE
const clearDatabase = () => {
  console.log("clear database happened");
  sessionStorage.clear();

  db.ref()
    .update({
      state: 0,
      comment: "",
      player: ""
      // timeCleared: { clearData: time }
    })
    .then(function() {
      location.reload();
    })
    .catch(function(error) {
      console.log("Remove failed: " + error.message);
    });

  time = moment().format("MMM D YYYY, h:mm:ss a");

  db.ref("timeCleared").update({ lastTimeCleared: `Cleared at ${time}` });
  location.reload;
};
// let clear;
const autoClear = () => {
  // clear = rpsObj.timeCleared.timer;
  time = moment().format("MMM D YYYY, h:mm:ss a");

  clearTimeout(timer);
  timer = setTimeout(clearDatabase, 180000); // possibly change to 180000 (3 minutes)
  // clearConsole = setTimeout(logClear, 300000);
  const autoClearTime = `autoClear set at ${time}`;
  console.log(timer, autoClearTime);
  db.ref("timeCleared").update({ autoClearTime: autoClearTime, timer: timer });
  // console.log(clear, clearConsole, "at autoClear");
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

const gif = document.getElementById("gif");
const backgroundDisplay = choice => {
  switch (choice) {
    case "rock":
      $("#gif").css({
        "background-image": `url("https://media.giphy.com/media/sSfxdaLf3tive/giphy.gif")`
      });
      //https://media.giphy.com/media/I1SLS2om702u4/giphy-downsized.gif
      // https://media.giphy.com/media/9Dgf4pFMzSrTrE4Urj/giphy.gif
      break;
    case "paper":
      $("#gif").css({
        "background-image": `url("https://media.giphy.com/media/VTxmwaCEwSlZm/giphy.gif")`
      });
      break;
    default:
      $("#gif").css({
        "background-image": `url("https://media.giphy.com/media/M7ZLjbUplnd3q/giphy.gif")`
      });
    // https://media.giphy.com/media/xTiTnrZCjg8IsJ34be/giphy.gif
  }
  // return gif;
  // $("#gif").fadeIn();
  // unfade(gif);
  // $("#gif").css({ display: "block" });
};

const guessSubmit = (guessNumber, guessName) => {
  let dbGif = [
    "https://media.giphy.com/media/I1SLS2om702u4/giphy-downsized.gif", "https://media.giphy.com/media/VTxmwaCEwSlZm/giphy.gif", "https://media.giphy.com/media/M7ZLjbUplnd3q/giphy.gif"
  ];

  db.ref(`player/${persist}`)
    .update({ guess: guessNumber, guessName: guessName, dbGif: dbGif[guessNumber] }) 
    .then(() => {
      pageRefresh;
    })
    .catch(err => console.log(err));

  if (state === 2) {
    db.ref().update({ state: 3 });
    // backgroundDisplay(guessName);
  } else if (state === 3) {
    // } else { // check if can be made ternary
    // $("#header").empty(); // to stop header flash at state 4
    db.ref()
      .update({ state: 4 })
      .then(() => {
        rpsLogic();
        // backgroundDisplay(guessName);
      })
      .catch(err => console.log(err));
  }
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
};

// Win Loss Comment Display
const winDisplay = () => {
  $(".rps-buttons").css({ display: "none" });
  header2.textContent = "";
  header.textContent = `You ${thisUser.outcome}`;
  unfade(header);
  header2.classList.remove("fade-in");
  header.classList.remove("fade-in");
  $("#player").html(
    `${thisUser.userName}<br>W: ${thisUser.wins} L: ${thisUser.losses}`
  );
  $("#opponent").html(
    `${otherUser.userName}<br>W: ${otherUser.wins} L: ${otherUser.losses}`
  );
  $("#reset").css({ display: "block" });
  buttonHide();
  const img = document.createElement("img");
  const gifDiv = document.getElementById("gif");
  if (thisUser.outcome === "lose") {
    console.log("lose");
    img.src = otherUser.dbGif;
    gifDiv.appendChild(img);
    // backgroundDisplay(otherUser.guessName);
  } else {
    img.src = thisUser.dbGif;
    gifDiv.appendChild(img);
    // backgroundDisplay(thisUser.guessName);
  }

  // if (thisUser.outcome === "lose") backgroundDisplay(otherUser.guessName);
};

// RESET BUTTON / PLAY AGAIN
$(document).on("click", "#reset", function() {
  // autoClear(); removing this fixed reversion to state 2
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
        db.ref(`player/${key}`).update({ guessName: null, guess: null });
    });
  });

  $(".header").css({ display: "none" }); //?
});

db.ref().on("child_changed", snapshot => {
  changedState = snapshot.val();
  if (changedState === 0) {
    sessionStorage.clear();
    location.reload();
  }
  // else if (changedState === 2) {
  //   location.reload(); // don't know why this worked, try moving to play again button
  // }
  else {
    pageRefresh();
  }
});

function unfade(element) {
  console.log("unfade");
  var op = 0.1; // initial opacity
  element.style.display = "block";
  var fadetimer = setInterval(function() {
    if (op > 0.99) {
      clearInterval(fadetimer);
    }
    element.style.opacity = op;
    // element.style.filter = "alpha(opacity=" + op * 100 + ")";
    op += 0.1;
  }, 10);
}

// Not used

function fadeOutAndCallback(image, callback) {
  var opacity = 1;
  var timer = setInterval(function() {
    if (opacity < 0.1) {
      clearInterval(timer);
      image.style.opacity = 0;
      callback(); //this executes the callback function!
    }
    image.style.opacity = opacity;
    opacity -= 0.1;
  }, 50);
}

function fadeOut(element) {
  var op = 1; // initial opacity
  var timer = setInterval(function() {
    if (op <= 0.1) {
      clearInterval(timer);
    }
    element.style.opacity = op;
    op -= 0.1;
  }, 50);
}
