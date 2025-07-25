var glob_users_name = "";
const officeCodeField = document.getElementById("office-code");
const officeGridX = document.getElementById("office-grid-x");
const officeGridY = document.getElementById("office-grid-y");

const getLocationButton = document.getElementById("get-location-button");
const playButton = document.getElementById("play-button");
const pauseButton = document.getElementById("pause-button");
const stopButton = document.getElementById("stop-button");

const needle = document.getElementById("needle");

const voiceWebBrowser = document.getElementById("voice-web-browser");
const voiceElevenLabs = document.getElementById("voice-elevenlabs");
const elevenlabsUsage = document.getElementById("elevenlabs-usage");
const voiceOpenAI = document.getElementById("voice-openai");
const voiceResemble = document.getElementById("voice-resemble");

const tuneInBulb = document.getElementById("tune-in-bulb");
const elevenLabsBulb = document.getElementById("eleven-labs-status-bulb");
const openaiStatusBulb = document.getElementById("openai-status-bulb");
const resembleStatusBulb = document.getElementById("resemble-status-bulb");

const cleanForecastLineNumbers = document.getElementById(
  "clean-forecast-content-line-numbers",
);
const cleanForecastContent = document.getElementById("clean-forecast-content");
const rawForecastContent = document.getElementById("raw-forecast-content");
const errorMessageBox = document.getElementById("error-message-box");

let speechSynth = window.speechSynthesis;
let speechUtterance = null;

var globalAudio = null;

let whiteNoiseAudioCtx = new (window.AudioContext ||
  window.webkitAudioContext)();
let whiteNoiseSource = null;
let whiteNoiseGainNode = null;
let whiteNoiseFilter = null;
let whiteNoiseInitialized = false;
let whiteNoiseBuffer = null;

// Initialize white noise buffer immediately
initializeWhiteNoise(30);

// Misc other manual replacements for better speech
const jargon_replacements = {
  "\n\nSYNOPSIS...\n": "",
  "\nUPDATE...\n": "",
  Pac: "Pacific",
  PacificNW: "the pacific north west",
  NWS: "National Weather Service",
  PoP: "Probability of Precipitation",
  "%": " percent",
  temps: "temperatures",
  "t-storms": "thunderstorms",
  Rh: "relative humidity",
  RH: "relative humidity",
  NorCal: "Northern California",
  mph: "miles per hour",
  // "0\\.25": "a quarter",
  // "0\\.5": "a half",
};

/**
String and message utils
**/

// Function to convert US state abbreviations to full names
function stateAbbrToFullName(text) {
  const stateMap = {
    AL: "Alabama",
    AK: "Alaska",
    AZ: "Arizona",
    AR: "Arkansas",
    CA: "California",
    CO: "Colorado",
    CT: "Connecticut",
    DE: "Delaware",
    FL: "Florida",
    GA: "Georgia",
    HI: "Hawaii",
    ID: "Idaho",
    IL: "Illinois",
    IN: "Indiana",
    IA: "Iowa",
    KS: "Kansas",
    KY: "Kentucky",
    LA: "Louisiana",
    ME: "Maine",
    MD: "Maryland",
    MA: "Massachusetts",
    MI: "Michigan",
    MN: "Minnesota",
    MS: "Mississippi",
    MO: "Missouri",
    MT: "Montana",
    NE: "Nebraska",
    NV: "Nevada",
    NH: "New Hampshire",
    NJ: "New Jersey",
    NM: "New Mexico",
    NY: "New York",
    NC: "North Carolina",
    ND: "North Dakota",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon",
    PA: "Pennsylvania",
    RI: "Rhode Island",
    SC: "South Carolina",
    SD: "South Dakota",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VT: "Vermont",
    VA: "Virginia",
    WA: "Washington",
    WV: "West Virginia",
    WI: "Wisconsin",
    WY: "Wyoming",
    DC: "District of Columbia",
    PR: "Puerto Rico",
    VI: "Virgin Islands",
    GU: "Guam",
    AS: "American Samoa",
    MP: "Northern Mariana Islands",
  };

  return text.replace(
    /\b([A-Z]{2})\b/g,
    (match, abbr) => stateMap[abbr] || match,
  );
}

// Function to remove US timezone abbreviations
function timezoneAbbrToNothing(text) {
  // List of common timezone abbreviations to remove
  const timezoneAbbrs = [
    "EST",
    "EDT",
    "CST",
    "CDT",
    "MST",
    "MDT",
    "PST",
    "PDT",
    "AKST",
    "AKDT",
    "HST",
    "HDT",
    "AEST",
    "AEDT",
    "UTC",
    "GMT",
  ];

  // Create regex pattern from timezone abbreviations
  const pattern = new RegExp("\\b(" + timezoneAbbrs.join(" |") + ")\\b", "g");

  // Remove timezone abbreviations (replace with empty string)
  return text.replace(pattern, "");
}

function numberToWords(n) {
  const ones = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
  ];
  const teens = [
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty"];

  if (n < 10) return ones[n];
  if (n < 20) return teens[n - 10];
  return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
}

function numberToOrdinal(n) {
  const ordinals = {
    1: "first",
    2: "second",
    3: "third",
    4: "fourth",
    5: "fifth",
    6: "sixth",
    7: "seventh",
    8: "eighth",
    9: "ninth",
    10: "tenth",
    11: "eleventh",
    12: "twelfth",
    13: "thirteenth",
    14: "fourteenth",
    15: "fifteenth",
    16: "sixteenth",
    17: "seventeenth",
    18: "eighteenth",
    19: "nineteenth",
    20: "twentieth",
    21: "twenty first",
    22: "twenty second",
    23: "twenty third",
    24: "twenty fourth",
    25: "twenty fifth",
    26: "twenty sixth",
    27: "twenty seventh",
    28: "twenty eighth",
    29: "twenty ninth",
    30: "thirtieth",
    31: "thirty first",
  };
  return ordinals[n] || n.toString();
}

