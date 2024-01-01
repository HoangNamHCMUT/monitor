/************************************************************** MAIN FUNCTION  ******************************************************************/

// Global variable
let jwtToken = localStorage.getItem("jwtToken");
let jwtExpirationTime = localStorage.getItem("jwtExpirationTime");
let refreshToken = localStorage.getItem("refreshToken");
let refreshExpirationTime = localStorage.getItem("refreshExpirationTime");
let jwtTimeout = [
  new Date(jwtExpirationTime).getHours(),
  new Date(jwtExpirationTime).getMinutes(),
  new Date(jwtExpirationTime).getSeconds(),
  new Date(jwtExpirationTime).getDate(),
  new Date(jwtExpirationTime).getMonth(),
  new Date(jwtExpirationTime).getFullYear(),
];
let refreshTimeout = [
  new Date(refreshExpirationTime).getHours(),
  new Date(refreshExpirationTime).getMinutes(),
  new Date(refreshExpirationTime).getSeconds(),
  new Date(jwtExpirationTime).getDate(),
  new Date(jwtExpirationTime).getMonth(),
  new Date(jwtExpirationTime).getFullYear(),
];
let logFlag = localStorage.getItem("logFlag");
let userName = localStorage.getItem("userName");
let sendStatus = 0                                          // status of sending data from esp32 to web api (0: unsend; 1: sending) 
let timeFilterFlag = 0;
let dateFilterFlag = 0;
let loginFlag = 0;
let registerFlag = 0;
let loginForm = null;
let registerForm = null;
let option = 0;                                             // option = 0 --> temperature | option = 1 --> humidity
let temperatureAverage = [22, 35];
let humidityAverage = [];
let realtimeTemperature = null; 
let realtimeHumidity = null;
let socketData = [0];
let socket = null;                                          // Websocket handle
let esp32IP = null;                                         // IP address of esp32 
let backendIp = [];                                         // Backend ip address
let alarmStatus = null;                                     // status of the alarm on SMT32F1 
let bulbStatus = null;                                      // status of the bulb on STM32F1 
let url = null;                                             // URL to access data in backend                        

// Google Chart API configuration
// load current chart package
google.charts.load("current", {
  packages: ["corechart", "line", "gauge"]
});

google.charts.setOnLoadCallback(temperatureClock);
google.charts.setOnLoadCallback(humidityClock);

// set callback function when api loaded
google.charts.setOnLoadCallback(DrawTemperatureChart);
google.charts.setOnLoadCallback(DrawHumidityChart);

// Other configuration
$(".option-button").css("color", "rgb(203, 29, 29)");
$(".user-name").text("");
$(".buzzer-state").text("NA");

// Show/Hide some element at the beginning
$(".filter-table-div").hide();
$("form").hide();
$(".side-bar").hide();
if (logFlag === "logged") {
  Unlock();
  $(".user-button").fadeIn();
  $(".register-button").text("Refresh");
  $(".login-button").text("Logout");
  $(".user-name").text(userName);
  $(".token-timeout").text(`Expiration Time: ${jwtTimeout[0]}:${jwtTimeout[1]}`);
}
else {
  $(".user-button").hide();
  // Block table control
  Block();
}
$(".stop-button").hide();
$(".ws-disconnect-button").hide();
$("#temperature-chart").hide();
$("#humidity-chart").hide();

/************************************************************ Add Event Listener ****************************************************************/

// Show password
function ShowRegisterPassword() {
  var x = document.querySelectorAll(".register-password");
  x.forEach((x) => {
    if (x.type === "password") {
      x.type = "text";
    } else {
      x.type = "password";
    }
  });
}
function ShowLoginPassword() {
  var x = document.querySelectorAll(".login-password");
  x.forEach((x) => {
    if (x.type === "password") {
      x.type = "text";
    } else {
      x.type = "password";
    }
  });
}

// Add click event for temperature button to set the temperature safe range 
$(".temperature-button").click(function () {
  if ($(".temperature-button").hasClass("not-allow")) {
    var audio = new Audio("./Audio/error-click.mp3");
    audio.play();
  } else {
    var audio = new Audio("./Audio/classic-click.mp3");
    audio.play();
    const lowest = $(".temperature-lowest")[0].value;
    const highest = $(".temperature-highest")[0].value;
    TemperatureRange(lowest, highest);
  }
});

// Add click event for humidity button to set the humidity safe range 
$(".humidity-button").click(function () {
  if ($(".humidity-button").hasClass("not-allow")) {
    var audio = new Audio("./Audio/error-click.mp3");
    audio.play();
  } else {
    var audio = new Audio("./Audio/classic-click.mp3");
    audio.play();
    const lowest = $(".humidity-lowest")[0].value;
    const highest = $(".humidity-highest")[0].value;
    HumidityRange(lowest, highest);
  }
});

// Add click event for register/confirm button using Jquery
// Register button
$(".register-button").click(function () {
  // Audio
  var audio = new Audio("./Audio/classic-click.mp3");
  audio.play();
  if ($(".register-button").text() == "Register") {
    $(".register-button").text("Confirm");
    $(".login-button").text("Close");
    $(".register-form").fadeIn();
    registerFlag = 1;
  }
  else if ($(".register-button").text() == "Refresh")
  { 
    Refresh();
    UpdateStatus();
  }
  // Confirm button
  else {
    if (loginFlag == 1) {
      alert("Login");
      // Passing Json string to the login function
      Login();
    } else if (registerFlag == 1) {
      alert("Register");
      Register();
    }
  }
});

// Add click event for login button using Jquery
$(".login-button").click(function () {
  if ($(".login-button").text() == "Close") {
    // Audio
    var audio = new Audio("./Audio/Back-Sound.mp3");
    audio.play();
    $(".register-button").text("Register");
    $(".login-button").text("Login");
    $("form").fadeOut();
    registerFlag = 0;
    loginFlag = 0;
  } else if ($(".login-button").text() == "Login") {
    // Audio
    var audio = new Audio("./Audio/classic-click.mp3");
    audio.play();
    $(".register-button").text("Confirm");
    $(".login-button").text("Close");
    $(".login-form").fadeIn();
    loginFlag = 1;
  }
});

// Add click event for user button using Jquery
$(".user-button").click(function () {
  // Audio
  var audio = new Audio("./Audio/Back-Sound.mp3");
  audio.play();
  let jwtTimout = TimeoutDisplay(0, localStorage.getItem("jwtExpirationTime"));
  let refreshTimeout = TimeoutDisplay(1, localStorage.getItem("refreshExpirationTime"));
  alert(`Username: ${localStorage.getItem("userName")}
  \nJWT's expiration-time: ${jwtTimeout[3]}/${jwtTimeout[4]}/${jwtTimeout[5]}, ${jwtTimeout[0]}:${jwtTimeout[1]}
  \nRefresh Token's expiration-time: ${refreshTimeout[3]}/${refreshTimeout[4]}/${refreshTimeout[5]}, ${refreshTimeout[0]}:${refreshTimeout[1]}`);
});

// Add double click event for logout button using Jquery
$(".login-button").dblclick(function () {
  if ($(".login-button").text() == "Logout") {
    // Audio
    var audio = new Audio("./Audio/classic-click.mp3");
    audio.play();
    registerFlag = 0;
    loginFlag = 0;
    // jwtToken = null;
    localStorage.clear();
    $(".user-name").text("");
    $(".register-button").text("Register");
    $(".login-button").text("Login");
    $(".register-button").fadeIn();
    $(".filter-table-div").fadeOut();
    $(".open-filter-button").text("Open Filter");
    $("table tr").remove(".value-rows");
    Block();
    alert("Logout sucessfully");
    $(".user-button").hide();
    $(".token-timeout").text("");
  }
});

// Add click event for open filter button using Jquery
$(".open-filter-button").click(function () {
  FilterClickHandler();
});

// Add click event for option button using Jquery
$(".option-button").click(function () {
  OptionClickHandler();
});

// Add click event for side bar buttons using Jquery
// Alarm button
$(".buzzer-button").click(function () {
  var audio = new Audio("./Audio/classic-click.mp3");
  audio.play();
  if (alarmStatus === "OFF") {
    AlarmHandle("ON");
  } else if (alarmStatus === "ON") {
    AlarmHandle("OFF");
  }
});
// Expand button
$(".expand-button").click(function () {
  var audio = new Audio("./Audio/classic-click.mp3");
  audio.play();
  $(".expand").hide();
  $(".side-bar").fadeIn();
  $(".body-container").addClass("body-container-shrink");
  $(".temperature-picture").addClass("temperature-picture-shrink");
  // // Timer
  // setInterval(() => {
  //   console.log("Hello World\n");
  // }, 1000); // print "Hello World" every 1 second
});
// Shrink button
$(".shrink-button").click(function () {
  var audio = new Audio("./Audio/Back-Sound.mp3");
  audio.play();
  $(".side-bar").hide();
  $(".body-container").removeClass("body-container-shrink");
  $(".temperature-picture").removeClass("temperature-picture-shrink");
  $(".expand").fadeIn();
});
// Bulb button
$(".bulb-button").click(function () {
  var audio = new Audio("./Audio/classic-click.mp3");
  audio.play();
  if (bulbStatus === "OFF") {
    BulbHandle("ON");
  } else if (bulbStatus === "ON") {
    BulbHandle("OFF");
  }
});
// Average button
$(".average-button").click(function () {
  var audio = new Audio("./Audio/classic-click.mp3");
  audio.play();
  const searchInput = $(".date-search");
  const date = searchInput[0].value.split("/").reverse().join("-"); // convert the time format "dd/MM/yyyy" to "yyyy-MM-dd"
  Average(date);
});
// Delete button
$(".delete-button").click(function () {
  var audio = new Audio("./Audio/classic-click.mp3");
  audio.play();
  $("table tr").remove(".value-rows"); // clear the row values of filter table
  const searchInput = $(".date-search");
  const date = searchInput[0].value.split("/").reverse().join("-"); // convert the time format "dd/MM/yyyy" to "yyyy-MM-dd"
  DeleteByDate(date);
});
// Send button
$(".send-button").click(function () {
  var audio = new Audio("./Audio/classic-click.mp3");
  audio.play();
  $(".send-state").text("Processing...");
  SendHandle("Send");
});
// Stop sending button
$(".stop-button").click(function () {
  var audio = new Audio("./Audio/classic-click.mp3");
  audio.play();
  $(".send-state").text("Processing...");
  SendHandle("Unsend");
});
// Export button
$(".export-button").click(function () {
  var audio = new Audio("./Audio/classic-click.mp3");
  audio.play();
  if (option == 0) {
    exportTableToExcel("tblData", "Temperature");
  }
  else if (option == 1) { 
    exportTableToExcel("tblData", "Humidity");
  }
});
// Websocket connect button
$(".ws-connect-button").click(function () {
  var audio = new Audio("./Audio/classic-click.mp3");
  audio.play();
  esp32IP = $(".esp32-ip-search")[0].value;
  WebsocketInit(esp32IP);
});
// Websocket disconnect button
$(".ws-disconnect-button").click(function () {
  var audio = new Audio("./Audio/classic-click.mp3");
  audio.play();
  socket.close();
});
// Backend IP button
$(".backend-ip-button").click(function () {
  var audio = new Audio("./Audio/classic-click.mp3");
  audio.play();
  backendIp[0] = $(".backend-ip-search")[0].value;
  console.log(backendIp[0]);
  SendBackendIP(backendIp[0]);
});
$(".public-ip-button").click(function () {
  var audio = new Audio("./Audio/classic-click.mp3");
  audio.play();
  backendIp[1] = $(".public-ip-search")[0].value;
  console.log(backendIp[1]);
});
// Add click event for filter buttons using Jquery
$(".time-button").click(function () {
  var audio = new Audio("./Audio/classic-click.mp3");
  audio.play();
  TimeClickHandler();
});

$(".value-button").click(function () {
  var audio = new Audio("./Audio/classic-click.mp3");
  audio.play();
  ValueClickHandler();
});