function dateToWords(dateInput) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const parseDate = (input) => {
    if (input instanceof Date) return input;

    if (typeof input === "string") {
      const normalizedInput = input.replace(
        /\b(\d{1,2})(\d{2})\s*([AP]M)\b/gi,
        "$1:$2 $3",
      );

      let date = new Date(normalizedInput);
      if (!isNaN(date)) return date;

      const match = normalizedInput.match(
        /(\d{1,2}):(\d{2})\s*([AP]M)\s+([A-Z]+)\s+(\w{3})\s+(\w{3})\s+(\d{1,2})\s+(\d{4})/,
      );
      if (match) {
        const [, hours, minutes, ampm, tz, dow, monthShort, day, year] = match;
        const monthShortToIndex = {
          Jan: 0,
          Feb: 1,
          Mar: 2,
          Apr: 3,
          May: 4,
          Jun: 5,
          Jul: 6,
          Aug: 7,
          Sep: 8,
          Oct: 9,
          Nov: 10,
          Dec: 11,
        };

        const monthNum = monthShortToIndex[monthShort];
        if (monthNum !== undefined) {
          const h24 =
            ampm === "PM" && hours !== "12"
              ? +hours + 12
              : ampm === "AM" && hours === "12"
                ? 0
                : +hours;
          return new Date(year, monthNum, +day, h24, +minutes);
        }
      }
    }

    return new Date();
  };

  let date = parseDate(dateInput);
  if (!date || isNaN(date.getTime())) date = new Date();

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "P.M." : "A.M.";
  const hour12 = hours % 12 || 12;

  const hourInWords = numberToWords(hour12);
  const minuteInWords =
    minutes === 0
      ? "o'clock"
      : minutes < 10
        ? `o' ${numberToWords(minutes)}`
        : numberToWords(minutes);

  const dayName = dayNames[date.getDay()];
  const monthName = monthNames[date.getMonth()];
  const dayOfMonth = date.getDate();
  const dayInWords = numberToOrdinal(dayOfMonth);

  return `${hourInWords} ${minuteInWords} ${period}, ${dayName} ${monthName} ${dayInWords}`;
}

// Function to get appropriate greeting based on time
function getTimeBasedGreetingPhrase(date = new Date()) {
  const hours = date.getHours();

  if (hours > 3 && hours < 11) {
    return "Good morning";
  } else if (hours > 12 && hours < 18) {
    return "Good afternoon";
  } else if (hours > 18) {
    return "Good evening";
  } else {
    return "Hello";
  }
}

function extractUniqueNames(text) {
  const names = [...text.matchAll(/\.\.+([^\n]+)/g)].map((m) => m[1].trim());
  const unique = [...new Set(names)];

  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return unique.join(" and ");
  return unique.slice(0, -1).join(", ") + ", and " + unique.at(-1);
}

function makeGreetingText() {
  var greetingText = "";

  // manually do the summary since it's format is a bit different
  const now = new Date();
  const greetingWords = getTimeBasedGreetingPhrase(now);

  if (glob_users_name) {
    greetingText += `${greetingWords}, ${glob_users_name}! `;
  } else {
    greetingText += `${greetingWords}! `;
  }

  greetingText += `It is ${dateToWords(now)}. `;

  greetingText += "\n\n";

  if (false) {
    greetingText += `Random number is: ${Math.floor(Math.random() * 1000)}`;
  }

  return greetingText;
}