$(".none-button").click(function () {
  $("table tr").remove(".value-rows"); // clear the row values of filter table
  var audio = new Audio("./Audio/classic-click.mp3");
  audio.play();
  const searchInput = $(".date-search");
  const date = searchInput[0].value.split("/").reverse().join("-"); // convert the time format "dd/MM/yyyy" to "yyyy-MM-dd"
  NoneFilter(date);
});

$(".clear-button").click(function () {
  var audio = new Audio("./Audio/classic-click.mp3");
  audio.play();
  $("table tr").remove(".value-rows"); // clear the row values of filter table
});

$(".value-option-button-largest").click(function () {
  $("table tr").remove(".value-rows"); // clear the row values of filter table
  var audio = new Audio("./Audio/classic-click.mp3");
  audio.play();
  const searchInput = $(".date-search");
  const date = searchInput[0].value.split("/").reverse().join("-"); // convert the time format "dd/MM/yyyy" to "yyyy-MM-dd"
  DescendingFilter(date);
  StartFilter();
});

$(".value-option-button-smallest").click(function () {
  $("table tr").remove(".value-rows"); // clear the row values of filter table
  var audio = new Audio("./Audio/classic-click.mp3");
  audio.play();
  const searchInput = $(".date-search");
  const date = searchInput[0].value.split("/").reverse().join("-"); // convert the time format "dd/MM/yyyy" to "yyyy-MM-dd"
  AscendingFilter(date);
  StartFilter();
});

$(".time-option-button-oldest").click(function () {
  $("table tr").remove(".value-rows"); // clear the row values of filter table
  var audio = new Audio("./Audio/classic-click.mp3");
  audio.play();
  const searchInput = $(".date-search");
  const date = searchInput[0].value.split("/").reverse().join("-"); // convert the time format "dd/MM/yyyy" to "yyyy-MM-dd"
  OldestFilter(date);
  StartFilter();
});

$(".time-option-button-latest").click(function () {
  $("table tr").remove(".value-rows"); // clear the row values of filter table
  var audio = new Audio("./Audio/classic-click.mp3");
  audio.play();
  const searchInput = $(".date-search");
  const date = searchInput[0].value.split("/").reverse().join("-"); // convert the time format "dd/MM/yyyy" to "yyyy-MM-dd"
  LatestFilter(date);
  StartFilter();
});

$(".back-button").click(function () {
  var audio = new Audio("./Audio/Back-Sound.mp3");
  audio.play();
  StartFilter();
});

/************************************************************* ADDITIONAL FUNCTIONS *************************************************************/

/* Function to get the arbitrary temperature/humidity values */
async function NoneFilter(date = "") {
  if (option == 0) {
    if (date === "") {
      url = `https://${backendIp[1]}/Api/Temperature`;
    } else {
      url = `https://${backendIp[1]}/Api/Temperature/SearchByDate/${date}`;
    }
    /* Get data from the backend server */
    await fetch(url, {
      headers: {
        "ngrok-skip-browser-warning": "69420",
        Authorization: `Bearer ${jwtToken}`,
      },
    })
      .then(
        (response) => response.json() // convert the array response to json format, then waiting for this json response
      )
      .then((data) => {
        const htmlArray = data.map(
          (element) =>
            `<tr class="value-rows">
            <td>${element.temperatureTimeString}</td>
            <td>${element.temperatureValue}</td>
            <td>&deg;C</td>
          </tr>`
        );
        const htmlString = htmlArray.join("");
        $(".filter-table").append(htmlString);
      });
  } else {
    if (date === "") {
      url = `https://${backendIp[1]}/Api/Humidity`;
    } else {
      url = `https://${backendIp[1]}/Api/Humidity/SearchByDate/${date}`;
    }
    /* Get data from the backend server */
    await fetch(url, {
      headers: {
        "ngrok-skip-browser-warning": "69420",
        Authorization: `Bearer ${jwtToken}`,
      },
    })
      .then(
        (response) => response.json() // convert the array response to json format, then waiting for this json response
      )
      .then((data) => {
        const htmlArray = data.map(
          (element) =>
            `<tr class="value-rows">
            <td>${element.humidityTimeString}</td>
            <td>${element.humidityValue}</td>
            <td>%</td>
          </tr>`
        );
        const htmlString = htmlArray.join("");
        $(".filter-table").append(htmlString);
      });
  }
}

/* Function to sort temperature/humidity values from the latest time */
async function LatestFilter(date = "") {
  if (option == 0) {
     if (date === "") {
       url = `https://${backendIp[1]}/Api/Temperature`;
     } else {
       url = `https://${backendIp[1]}/Api/Temperature/SearchByDate/${date}`;
     }
    /* Get temperature data from the backend server */
    await fetch(url, {
      headers: {
        "ngrok-skip-browser-warning": "69420",
        Authorization: `Bearer ${jwtToken}`,
      },
    })
      .then(
        (response) => response.json() // convert the array response to json format, then waiting for this json response
      )
      .then((data) => {
        data.sort(function (a, b) {
          return a.temperatureTime.localeCompare(b.temperatureTime);
        }); // sort data from the oldest time
        const htmlArray = data.map(
          (element) =>
            `<tr class="value-rows">
            <td>${element.temperatureTimeString}</td>
            <td>${element.temperatureValue}</td>
            <td>&deg;C</td>
          </tr>`
        );
        const htmlString = htmlArray.reverse().join(""); // reverse to sort data from the latest time
        $(".filter-table").append(htmlString);
      });
  } else {
    if (date === "") {
      url = `https://${backendIp[1]}/Api/Humidity`;
    } else {
      url = `https://${backendIp[1]}/Api/Humidity/SearchByDate/${date}`;
    }
    /* Get humidity data from the backend server */
    await fetch(url, {
      headers: {
        "ngrok-skip-browser-warning": "69420",
        Authorization: `Bearer ${jwtToken}`,
      },
    })
      .then(
        (response) => response.json() // convert the array response to json format, then waiting for this json response
      )
      .then((data) => {
        data.sort(function (a, b) {
          return a.humidityTime.localeCompare(b.humidityTime);
        }); // sort data from the oldest time
        const htmlArray = data.map(
          (element) =>
            `<tr class="value-rows">
            <td>${element.humidityTimeString}</td>
            <td>${element.humidityValue}</td>
            <td>%</td>
          </tr>`
        );
        const htmlString = htmlArray.reverse().join(""); // reverse to sort data from the latest time
        $(".filter-table").append(htmlString);
      });
  }
}

/* Function to sort temperature/humidity values from the oldest time */
async function OldestFilter(date = "") {
  if (option == 0) {
     if (date === "") {
       url = `https://${backendIp[1]}/Api/Temperature`;
     } else {
       url = `https://${backendIp[1]}/Api/Temperature/SearchByDate/${date}`;
     }
    /* Get temperature data from the backend server */
    await fetch(url, {
      headers: {
        "ngrok-skip-browser-warning": "69420",
        Authorization: `Bearer ${jwtToken}`,
      },
    })
      .then(
        (response) => response.json() // convert the array response to json format, then waiting for this json response
      )
      .then((data) => {
        data.sort(function (a, b) {
          return a.temperatureTime.localeCompare(b.temperatureTime);
        }); // sort data from the oldest time
        const htmlArray = data.map(
          (element) =>
            `<tr class="value-rows">
            <td>${element.temperatureTimeString}</td>
            <td>${element.temperatureValue}</td>
            <td>&deg;C</td>
          </tr>`
        );
        const htmlString = htmlArray.join("");
        $(".filter-table").append(htmlString);
      });
  } else {
    if (date === "") {
      url = `https://${backendIp[1]}/Api/Humidity`;
    } else {
      url = `https://${backendIp[1]}/Api/Humidity/SearchByDate/${date}`;
    }
    /* Get humidity data from the backend server */
    await fetch(url, {
      headers: {
        "ngrok-skip-browser-warning": "69420",
        Authorization: `Bearer ${jwtToken}`,
      },
    })
      .then(
        (response) => response.json() // convert the array response to json format, then waiting for this json response
      )
      .then((data) => {
        data.sort(function (a, b) {
          return a.humidityTime.localeCompare(b.humidityTime);
        }); // sort data from the oldest time
        const htmlArray = data.map(
          (element) =>
            `<tr class="value-rows">
            <td>${element.humidityTimeString}</td>
            <td>${element.humidityValue}</td>
            <td>%</td>
          </tr>`
        );
        const htmlString = htmlArray.join("");
        $(".filter-table").append(htmlString);
      });
  }
}

/* Function to sort temperature/humidity values from the largest value */
async function DescendingFilter(date = "") {
  if (option == 0) {
    if (date === "") {
      url = `https://${backendIp[1]}/Api/Temperature`;
    }
    else { 
      url = `https://${backendIp[1]}/Api/Temperature/SearchByDate/${date}`;
    }
      /* Get temperature data from the backend server */
    await fetch(url, {
      headers: {
        "ngrok-skip-browser-warning": "69420",
        Authorization: `Bearer ${jwtToken}`,
      },
    })
      .then(
        (response) => response.json() // convert the array response to json format, then waiting for this json response
      )
      .then((data) => {
        data.sort(function (a, b) {
          return a.temperatureValue - b.temperatureValue;
        }); // sort data from the smallest value
        const htmlArray = data.map(
          (element) =>
            `<tr class="value-rows">
          <td>${element.temperatureTimeString}</td>
          <td>${element.temperatureValue}</td>
          <td>&deg;C</td>
        </tr>`
        );
        const htmlString = htmlArray.reverse().join(""); // reverse to sort data from the largest value
        $(".filter-table").append(htmlString);
      });
  } else {
    if (date === "")
    { 
      url = `https://${backendIp[1]}/Api/Humidity`;
    }
    else { 
      url = `https://${backendIp[1]}/Api/Humidity/SearchByDate/${date}`;
    }
    /* Get humidity data from the backend server */
    await fetch(url, {
      headers: {
        "ngrok-skip-browser-warning": "69420",
        Authorization: `Bearer ${jwtToken}`,
      },
    })
      .then(
        (response) => response.json() // convert the array response to json format, then waiting for this json response
      )
      .then((data) => {
        data.sort(function (a, b) {
          return a.humidityValue - b.humidityValue;
        }); // sort data from the smallest value
        const htmlArray = data.map(
          (element) =>
            `<tr class="value-rows">
          <td>${element.humidityTimeString}</td>
          <td>${element.humidityValue}</td>
          <td>%</td>
        </tr>`
        );
        const htmlString = htmlArray.reverse().join(""); // reverse to sort data from the largest value
        $(".filter-table").append(htmlString);
      });
  }
}

/* Function to sort temperature/humidity values from the smallest value */
async function AscendingFilter(date = "") {
  if (option == 0) {
    if (date === "") {
      url = `https://${backendIp[1]}/Api/Temperature`;
    } else {
      url = `https://${backendIp[1]}/Api/Temperature/SearchByDate/${date}`;
    }
    /* Get temperature data from the backend server */
    await fetch(url, {
      headers: {
        "ngrok-skip-browser-warning": "69420",
        Authorization: `Bearer ${jwtToken}`,
      },
    })
      .then(
        (response) => response.json() // convert the array response to json format, then waiting for this json response
      )
      .then((data) => {
        data.sort(function (a, b) {
          return a.temperatureValue - b.temperatureValue;
        }); // sort data from the smallest value
        const htmlArray = data.map(
          (element) =>
            `<tr class="value-rows">
            <td>${element.temperatureTimeString}</td>
            <td>${element.temperatureValue}</td>
            <td>&deg;C</td>
          </tr>`
        );
        const htmlString = htmlArray.join("");
        $(".filter-table").append(htmlString);
      });
  } else {
    if (date === "") {
      url = `https://${backendIp[1]}/Api/Humidity`;
    } else {
      url = `https://${backendIp[1]}/Api/Humidity/SearchByDate/${date}`;
    }
    /* Get humidity data from the backend server */
    await fetch(url, {
      headers: {
        "ngrok-skip-browser-warning": "69420",
        Authorization: `Bearer ${jwtToken}`,
      },
    })
      .then(
        (response) => response.json() // convert the array response to json format, then waiting for this json response
      )
      .then((data) => {
        data.sort(function (a, b) {
          return a.humidityValue - b.humidityValue;
        }); // sort data from the smallest value
        const htmlArray = data.map(
          (element) =>
            `<tr class="value-rows">
            <td>${element.humidityTimeString}</td>
            <td>${element.humidityValue}</td>
            <td>%</td>
          </tr>`
        );
        const htmlString = htmlArray.join("");
        $(".filter-table").append(htmlString);
      });
  }
}