// Function to clean up the text
function makeTextSpeakable(rawAFDText, nextGridForecast) {
  var newText = "";

  // TODO: split this out so:
  // - cache can be used when just the time in the greeting changes
  // and so this can be played while loading the longer text
  // I started to implement, but was fighting global audio overwrite,
  // I think it's gonna need a little rearch for audio queing or something.
  newText += makeGreetingText();

  ///////////////////////
  // local forcast (if grid location given)

  if (nextGridForecast != null) {
    newText += `Locally ${nextGridForecast.name.toLowerCase()}: ${nextGridForecast.detailedForecast}`;
    newText += "\n\n";
  }

  ///////////////////////

  // split into sections (by &&)

  const mainAndFooter = rawAFDText.split("\n$$\n");

  var sections = mainAndFooter[0].split(/(?=\n\.)/);

  const summarySectionSplit = sections[0].split("\n\n");
  // remove the weird meta data sections now that I got the time stuff
  sections[0] = "";

  const summarySectionProductAndLocationAndTimeSplit =
    summarySectionSplit[1].split("\n");

  // lower case makes TTS read it better
  newText += summarySectionProductAndLocationAndTimeSplit[0].replace(
    "Area Forecast Discussion",
    "Here's the area forecast discussion from the",
  );

  newText += stateAbbrToFullName(
    summarySectionProductAndLocationAndTimeSplit[1],
  ).replace("National Weather Service", "");

  newText +=
    " office, issued at " +
    dateToWords(summarySectionProductAndLocationAndTimeSplit[2]) +
    ", by " +
    extractUniqueNames(mainAndFooter[1]) +
    ".\n";

  // finaly put all the sections back,
  // select which ones
  for (section in sections) {
    // newText += "\n++++++++++++++++++++++++++++\n";

    const sectionText = sections[section]
      .replace("\n&&\n", "")
      .replace("&&", "");

    const ignoreShortTerm =
      document.getElementById("ignore-short-term").checked &&
      /\n\.SHORT TERM\b/i.test(sectionText);
    const ignoreLongTerm =
      document.getElementById("ignore-long-term").checked &&
      /\n\.LONG TERM\b/i.test(sectionText);
    const ignoreMarine =
      document.getElementById("ignore-marine").checked &&
      /\n\.MARINE\b/i.test(sectionText);
    const ignoreAviation =
      document.getElementById("ignore-aviation").checked &&
      /\n\.AVIATION\b/i.test(sectionText);

    const ignorePreliminaryPoint =
      document.getElementById("ignore-preliminary-point").checked &&
      /\n\.PRELIMINARY POINT\b/i.test(sectionText);

    // NOTE: this one's regex diverges from others
    const ignoreWatches =
      document.getElementById("ignore-watches").checked &&
      /\n\.(.*?)WATCHES(.*?)\.\.\./i.test(sectionText);

    const ignoreSection =
      ignoreShortTerm ||
      ignoreLongTerm ||
      ignoreMarine ||
      ignoreAviation ||
      ignoreWatches ||
      ignorePreliminaryPoint;

    if (!ignoreSection) {
      newText += sectionText;
    }
  } // end: for (section in sections)

  newText = stateAbbrToFullName(newText);

  newText = newText

    // Remove period when it's a newline followed by a period
    .replace(/\n\./g, "\n")

    // replacing when lines start with things not to be spoken
    .replace(/^Issued at.*\n/gm, "")
    .replace(/^\.{2}New.*\n/gm, "")
    .replace(/^Key Messages\n\n/gm, "")

    // remove since I don't want to convert to speakable inline like this
    .replace(/^Updated at.*\n/gm, "")

    // clean up ranges (e.g. 5-6 becomes 5 to 6)
    .replace(/(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)/g, "$1 to $2")

    // spell out inches
    .replace(/(\d+)\s*"/g, "$1 inches")

    // NWS does backtick for quote for some reason, fix that
    .replace(/`/g, "'")

    // newline (NWS 'manual' wrapping) cleanup
    // Keeps \n if: (1) It's part of "\n\n" or (2) The next line starts with "-"
    .replace(/(?<!\n)\n(?!\n|-)/g, " ")
    // remove double spaces betwen words
    .replace(/ {2,}/g, " ")

    // add a space after the dash bullet
    .replace(/^-/gm, "- ")

    .replace(/\s+$/g, ""); // trim end of entire string

  // Iterate over the replacements dictionary and replace each key with its value
  for (const [key, value] of Object.entries(jargon_replacements)) {
    newText = newText.replace(new RegExp(key, "g"), value);
  }

  return newText;
}

/**
 *
 * Weather
 *
 **/

async function fetchWeather() {
  // console.log(`Office code: ${officeCodeField.value}`);

  // do a little dance
  // needle.style.left = `${Math.random() * 10}%`;
  needle.classList.add("loading");

  // reset stuff
  tuneInBulb.classList.remove("error");
  cleanForecastContent.textContent = "";
  cleanForecastLineNumbers.textContent = `${cleanForecastContent.textContent.length}`;

  // update the URL so if user refreshes it stays in field
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set("office", officeCodeField.value);
  urlParams.set("x", officeGridX.value);
  urlParams.set("y", officeGridY.value);
  const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
  window.history.replaceState(null, "", newUrl);

  // // //

  errorMessageBox.style.display = "none";

  const afdUrl = `https://api.weather.gov/products/types/AFD/locations/${officeCodeField.value}/latest`;
  const gridX = officeGridX.value;
  const gridY = officeGridY.value;

  const doingGridForecast = gridX && gridY;
  const gridForecastUrl = doingGridForecast
    ? `https://api.weather.gov/gridpoints/${officeCodeField.value}/${gridX},${gridY}/forecast`
    : null;

  console.log("NWS API URL for AFD:", afdUrl);
  if (doingGridForecast) {
    console.log("NWS API URL for local grid forecast:", gridForecastUrl);
  }

  const afdResp = await fetch(afdUrl);
  const afdObj = await afdResp.json();

  let gridForecastResp = null;
  let gridForcastObj = null;

  if (doingGridForecast) {
    try {
      gridForecastResp = await fetch(gridForecastUrl);
      gridForcastObj = await gridForecastResp.json();
    } catch (e) {
      console.warn("Grid forecast fetch failed:", e);
      gridForcastObj = null;
    }
  }

  // // //

  const nextGridForecast = gridForcastObj?.properties?.periods?.[0] || null;

  rawAFDText = afdObj.productText;

  if (rawAFDText.trim() === "") {
    tuneInBulb.classList.add("error");
    // throw new Error("Could not find forecast discussion text");
  }

  if (!rawAFDText.includes("AFD")) {
    tuneInBulb.classList.add("error");
    // throw new Error("Did not find 'AFD' in returned string.");
  }

  rawForecastContent.textContent = rawAFDText;

  // Clean up the text
  cleanForecastContent.textContent = makeTextSpeakable(
    rawAFDText,
    nextGridForecast,
  );
  cleanForecastLineNumbers.textContent = `${cleanForecastContent.textContent.length}`;

  // Update status UI
  tuneInBulb.classList.add("on");

  needle.classList.remove("loading");
}

/**
 *
 * Audio stuff
 *
 **/

function setupAudioAnalyser(audioEl) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const source = ctx.createMediaElementSource(audioEl);
  const analyser = ctx.createAnalyser();

  analyser.fftSize = 256;
  source.connect(analyser);
  analyser.connect(ctx.destination);

  return { ctx, analyser };
}

function startSpeakerAnimation(analyser, el) {
  const data = new Uint8Array(analyser.frequencyBinCount);
  const movementGain = 0.2;

  function frame() {
    analyser.getByteFrequencyData(data);
    const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
    const scale = 1 + (avg / 256 - 0.0) * movementGain;
    el.style.transform = `scale(${scale.toFixed(2)})`;
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function playURLAudio(audioUrl) {
  if (globalAudio) {
    if (!globalAudio.paused && !globalAudio.ended) {
      // Already playing — do nothing
      return;
    }

    if (globalAudio.ended) {
      globalAudio.currentTime = 0;
    }

    // In Chrome, play() returns a Promise
    const playPromise = globalAudio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("Audio playback started successfully");
        })
        .catch((error) => {
          console.error("Audio playback error:", error);
          // Show a play button overlay when autoplay is blocked
          showError(
            "Audio playback was blocked by your browser. Please click the play button again.",
          );
        });
    }

    return;
  }

  globalAudio = new Audio(audioUrl);
  const { analyser, ctx } = setupAudioAnalyser(globalAudio);

  globalAudio.addEventListener("timeupdate", () => {
    if (globalAudio && globalAudio.duration > 0) {
      if (globalAudio.currentTime > 1) {
        stopWhiteNoise(1);
      }

      const percent = (globalAudio.currentTime / globalAudio.duration) * 100;
      // console.log(`Played: ${percent.toFixed(2)}%`);

      needle.style.left = percent + "%";

      if (globalAudio.currentTime >= globalAudio.duration) {
        // Finished playing
        stopButtonAction();
      }
    }
  });

  // In Chrome, play() returns a Promise
  const playPromise = globalAudio.play();

  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        console.log("Audio playback started successfully");

        ctx.resume();
        startSpeakerAnimation(
          analyser,
          document.getElementById("radio-speaker"),
        );
      })
      .catch((error) => {
        console.error("Audio playback error:", error);
        // Show a play button overlay when autoplay is blocked
        showError(
          "Audio playback was blocked by your browser. Please click the play button again.",
        );
      });
  }
}

function soundEffectButtonClick() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const duration = 0.02; // seconds
  const bufferSize = ctx.sampleRate * duration * 10;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    const decay = Math.pow(1 - i / bufferSize, 3); // smoother decay
    data[i] = (Math.random() * 2 - 1) * decay;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  gain.gain.setValueAtTime(1, ctx.currentTime + duration + 0.07);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + duration + 0.07 + duration,
  );

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 0.7;
  filter.frequency.setValueAtTime(2000, ctx.currentTime);
  filter.frequency.setValueAtTime(1000, ctx.currentTime + duration + 0.07);

  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
}

function initializeWhiteNoise(duration = 30) {
  // Reset audio context if needed
  if (whiteNoiseAudioCtx === null) {
    whiteNoiseAudioCtx = new (window.AudioContext ||
      window.webkitAudioContext)();
  }

  whiteNoiseInitialized = true;

  // Create noise buffer if it doesn't exist yet
  if (!whiteNoiseBuffer) {
    const bufferSize = duration * whiteNoiseAudioCtx.sampleRate;
    whiteNoiseBuffer = whiteNoiseAudioCtx.createBuffer(
      1,
      bufferSize,
      whiteNoiseAudioCtx.sampleRate,
    );
    const output = whiteNoiseBuffer.getChannelData(0);

    // Generate white noise with occasional bursts
    let i = 0;
    while (i < bufferSize) {
      output[i] = Math.random() * 2 - 1;

      if (Math.random() < 0.001) {
        const burstLength = 500 + Math.floor(Math.random() * 1000);
        const burstAmplitude = 0.5 + Math.random() * 0.5;
        for (let j = 0; j < burstLength && i + j < bufferSize; j++) {
          output[i + j] = (Math.random() * 2 - 1) * burstAmplitude;
        }
        i += burstLength;
      } else {
        i++;
      }
    }
  }

  // Create and configure filter if it doesn't exist
  if (!whiteNoiseFilter) {
    whiteNoiseFilter = whiteNoiseAudioCtx.createBiquadFilter();
    whiteNoiseFilter.type = "lowpass";
    whiteNoiseFilter.Q.value = 0.7;
  }

  // Create and configure gain node if it doesn't exist
  if (!whiteNoiseGainNode) {
    whiteNoiseGainNode = whiteNoiseAudioCtx.createGain();
    whiteNoiseGainNode.gain.value = 0; // Start silent
    whiteNoiseGainNode.connect(whiteNoiseAudioCtx.destination);
    whiteNoiseFilter.connect(whiteNoiseGainNode);
  }

  // Create a new source node
  createWhiteNoiseSource();

  return whiteNoiseSource;
}

function createWhiteNoiseSource() {
  // Create and configure white noise source
  whiteNoiseSource = whiteNoiseAudioCtx.createBufferSource();
  whiteNoiseSource.buffer = whiteNoiseBuffer;
  whiteNoiseSource.loop = true; // Enable looping for continuous playback
  whiteNoiseSource.isPlaying = false;
  whiteNoiseSource.connect(whiteNoiseFilter);

  return whiteNoiseSource;
}

function playWhiteNoise(effectDuration = 10) {
  // Initialize if not already initialized
  if (
    !whiteNoiseInitialized ||
    whiteNoiseAudioCtx === null ||
    whiteNoiseBuffer === null
  ) {
    initializeWhiteNoise(Math.max(effectDuration, 30)); // Create at least 30 seconds of noise
  }

  // Stop any currently playing source
  if (whiteNoiseSource && whiteNoiseSource.isPlaying) {
    stopWhiteNoise(0);
  }

  // Always create a fresh source node
  createWhiteNoiseSource();

  // Constants for gain control
  const MAX_GAIN = 0.1;
  const ZERO_GAIN = 0.001;
  const now = whiteNoiseAudioCtx.currentTime;

  // Configure gain envelope
  whiteNoiseGainNode.gain.cancelScheduledValues(now);
  whiteNoiseGainNode.gain.setValueAtTime(ZERO_GAIN, now);
  whiteNoiseGainNode.gain.linearRampToValueAtTime(
    MAX_GAIN,
    now + (effectDuration / 10) * 1,
  );
  whiteNoiseGainNode.gain.linearRampToValueAtTime(
    MAX_GAIN / 4,
    now + (effectDuration / 10) * 2,
  );
  whiteNoiseGainNode.gain.linearRampToValueAtTime(
    MAX_GAIN,
    now + (effectDuration / 10) * 3,
  );

  // Configure filter envelope
  whiteNoiseFilter.frequency.cancelScheduledValues(now);
  whiteNoiseFilter.frequency.setValueAtTime(4000, now);
  whiteNoiseFilter.frequency.linearRampToValueAtTime(
    1000,
    now + effectDuration * 0.6,
  );

  // Start the noise
  whiteNoiseSource.start(now);
  whiteNoiseSource.isPlaying = true;
}