/* Function to search temperature/humidity values by date */
async function SearchByDate(date) {
  let average = 0;
  if (option == 0) {
    /* Get temperature data from the backend server */
    await fetch(`https://${backendIp[1]}/Api/Temperature/SearchByDate/${date}`, {
      headers: {
        "ngrok-skip-browser-warning": "69420",
        Authorization: `Bearer ${jwtToken}`,
      },
    })
      .then(
        (response) => response.json() // convert the array response to json format, then waiting for this json response
      )
      .then((data) => {
        const htmlArray = data.map(
          (element) =>
            `<tr class="value-rows">
            <td>${element.temperatureTimeString}</td>
            <td>${element.temperatureValue}</td>
            <td>&deg;C</td>
          </tr>`
        );
        const htmlString = htmlArray.join("");
        $(".filter-table").append(htmlString);
      });
  } else {
    /* Get humidity data from the backend server */
    await fetch(`https://${backendIp[1]}/Api/Humidity/SearchByDate/${date}`, {
      headers: {
        "ngrok-skip-browser-warning": "69420",
        Authorization: `Bearer ${jwtToken}`,
      },
    })
      .then(
        (response) => response.json() // convert the array response to json format, then waiting for this json response
      )
      .then((data) => {
        const htmlArray = data.map(
          (element) =>
            `<tr class="value-rows">
            <td>${element.humidityTimeString}</td>
            <td>${element.humidityValue}</td>
            <td>%</td>
          </tr>`
        );
        const htmlString = htmlArray.join("");
        $(".filter-table").append(htmlString);
      });
  }
}

/* Function to get the average value of the temperature and humidity values by date */
async function Average(date) {
  let average = 0;
  if (option == 0) {
    /* Get temperature data from the backend server and calculate the average */
    await fetch(`https://${backendIp[1]}/Api/Temperature/SearchByDate/${date}`, {
      headers: {
        "ngrok-skip-browser-warning": "69420",
        Authorization: `Bearer ${jwtToken}`,
      },
    })
      .then(
        (response) => response.json() // convert the array response to json format, then waiting for this json response
      )
      .then((data) => {
        for (let i = 0; i < data.length; i++) {
          average += data[i]["temperatureValue"];
        }
        average = (average / data.length).toFixed(2);
        $(".average-text").text(`${average} C`);
      });
  } else {
    /* Get humidity data from the backend server and calculate the average */
    await fetch(`https://${backendIp[1]}/Api/Humidity/SearchByDate/${date}`, {
      headers: {
        "ngrok-skip-browser-warning": "69420",
        Authorization: `Bearer ${jwtToken}`,
      },
    })
      .then(
        (response) => response.json() // convert the array response to json format, then waiting for this json response
      )
      .then((data) => {
        for (let i = 0; i < data.length; i++) {
          average += data[i]["humidityValue"];
        }
        average = (average / data.length).toFixed(2);
        $(".average-text").text(`${average} %`);
      });
  }
}

/* Function to get the latest humidity value */
async function GetLatestHumidity() {
  /* Get data from the backend server */
  await fetch(`https://${backendIp[1]}/Api/Humidity`, {
    headers: {
      Authorization: `Bearer ${jwtToken}`,
    },
  })
    .then(
      (response) => response.json() // convert the array response to json format, then waiting for this json response
    )
    .then((data) => {
      data.sort(function (a, b) {
        return a.humidityTime.localeCompare(b.humidityTime);
      }); // sort data from the oldest time
      $(".humidity-result").text(`${data[data.length - 1].humidityValue}`);
    });
}

/* Function to delete the temperature/humidity based on the date input */
async function DeleteByDate(date) {
  if (option == 0) {
    /* Get temperature data from the backend server */
    await fetch(`https://${backendIp[1]}/Api/Temperature/Delete/${date}`, {
      method: "DELETE",
      headers: {
        "ngrok-skip-browser-warning": "69420",
        Authorization: `Bearer ${jwtToken}`,
      },
    })
      .then(
        (response) => response.json() // convert the array response to json format, then waiting for this json response
      )
      .then((data) => {
        alert(`${data.length} temperature values were deleted!`);
      });
  } else {
    /* Get humidity data from the backend server */
    await fetch(`https://${backendIp[1]}/Api/Humidity/Delete/${date}`, {
      method: "DELETE",
      headers: {
        "ngrok-skip-browser-warning": "69420",
        Authorization: `Bearer ${jwtToken}`,
      },
    })
      .then(
        (response) => response.json() // convert the array response to json format, then waiting for this json response
      )
      .then((data) => {
        alert(`${data.length} humidity values were deleted!`);
      });
  }
}

/* Function to login */
async function Login() {
  //Html data to login form data
  const loginInput = $(".login-form input");
  loginForm = new FormData();
  loginForm.append("password", loginInput[1].value);
  loginForm.append("email", loginInput[0].value);

  // Converting form data to a plain object
  const plainFormData = Object.fromEntries(loginForm.entries());

  // Converting plain object to a Json string
  formDataJsonString = JSON.stringify(plainFormData);

  // POST request to login user
  const response = await fetch(`https://${backendIp[1]}/Account/Login`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain",
      "Content-Type": "application/json, charset=UTF-8",
    },
    body: formDataJsonString,
  });
  if (!(response.status == "200")) {
    alert("Fail to login, please try again!");
    ClearTextHtml(loginInput);
  } else {
    $("form").hide();
    const result = await response.json();
    jwtToken = result.jwtToken;
    jwtExpirationTime = result.expirationTime;
    refreshToken = result.refreshToken;
    refreshExpirationTime = result.refreshTokenExpirationTime;
    localStorage.setItem("jwtToken", jwtToken);
    localStorage.setItem("jwtExpirationTime", jwtExpirationTime);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("refreshExpirationTime", refreshExpirationTime);
    userName = result.userName;
    localStorage.setItem("userName", userName);
    $(".user-name").text(userName);
    localStorage.setItem("logFlag", "logged");
    ClearTextHtml(loginInput);
    alert("Successful login");
    Unlock();
    $(".register-button").text("Refresh");
    $(".login-button").text("Logout");
    $(".user-button").fadeIn();
    TimeoutDisplay(0, jwtExpirationTime);
  }
}

/* Function to register  */
async function Register() {
  //Html data to register form data
  const registerInput = $(".register-form input");
  const role = $(".register-form select").find(":selected").val();
  registerForm = new FormData();
  registerForm.append("email", registerInput[0].value);
  registerForm.append("phoneNumber", registerInput[1].value);
  registerForm.append("personName", registerInput[2].value);
  registerForm.append("password", registerInput[3].value);
  registerForm.append("confirmPassword", registerInput[4].value);
  registerForm.append("role", role);

  // Converting form data to a plain object
  const plainFormData = Object.fromEntries(registerForm.entries());

  // Converting plain object to a Json string
  formDataJsonString = JSON.stringify(plainFormData);

  console.log(formDataJsonString);

  // POST request to register user
  const response = await fetch(`https://${backendIp[1]}/Account/Register`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain",
      "Content-Type": "application/json, charset=UTF-8",
    },
    body: formDataJsonString,
  });
  if (!(response.status == "200")) {
    alert("Fail to register, please try again!");
    ClearTextHtml(registerInput);
  } else {
    $("form").hide();
    const result = await response.json();
    jwtToken = result.jwtToken;
    jwtExpirationTime = result.expirationTime;
    refreshToken = result.refreshToken;
    refreshExpirationTime = result.refreshTokenExpirationTime;
    localStorage.setItem("jwtToken", jwtToken);
    localStorage.setItem("jwtExpirationTime", jwtExpirationTime);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("refreshExpirationTime", refreshExpirationTime);
    userName = result.userName;
    localStorage.setItem("userName", userName);
    $(".user-name").text(userName);
    localStorage.setItem("logFlag", "logged");
    ClearTextHtml(registerInput);
    alert("Successful register");
    Unlock();
    $(".register-button").text("Refresh");
    $(".login-button").text("Logout");
    $(".user-button").fadeIn();
    TimeoutDisplay(0, jwtExpirationTime);
  }
}

/* Function to refresh JWT token */
async function Refresh() {
  // Refresh token form data
  loginForm = new FormData();
  loginForm.append("JwtToken", localStorage.getItem("jwtToken"));
  loginForm.append("RefreshToken", localStorage.getItem("refreshToken"));

  // Converting form data to a plain object
  const plainFormData = Object.fromEntries(loginForm.entries());

  // Converting plain object to a Json string
  formDataJsonString = JSON.stringify(plainFormData);
  // POST request to register user
  const response = await fetch(
    `https://${backendIp[1]}/Account/Generate-New-Jwt-Token`,
    {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain",
        "Content-Type": "application/json, charset=UTF-8",
      },
      body: formDataJsonString,
    }
  );
  if (!(response.status == "200")) {
    alert("Fail to refresh a new JWT Token, please try again!");
  } else {
    const result = await response.json();
    jwtToken = result.jwtToken;
    jwtExpirationTime = result.expirationTime;
    refreshToken = result.refreshToken;
    refreshExpirationTime = result.refreshTokenExpirationTime;
    localStorage.setItem("jwtToken", jwtToken);
    localStorage.setItem("jwtExpirationTime", jwtExpirationTime);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("refreshExpirationTime", refreshExpirationTime);
    alert("Successful refresh a new JWT Token");
    TimeoutDisplay(0, jwtExpirationTime);
  }
}

/* Function to handle the time-filter button click event  */
function TimeClickHandler() {
  $(".time-button").hide();
  $(".value-button").hide();
  $(".value-option-button-largest").hide();
  $(".value-option-button-smallest").hide();
  $(".none-button").hide();
  $(".clear-button").hide();
  $(".time-option-button-oldest").show();
  $(".time-option-button-latest").show();
  $(".back-button").show();
  timeFilterFlag = 1;
}

/* Function to handle the value-filter button click event  */
function ValueClickHandler() {
  $(".time-button").hide();
  $(".value-button").hide();
  $(".none-button").hide();
  $(".clear-button").hide();
  $(".value-option-button-largest").show();
  $(".value-option-button-smallest").show();
  $(".time-option-button-oldest").hide();
  $(".time-option-button-latest").hide();
  $(".back-button").show();
  dateFilterFlag = 1;
}

/* Function to handle the open-filter button click event  */
function FilterClickHandler() {
  if ($(".open-filter-button").text() == "Open Filter") {
    var audio = new Audio("./Audio/classic-click.mp3");
    audio.play();
    StartFilter();
  } else {
    var audio = new Audio("./Audio/Back-Sound.mp3");
    audio.play();
    $(".filter-table-div").fadeOut();
    $(".open-filter-button").text("Open Filter");
    $("table tr").remove(".value-rows");
  }
}

/* Function to handle the option button click event  */
function OptionClickHandler() {
  var audio = new Audio("./Audio/classic-click.mp3");
  audio.play();
  if ($(".option-button").text() == "Temperature") {
    $(".option-button").css("color", "rgb(30, 52, 220)");
    $(".option-button").text("Humidity");
    option = 1;
  } else {
    $(".option-button").css("color", "rgb(203, 29, 29)");
    $(".option-button").text("Temperature");
    option = 0;
  }
}

/* Function to open filter table  */
function StartFilter() {
  $(".filter-table-div").fadeIn();
  $(".open-filter-button").text("Close Filter");
  $(".filter-button").hide();
  $(".time-option-button-oldest").hide();
  $(".time-option-button-latest").hide();
  $(".value-option-button-largest").hide();
  $(".value-option-button-smallest").hide();
  $(".back-button").hide();
  $(".value-button").fadeIn();
  $(".time-button").fadeIn();
  $(".none-button").fadeIn();
  $(".clear-button").fadeIn();
}