function stopWhiteNoise(fadeOutDuration = 0) {
  if (
    !whiteNoiseInitialized ||
    whiteNoiseAudioCtx === null ||
    whiteNoiseSource === null ||
    !whiteNoiseSource.isPlaying
  ) {
    return;
  }

  if (fadeOutDuration > 0) {
    // Fade out, then stop
    const now = whiteNoiseAudioCtx.currentTime;
    whiteNoiseGainNode.gain.cancelScheduledValues(now);
    whiteNoiseGainNode.gain.setValueAtTime(whiteNoiseGainNode.gain.value, now);
    whiteNoiseGainNode.gain.linearRampToValueAtTime(
      0.001,
      now + fadeOutDuration,
    );

    // Store reference to the current source
    const currentSource = whiteNoiseSource;
    currentSource.isPlaying = false;

    // Stop the source after fade out
    setTimeout(() => {
      try {
        currentSource.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
    }, fadeOutDuration * 1000);
  } else {
    // Stop immediately
    try {
      whiteNoiseSource.stop();
    } catch (e) {
      // Ignore errors if already stopped
    }
    whiteNoiseSource.isPlaying = false;
    // Reset the gain immediately to avoid click on next play
    whiteNoiseGainNode.gain.cancelScheduledValues(
      whiteNoiseAudioCtx.currentTime,
    );
    whiteNoiseGainNode.gain.setValueAtTime(0, whiteNoiseAudioCtx.currentTime);
  }
}

/**
 *
 * Speaking stuff
 *
 **/

function updateElevenLabsUsage() {
  elevenLabsBulb.classList.remove("error");

  const apiKey = getElevenLabsApiKeyFromStorage();

  if (!apiKey) {
    elevenLabsBulb.classList.add("error");
    console.log("No ElevenLabs API Key");
    return;
  }

  elevenLabsBulb.classList.add("loading");

  fetch("https://api.elevenlabs.io/v1/user", {
    method: "GET",
    headers: {
      "xi-api-key": apiKey,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
        console.log(response.json());
        elevenLabsBulb.classList.add("error");
      }
      return response.json();
    })
    .then((data) => {
      elevenLabsBulb.classList.remove("loading");
      elevenLabsBulb.classList.add("on");

      const charUsed = data.subscription.character_count;
      const charLimit = data.subscription.character_limit;
      const percentUsed = (charUsed / charLimit) * 100;

      glob_users_name = data.first_name;

      console.log(`ElevenLabs: ${percentUsed.toFixed(2)}% used`);

      fetchWeather();
    })
    .catch((error) => {
      elevenLabsBulb.classList.add("error");
      console.error("Error with ElevenLabs API:", error);
      showError(`Error: ${error.message}`);
    });
}

// Function to use ElevenLabs for text-to-speech
async function speakWithElevenLabs(text) {
  if (globalAudio) {
    return null;
  }

  // Check if we have saved audio for this text
  const savedBlob = await loadAudioFromStorageCache(text, "elevenlabs-cache");
  if (savedBlob) {
    const audioUrl = URL.createObjectURL(savedBlob);
    console.log("Using saved audio:", audioUrl);
    return audioUrl;
  }

  const apiKey = document.getElementById("elevenlabs-api-key").value;

  const voiceId = document.getElementById("elevenlabs-voice").value;

  if (!apiKey) {
    showError("Please enter your ElevenLabs API key");
    return null;
  }

  if (!voiceId) {
    showError("Please enter a ElevenLabs voice ID");
    return null;
  }

  updateElevenLabsUsage();

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const headers = {
    Accept: "audio/mpeg",
    "Content-Type": "application/json",
    "xi-api-key": apiKey,
  };

  const body = JSON.stringify({
    text: text,
    model_id: "eleven_turbo_v2_5", // this is the cheaper one
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.5,
      // speed: 1.25,
    },
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: body,
    });

    if (!response.ok) {
      console.log(response);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    updateElevenLabsUsage();
    const blob = await response.blob();
    saveAudioToStorageCache(text, blob, "elevenlabs-cache");

    const audioUrl = URL.createObjectURL(blob);
    console.log(`ElevenLabs Resp Blob: ${blob}`);
    console.log(`ElevenLabs Resp URL: ${audioUrl}`);

    return audioUrl;
  } catch (error) {
    console.error("Error with ElevenLabs API:", error);
    showError(`ElevenLabs TTS error: ${error.message}`);

    needle.classList.remove("loading");
    elevenLabsBulb.classList.add("error");
    elevenLabsBulb.classList.remove("on");
    elevenLabsBulb.classList.remove("loading");

    return null;
  }
}

async function speakWithOpenAI(text) {
  if (globalAudio) {
    return null;
  }

  const savedBlob = await loadAudioFromStorageCache(text, "openai-cache");
  if (savedBlob) {
    const audioUrl = URL.createObjectURL(savedBlob);
    console.log("Using saved audio:", audioUrl);
    playURLAudio(audioUrl);
    openaiStatusBulb.classList.add("on");
    return;
  }

  const apiKey = getOpenAIApiKeyFromStorage();
  if (!apiKey) {
    showError(
      "OpenAI API key not found. Please enter your API key in the settings.",
    );
    openaiStatusBulb.classList.add("error");
    return;
  }

  openaiStatusBulb.classList.remove("error");
  openaiStatusBulb.classList.add("loading");
  needle.classList.add("loading");

  // TODO: right now one request maximum is 4096 chars
  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        input: text,
        instructions:
          "Voice: Deep public radio host. Clean, cool, and consistent, but not monotone. Personality: Be engaging and show personal interest in the topic. Explain 'why', not just 'what'. Speed: Keep a slightly faster than normal pace, do not drag. Finish sentences at little faster. Pronunciation: Words should be pronounced clearly, especially technical ones. Some of the technical terms are several words and should flow together.",
        voice: "verse",
        speed: 1,
      }),
    });

    if (!response.ok) {
      console.log(response);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    console.log("OpenAI: response okay.");
    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);

    console.log(`OpenAI Resp Blob: ${blob}`);
    console.log(`OpenAI Resp URL: ${audioUrl}`);

    await saveAudioToStorageCache(text, blob, "openai-cache");

    return audioUrl;
  } catch (error) {
    console.error("OpenAI TTS error:", error);
    showError(`OpenAI TTS error: ${error.message}`);

    openaiStatusBulb.classList.add("error");
    openaiStatusBulb.classList.remove("on");
    return null;
  } finally {
    openaiStatusBulb.classList.remove("loading");
    needle.classList.remove("loading");
    openaiStatusBulb.classList.add("on");
  }
}

async function speakWithResemble(text) {
  if (globalAudio) {
    return null;
  }

  const savedBlob = await loadAudioFromStorageCache(text, "resemble-cache");
  if (savedBlob) {
    const audioUrl = URL.createObjectURL(savedBlob);
    console.log("Using saved audio from cache:", audioUrl);
    resembleStatusBulb.classList.add("on");
    return audioUrl; // Return URL instead of playing directly
  }

  const apiKey = getResembleApiKeyFromStorage();
  const voiceUUID = getResembleVoiceUUIDFromStorage();

  if (!apiKey) {
    showError(
      "Resemble API Token not found. Please enter your API Token in the settings.",
    );
    resembleStatusBulb.classList.add("error");
    return;
  }

  if (!voiceUUID) {
    console.log("Using default Resemble Voice UUID: f4da4639");
    // Continue with default UUID
  }

  resembleStatusBulb.classList.remove("error");
  resembleStatusBulb.classList.add("loading");
  needle.classList.add("loading");

  // TODO: right now one request maximum is 3000 chars
  try {
    // Use the correct /synthesize endpoint
    const synthesizeResponse = await fetch(
      "https://f.cluster.resemble.ai/synthesize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Accept-Encoding": "gzip, deflate, br",
        },
        body: JSON.stringify({
          voice_uuid: voiceUUID || "f4da4639",
          data: text,
          output_format: "mp3",
          title: "NSW Weather Forecast",
        }),
      },
    );

    if (!synthesizeResponse.ok) {
      console.log(synthesizeResponse);
      throw new Error(`Resemble API error: ${synthesizeResponse.status}`);
    }

    // Parse the JSON response which contains base64-encoded audio
    const responseData = await synthesizeResponse.json();

    if (!responseData.success) {
      throw new Error(
        `Resemble synthesis failed: ${responseData.issues?.join(", ") || "Unknown error"}`,
      );
    }

    console.log("Resemble response:", responseData);

    // Convert base64 audio_content to a binary Blob
    const binaryString = atob(responseData.audio_content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create a blob with the appropriate MIME type
    const mimeType =
      responseData.output_format === "mp3" ? "audio/mpeg" : "audio/wav";
    const blob = new Blob([bytes], { type: mimeType });
    const audioUrl = URL.createObjectURL(blob);

    console.log(`Resemble audio duration: ${responseData.duration} seconds`);
    console.log(`Resemble audio URL: ${audioUrl}`);

    await saveAudioToStorageCache(text, blob, "resemble-cache");

    return audioUrl;
  } catch (error) {
    console.error("Resemble TTS error:", error);
    showError(`Resemble TTS error: ${error.message}`);

    resembleStatusBulb.classList.add("error");
    resembleStatusBulb.classList.remove("on");
    return null;
  } finally {
    needle.classList.remove("loading");
    resembleStatusBulb.classList.remove("loading");
    resembleStatusBulb.classList.add("on");
  }
}

/**
 *
 * Storage
 *
 **/

function saveIgnoreSectionsToStorage() {
  const ignoreSections = {
    shortTerm: document.getElementById("ignore-short-term").checked,
    longTerm: document.getElementById("ignore-long-term").checked,
    marine: document.getElementById("ignore-marine").checked,
    aviation: document.getElementById("ignore-aviation").checked,
    watches: document.getElementById("ignore-watches").checked,
    preliminaryPoint: document.getElementById("ignore-preliminary-point")
      .checked,
  };
  localStorage.setItem("ignoreSections", JSON.stringify(ignoreSections));
}

function loadIgnoreSectionsFromStorage() {
  const storedIgnoreSections = localStorage.getItem("ignoreSections");
  if (storedIgnoreSections) {
    try {
      const ignoreSections = JSON.parse(storedIgnoreSections);
      document.getElementById("ignore-short-term").checked =
        ignoreSections.shortTerm !== undefined
          ? ignoreSections.shortTerm
          : true;
      document.getElementById("ignore-long-term").checked =
        ignoreSections.longTerm !== undefined ? ignoreSections.longTerm : false;
      document.getElementById("ignore-marine").checked =
        ignoreSections.marine !== undefined ? ignoreSections.marine : false;
      document.getElementById("ignore-aviation").checked =
        ignoreSections.aviation !== undefined ? ignoreSections.aviation : true;
      document.getElementById("ignore-watches").checked =
        ignoreSections.watches !== undefined ? ignoreSections.watches : true;
      document.getElementById("ignore-preliminary-point").checked =
        ignoreSections.preliminaryPoint !== undefined
          ? ignoreSections.preliminaryPoint
          : false;
    } catch (e) {
      console.log("Error loading ignore sections from storage:", e);
    }
  }
}

function saveElevenLabsApiKeyToStorage() {
  const apiKey = document.getElementById("elevenlabs-api-key").value;
  localStorage.setItem("elevenlabsApiKey", apiKey);
  updateElevenLabsUsage();
}

function getElevenLabsApiKeyFromStorage() {
  const apiKey = localStorage.getItem("elevenlabsApiKey");
  if (apiKey) {
    document.getElementById("elevenlabs-api-key").value = apiKey;
    return apiKey;
  }
  return null;
}