/* Form-Data handler, return string of Json format */
function FormDataHandler() {
  // Form data
  const formData = new FormData();
  formData.append("email", "hoangnam.ho30@gmail.com");
  formData.append("password", "Nam@23012001");

  // Converting form data to a plain object
  const plainFormData = Object.fromEntries(formData.entries());

  // Converting plain object to a Json string
  formDataJsonString = JSON.stringify(plainFormData);
}

/* Function to clear text content of html element */
function ClearTextHtml(element) {
  for (let i = 0; i < element.length; i++) element[i].value = "";
}

/* Function to block table control */
function Block() {
  // Block some element until Login
  // Temperature control table
  $(".temperature-button").addClass("not-allow");
  $(".temperature-table").addClass("not-allow");
  $(".temperature-display-div").hide();
  $(".degrees-text").addClass("not-allow");
  $(".temperature-result").text("");

  // Hide Open-filter button
  $(".open-filter-button").hide();

  // Hide option button
  $(".option-button").hide();

  // Humidity control table
  $(".humidity-button").addClass("not-allow");
  $(".humidity-table").addClass("not-allow");
  $(".humidity-display-div").hide();
  $(".percents-text").addClass("not-allow");
  $(".humidity-result").text("");
}

/* Function to unlock table control */
function Unlock() {
  // Temperature control table
  $(".temperature-button").removeClass("not-allow");
  $(".temperature-table").removeClass("not-allow");
  $(".temperature-display-div").fadeIn();
  $(".degrees-text").removeClass("not-allow");

  // Show Open-filter button
  $(".open-filter-button").fadeIn();

  // Show option button
  $(".option-button").fadeIn();

  // Humidity control table
  $(".humidity-button").removeClass("not-allow");
  $(".humidity-table").removeClass("not-allow");
  $(".humidity-display-div").fadeIn();
  $(".percents-text").removeClass("not-allow");
}

/* Function to turn on/off the alarm */
function AlarmHandle(option) {
  if (option === "OFF") {
    /* Send command to ESP32 Web Server to turn off the buzzer */
    socket.send(`Alarm,OFF`);
  } else if (option === "ON") {
    /* Send command to ESP32 Web Server to turn on the buzzer */
    socket.send(`Alarm,ON`);
  }
}

/* Function to turn on/off the bulb */
function BulbHandle(option) {
  socket.send(`Bulb,${option}`);
}

/* Function to send backend IP address to esp32 */
function SendBackendIP(backendIp) {
  socket.send(`backendIP,${backendIp}:5200`);
}

/* Function to send/unsend temperature and humidty values from esp32 to webserver */
function SendHandle(option) {
  socket.send(`Webapi,${option}`);
}

/* Function to turn on realtime mode */
function RealtimeMode(status) { 
  socket.send(`Ws,${status}`);
}

/* Function to send the safe range of temperature to esp32 */
function TemperatureRange(lowest, highest) { 
  socket.send(`Range,Temp,${lowest},${highest}`);
}

/* Function to send the safe range of humidity to esp32 */
function HumidityRange(lowest, highest) { 
  socket.send(`Range,Humid,${lowest},${highest}`);
}

/* Websocket */
function WebsocketInit(esp32IP) {
  // Open websocket connection
  socket = new WebSocket(`ws://${esp32IP}/ws`); // websocket handle
  // Open connection handle
  socket.onopen = (event) => {
    console.log("WebSocket connection opened");
    alert("WebSocket connection opened");
    $(".ws-connect-button").hide();
    $(".ws-disconnect-button").fadeIn();
    $("#temperature-chart").fadeIn();
    $("#humidity-chart").fadeIn();
    RealtimeMode("ON");
  };
  // Listening the message from other devices
  socket.onmessage = (event) => {
    socketData = event.data.split(",");
    if (socketData[0] === "Succeeded") {
      $(".send-state").text("Sending");
      $(".send-button").hide();
      $(".stop-button").fadeIn();
    } else if (socketData[0] === "Failed") {
      $(".send-state").text("Send");
      $(".stop-button").hide();
      $(".send-button").fadeIn();
    }
      if (socketData[0] === "data") {
        $(".temperature-result").text(socketData[1]);
        realtimeTemperature = parseFloat(socketData[1]);
        $(".humidity-result").text(socketData[2]);
        realtimeHumidity = parseFloat(socketData[2]);
        if (socketData[3] === "1") {
          alarmStatus = "ON";
          $(".buzzer-state").text("ON");
        } else if (socketData[3] === "0") {
          alarmStatus = "OFF";
          $(".buzzer-state").text("OFF");
        }
        if (socketData[4] === "1") {
          bulbStatus = "ON";
          $(".bulb-state").text("ON");
        } else if (socketData[4] === "0") {
          bulbStatus = "OFF";
          $(".bulb-state").text("OFF");
        }
      }
    if (socketData[0] === "message") { 
      if (socketData[1] === "0") {
        alert("Failed to send the command. Please try again.");
      } else if (socketData[1] === "1") {
        alert("The command is sent successfully.");
      } else if (socketData[1] === "2") {
        alert("STM32F1 did not send data! Please check it.");
      }
    }
    // Handle incoming data from ESP32
  };
  // Connection close handle
  socket.onclose = (event) => {
    if (event.wasClean) {
      console.log("WebSocket connection closed cleanly");
      alert("WebSocket connection closed cleanly");
    } else {
      console.error("WebSocket connection abruptly closed");
      alert("WebSocket connection abruptly closed");
    }
    $(".ws-connect-button").fadeIn();
    $(".ws-disconnect-button").hide();
    $("#temperature-chart").hide();
    $("#humidity-chart").hide();
    socket.close(); 
    RealtimeMode("OFF");
    realtimeTemperature = null;
    realtimeHumidity = null;
  };
  // Connection error handle
  socket.onerror = (error) => {
    console.error("WebSocket error: " + error.message);
    alert("WebSocket error: " + error.message);
    $(".ws-connect-button").fadeIn();
    $(".ws-disconnect-button").hide();
    $("#temperature-chart").hide();
    $("#humidity-chart").hide();
    socket.close();
    RealtimeMode("OFF");
    realtimeTemperature = null;
    realtimeHumidity = null;
  };
}