function saveOpenAIApiKeyToStorage() {
  const apiKey = document.getElementById("openai-api-key").value;
  localStorage.setItem("openaiApiKey", apiKey);
  updateElevenLabsUsage();
}

function saveResembleApiKeyToStorage() {
  const apiKey = document.getElementById("resemble-api-key").value;
  localStorage.setItem("resembleApiKey", apiKey);
}

function saveResembleVoiceUUIDToStorage() {
  const voiceUUID = document.getElementById("resemble-voice-uuid").value;
  localStorage.setItem("resembleVoiceUUID", voiceUUID);
}

function getOpenAIApiKeyFromStorage() {
  const apiKey = localStorage.getItem("openaiApiKey");
  if (apiKey) {
    document.getElementById("openai-api-key").value = apiKey;
    return apiKey;
  }
  return null;
}

function getResembleApiKeyFromStorage() {
  const apiKey = localStorage.getItem("resembleApiKey");
  if (apiKey) {
    document.getElementById("resemble-api-key").value = apiKey;
    return apiKey;
  }
  return null;
}

function getResembleVoiceUUIDFromStorage() {
  const voiceUUID = localStorage.getItem("resembleVoiceUUID");
  if (voiceUUID) {
    document.getElementById("resemble-voice-uuid").value = voiceUUID;
    return voiceUUID;
  }
  return null;
}

function saveVoiceIdToStorage() {
  const voiceId = document.getElementById("elevenlabs-voice").value;
  localStorage.setItem("elevenlabsVoiceId", voiceId);
  updateElevenLabsUsage();
}

function loadElevenLabsVoiceIdFromStorage() {
  const voiceId = localStorage.getItem("elevenlabsVoiceId");
  if (voiceId) {
    document.getElementById("elevenlabs-voice").value = voiceId;
  }
}

async function generateTextHash(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

// Audio storage functions using IndexedDB
function openAudioCacheDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("WeatherSpeakerAudioCache", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("audioFiles")) {
        db.createObjectStore("audioFiles", {
          keyPath: "textHash",
        });
      }
    };
  });
}

/** Using `text` as the look up "key" for the cache. */
async function saveAudioToStorageCache(text, blob, voiceSource) {
  try {
    // Generate hash first
    const textHash = await generateTextHash(voiceSource + text);
    console.log(`textHash=${textHash}`);

    // Then start transaction
    const db = await openAudioCacheDB();
    const transaction = db.transaction(["audioFiles"], "readwrite");
    const store = transaction.objectStore("audioFiles");

    const audioData = {
      voiceSource: voiceSource,
      textHash: textHash,
      blob: blob,
      timestamp: Date.now(),
    };

    await store.put(audioData);
    console.log("Audio saved to storage with hash:", textHash);
  } catch (error) {
    console.error("Failed to save audio:", error);
  }
}

async function loadAudioFromStorageCache(text, voiceSource) {
  try {
    // Generate hash first
    const textHash = await generateTextHash(voiceSource + text);
    console.log(`textHash=${textHash}`);

    // Then start transaction
    const db = await openAudioCacheDB();
    const transaction = db.transaction(["audioFiles"], "readonly");
    const store = transaction.objectStore("audioFiles");

    const request = store.get(textHash);

    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        if (request.result) {
          console.log("Audio loaded from storage with hash:", textHash);
          resolve(request.result.blob);
        } else {
          resolve(null);
        }
      };
    });
  } catch (error) {
    console.error("Failed to load audio:", error);
    return null;
  }
}

// Handle CORS errors with alternative approach
window.addEventListener("error", function (e) {
  if (e.message.includes("CORS") || e.message.includes("blocked")) {
    showError(
      "CORS error detected. Please use a CORS browser extension or try a different approach.",
    );
  }
});

/**
 * Event handeling
 **/

// Add event listeners for ignore section checkboxes
function updateProcessedText() {
  fetchWeather();
  saveIgnoreSectionsToStorage();
}

document
  .getElementById("ignore-short-term")
  .addEventListener("change", updateProcessedText);
document
  .getElementById("ignore-long-term")
  .addEventListener("change", updateProcessedText);
document
  .getElementById("ignore-marine")
  .addEventListener("change", updateProcessedText);
document
  .getElementById("ignore-aviation")
  .addEventListener("change", updateProcessedText);
document
  .getElementById("ignore-watches")
  .addEventListener("change", updateProcessedText);
document
  .getElementById("ignore-preliminary-point")
  .addEventListener("change", updateProcessedText);

// Voice selection event listeners
const voiceSlider = document.querySelector(".voice-selector-slider");

function updateVoiceSlider() {
  voiceSlider.className = "voice-selector-slider";
  if (voiceElevenLabs.checked) {
    voiceSlider.classList.add("position-elevenlabs");
  } else if (voiceOpenAI.checked) {
    voiceSlider.classList.add("position-openai");
  } else if (voiceResemble.checked) {
    voiceSlider.classList.add("position-resemble");
  }
  // Default position (browser) requires no additional class
}

[voiceWebBrowser, voiceElevenLabs, voiceOpenAI, voiceResemble].forEach(
  (radio) => {
    radio.addEventListener("change", function () {
      soundEffectButtonClick();
      updateVoiceSlider();

      if (voiceElevenLabs.checked) {
        updateElevenLabsUsage();
      } else if (voiceResemble.checked) {
        // No usage API for Resemble yet, but could add in future
        resembleStatusBulb.classList.remove("error");
      }
    });
  },
);

// Initialize slider position
updateVoiceSlider();

getLocationButton.addEventListener("click", function () {
  soundEffectButtonClick();

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      console.log(`Lat: ${latitude}, Lon: `);

      fetch(`https://api.weather.gov/points/${latitude},${longitude}`)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
          return response.json();
        })
        .then((data) => {
          console.log(data.properties);
          officeCodeField.value = data.properties.gridId;
          officeGridX.value = data.properties.gridX;
          officeGridY.value = data.properties.gridY;
          fetchWeather();
        })
        .catch((err) => {
          console.error("Lat/Lon lookup failed:", err);
        });
    },
    (err) => {
      console.error("Location error:", err.message);
    },
    { enableHighAccuracy: false, timeout: 10000 },
  );
});

// Speech controls
playButton.addEventListener("click", async function () {
  soundEffectButtonClick();

  playButton.classList.add("active");
  pauseButton.classList.remove("active");

  if (globalAudio) {
    globalAudio.play();
    return;
  }

  if (!officeCodeField.value) {
    tuneInBulb.classList.add("error");
    showError("Please enter office code.");
    return;
  }

  const selectedVoice = document.querySelector(
    'input[name="voice-type"]:checked',
  ).value;
  voiceWebBrowser.disabled = true;
  voiceElevenLabs.disabled = true;
  voiceOpenAI.disabled = true;
  voiceResemble.disabled = true;

  if (true) {
    playWhiteNoise(8); // duration of effects, will loop until stopped
  }

  await fetchWeather();

  if (!playButton.classList.contains("active")) {
    return; // hack to stop early
  }

  console.log("Will speak:", cleanForecastContent.textContent);

  if (selectedVoice === "elevenlabs") {
    console.log("Play: ElevenLabs");
    // speakWithElevenLabs(
    //     "Example. Unsettled weather returns today and continues into early next week. Upper level ridging holds through Tuesday.",
    // );
    // return;

    if (cleanForecastContent.textContent) {
      try {
        playButton.disabled = true; // Disable during processing
        let url = await speakWithElevenLabs(cleanForecastContent.textContent);
        console.log("ElevenLabs audio URL:", url);
        if (url) {
          playURLAudio(url);
        }
      } catch (error) {
        console.error("Error with ElevenLabs playback:", error);
      } finally {
        playButton.disabled = false;
      }
    } else {
      showError("No forecast text available to speak.");
    }
  } else if (selectedVoice === "openai") {
    console.log("Play: OpenAI");

    if (cleanForecastContent.textContent) {
      playButton.disabled = true; // Disable during processing

      let url = await speakWithOpenAI(cleanForecastContent.textContent);
      console.log("Awaited:", url);
      if (url) {
        playURLAudio(url);
      }
      playButton.disabled = false;
    } else {
      showError("No forecast text available to speak.");
    }
  } else if (selectedVoice === "resemble") {
    console.log("Play: Resemble");

    if (cleanForecastContent.textContent) {
      try {
        playButton.disabled = true; // Disable during processing
        let url = await speakWithResemble(cleanForecastContent.textContent);
        console.log("Resemble audio URL:", url);
        if (url) {
          // We're in a user-initiated event handler (click), so playback should work
          playURLAudio(url);
        }
      } catch (error) {
        console.error("Resemble playback error:", error);
        showError(`Resemble playback error: ${error.message}`);
      } finally {
        playButton.disabled = false;
      }
    } else {
      showError("No forecast text available to speak.");
    }
  } else {
    console.log("Play: Classic");
    // Check if speech synthesis is supported
    if (!("speechSynthesis" in window)) {
      alert(
        "Your browser does not support speech synthesis. Please try a different browser.",
      );
    }

    // Create new utterance for this text
    if (speechUtterance && !speechSynth.paused) {
      speechSynth.cancel(); // Cancel any ongoing speech
    }

    speechUtterance = new SpeechSynthesisUtterance(
      cleanForecastContent.textContent,
    );
    const voices = speechSynthesis.getVoices();
    speechUtterance.voice = voices.find((v) => v.name === "Ralph");

    if (speechUtterance) {
      speechUtterance.volume = 1.0;
      speechUtterance.pitch = 1.2;

      speechUtterance.onboundary = (event) => {
        if (event.name === "word") {
          const percent = (event.charIndex / speechUtterance.text.length) * 100;
          needle.style.left = percent + "%";
        }
      };

      speechUtterance.addEventListener("end", () => {
        // Speech finished
        stopButtonAction();
      });

      stopWhiteNoise(1);

      if (speechSynth.paused) {
        speechSynth.resume();
      } else {
        speechSynth.speak(speechUtterance);
      }
    }
  }
});

pauseButton.addEventListener("click", function () {
  soundEffectButtonClick();

  playButton.classList.remove("active");
  pauseButton.classList.add("active");

  if (speechSynth.speaking) {
    speechSynth.pause();
  }

  if (globalAudio) {
    globalAudio.pause();
  }
});

function stopButtonAction() {
  soundEffectButtonClick();

  playButton.classList.remove("active");
  pauseButton.classList.remove("active");

  voiceWebBrowser.disabled = false;
  voiceElevenLabs.disabled = false;
  voiceOpenAI.disabled = false;
  voiceResemble.disabled = false;

  speechSynth.cancel();

  if (globalAudio) {
    // we are caching, so can set to null
    // that way, when you hit play again it will
    // use new text if it's there, and cache if not.
    globalAudio.pause(); // pause first! else race condition bug I think
    globalAudio = null;
  }

  document.getElementById("radio-speaker").style.transform = `scale(1)`;

  stopWhiteNoise(1);
}

stopButton.addEventListener("click", stopButtonAction);

/**
 *
 *
 * Begin "main" logic
 *
 *
 **/

function showError(message) {
  errorMessageBox.textContent = message;
  errorMessageBox.style.display = "block";
}

loadIgnoreSectionsFromStorage();

if (getElevenLabsApiKeyFromStorage()) {
  updateElevenLabsUsage();
}
getOpenAIApiKeyFromStorage();
getResembleApiKeyFromStorage();
getResembleVoiceUUIDFromStorage();
loadElevenLabsVoiceIdFromStorage();

// load office code from URL if exists
const urlParams = new URLSearchParams(window.location.search);
officeCodeField.value = urlParams.get("office");
officeGridX.value = urlParams.get("x");
officeGridY.value = urlParams.get("y");

if (officeCodeField.value) {
  fetchWeather();
}