// Temperature chart
function DrawTemperatureChart() {
  // create data object with default value
  let data = google.visualization.arrayToDataTable([
    ["Time", "Temperature"],
    [0, 0], 
  ]);

  // create options object with titles, colors, etc.
  let options = {
    color: ['red'],
    title: "Temperature",
    'width': 1200,
    'height': 300,
    hAxis: {
      title: "Time",
      textPosition: "none",
    },
    vAxis: {
      title: "Degree",
    },
  };

  // draw chart on load
  let chart = new google.visualization.LineChart(
    document.getElementById("temperature-chart")
  );
  chart.draw(data, options);
  // max amount of data rows that should be displayed
  let maxDatas = 100;
  // interval for adding new data every 250ms
  let index = 0;
  setInterval(function () {
    // instead of this random, you can make an ajax call for the current cpu usage or what ever data you want to display
    let temperature = realtimeTemperature;
    if (data.getNumberOfRows() > maxDatas) {
      data.removeRows(0, data.getNumberOfRows() - maxDatas);
    }
    data.addRow([index, temperature]);
    chart.draw(data, options);
    index++;
  }, 100);
}

// Humidity chart
function DrawHumidityChart() {
  // create data object with default value
  let data = google.visualization.arrayToDataTable([
    ["Time", "Humidity"],
    [0, 0], 
  ]);

  // create options object with titles, colors, etc.
  let options = {
    color: ['blue'],
    title: "Humidity",
    'width': 1200,
    'height': 300,
    hAxis: {
      title: "Time",
      textPosition: "none",
    },
    vAxis: {
      title: "Percent",
    },
  };

  // draw chart on load
  let chart = new google.visualization.LineChart(
    document.getElementById("humidity-chart")
  );
  chart.draw(data, options);
  // max amount of data rows that should be displayed
  let maxDatas = 100;
  // interval for adding new data every 250ms
  let index = 0;
  setInterval(function () {
    // instead of this random, you can make an ajax call for the current cpu usage or what ever data you want to display
    let humidity = realtimeHumidity;
    if (data.getNumberOfRows() > maxDatas) {
      data.removeRows(0, data.getNumberOfRows() - maxDatas);
    }
    data.addRow([index, humidity]);
    chart.draw(data, options);
    index++;
  }, 100);
}

// Temperature clock
function temperatureClock() {
  var data = google.visualization.arrayToDataTable([
    ["Label", "Value"],
    ["Temperature", 0],
  ]);

  var options = {
    max: 80,
    min: -40,
    height: 280,
    width: 1000,
    // greenFrom: 16,
    // greenTo: 40,
    minorTicks: 5,

  };

  var chart = new google.visualization.Gauge(
    document.getElementById("temperature-clock")
  );

  chart.draw(data, options);

  setInterval(function () {
    let temperature = realtimeTemperature;
    data.setValue(0, 1, temperature);
    chart.draw(data, options);
  }, 10);
}

// Humidity clock
function humidityClock() {
  var data = google.visualization.arrayToDataTable([
    ["Label", "Value"],
    ["Humidity", 0],
  ]);

  var options = {
    max: 100,
    min: 0,
    height: 280,
    width: 1000,
    // greenFrom: 30,
    // greenTo: 80,
    minorTicks: 5,
  };

  var chart = new google.visualization.Gauge(
    document.getElementById("humidity-clock")
  );

  chart.draw(data, options);

  setInterval(function () {
    let humidity = realtimeHumidity;
    data.setValue(0, 1, humidity);
    chart.draw(data, options);
  }, 10);
}

// Timeout display //
function TimeoutDisplay(option, token) { 
  const time = new Date(token);
  if (option === 0) // jwt token
  { 
    jwtTimeout = [
      time.getHours(),
      time.getMinutes(),
      time.getSeconds(),
      time.getDate(),
      time.getMonth() + 1, // Because getmonth() start from 0. You may want to have d1.getMonth() + 1 to achieve what you want
      time.getFullYear(),
    ];
    $(".token-timeout").text(
      `Expiration Time: ${jwtTimeout[3]}/${jwtTimeout[4]}/${jwtTimeout[5]}, ${jwtTimeout[0]}:${jwtTimeout[1]}`
    );
    return jwtTimeout;
  }
  else if (option === 1) // refresh token 
  {
    refreshTimeout = [
      time.getHours(),
      time.getMinutes(),
      time.getSeconds(),
      time.getDate(),
      time.getMonth() + 1, // Because getmonth() start from 0. You may want to have d1.getMonth() + 1 to achieve what you want
      time.getFullYear(),
    ];
    $(".token-timeout").text(
      `Expiration Time: ${refreshTimeout[3]}/${refreshTimeout[4]}/${refreshTimeout[5]}, ${refreshTimeout[0]}:${refreshTimeout[1]}`
    );
    return refreshTimeout;
   }
}

// Function to export table into excel file
function exportTableToExcel(tableID, filename = "") {
  var downloadLink;
  var dataType = "application/vnd.ms-excel";
  var tableSelect = document.getElementById(tableID);
  var tableHTML = tableSelect.outerHTML.replace(/ /g, "%20");

  // Specify file name
  filename = filename ? filename + ".xls" : "excel_data.xls";

  // Create download link element
  downloadLink = document.createElement("a");

  document.body.appendChild(downloadLink);

  if (navigator.msSaveOrOpenBlob) {
    var blob = new Blob(["\ufeff", tableHTML], {
      type: dataType,
    });
    navigator.msSaveOrOpenBlob(blob, filename);
  } else {
    // Create a link to the file
    downloadLink.href = "data:" + dataType + ", " + tableHTML;

    // Setting the file name
    downloadLink.download = filename;

    //triggering the function
    downloadLink.click();
  }
}

// Fucntion to update status of bulb and alarm mode
function UpdateStatus() {
  /* Send command to ESP32 Web Server to update the status of the bulb and alarm mode */
  socket.send(`Update,0`);
}
