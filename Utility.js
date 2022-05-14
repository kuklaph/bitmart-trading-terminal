const Prop = () => {
  return {
    find: (key) => {
      const hasKey = PropertiesService.getScriptProperties().getProperty(key);
      if (!hasKey) {
        return false;
      }
      const unzipped = Utilities.unzip(
        Utilities.newBlob(Utilities.base64Decode(hasKey), "application/zip")
      )[0].getDataAsString();
      const parsed = JSON.parse(unzipped);
      return parsed;
    },
    save: (key, data) => {
      const stringify = JSON.stringify(data);
      const zipped = Utilities.base64Encode(
        Utilities.zip([Utilities.newBlob(stringify)]).getBytes()
      );
      PropertiesService.getScriptProperties().setProperty(key, zipped);
      return true;
    },
    keys: () => {
      return PropertiesService.getScriptProperties().getKeys();
    },
    remove: (key) => {
      PropertiesService.getScriptProperties().deleteProperty(key);
      return true;
    },
  };
};
const Fetch = (params, verbose = false, mute = true) => {
  params.muteHttpExceptions = mute;
  const { url } = params;
  const RL = Prop().find("rateLimit");
  let rateLimitRemaining = 0,
    rateLimitMax = 0,
    rateLimitReset = 0;
  if (RL) {
    rateLimitRemaining = RL.rateLimitRemaining;
    rateLimitMax = RL.rateLimitMax;
    rateLimitReset = RL.rateLimitReset;
  }
  if (rateLimitRemaining > rateLimitMax) {
    console.log("ratelimit hit", rateLimitRemaining, rateLimitMax);
    Utilities.sleep(rateLimitReset * 1010);
  }
  console.log(rateLimitRemaining, rateLimitMax, rateLimitReset);
  console.log(rateLimitRemaining > rateLimitMax);
  const request = UrlFetchApp.fetch(url, params);
  if (request.getResponseCode() == 502) {
    Logger.log(request);
    return { message: "Bitmart API down: 502 Error code" };
  }
  if (request.getResponseCode() == 429) {
    Logger.log(request);
    return { message: request };
  }
  const headers = request.getAllHeaders();
  rateLimitRemaining = Number(headers["x-bm-ratelimit-remaining"]);
  rateLimitMax = Number(headers["x-bm-ratelimit-limit"]);
  rateLimitReset = Number(headers["x-bm-ratelimit-reset"]);
  const urlFetchCount = !RL.urlFetchCount ? 1 : (RL.urlFetchCount += 1);
  Prop().save("rateLimit", {
    rateLimitRemaining,
    rateLimitMax,
    rateLimitReset,
    urlFetchCount,
  });
  console.log(rateLimitRemaining, rateLimitMax, rateLimitReset, urlFetchCount);
  const parsed = JSON.parse(request);
  if (verbose) {
    parsed.headers = {
      rateLimitRemaining,
      rateLimitMax,
      rateLimitReset,
    };
  }
  return parsed;
};
const eToNumber = (num) => {
  
  let sign = "";
  (num += "").charAt(0) == "-" && ((num = num.substring(1)), (sign = "-"));
  let arr = num.split(/[e]/gi);
  if (arr.length < 2) return sign + num;
  let dot = (0.1).toLocaleString().substr(1, 1),
    n = arr[0],
    exp = +arr[1],
    w = (n = n.replace(/^0+/, "")).replace(dot, ""),
    pos = n.split(dot)[1] ? n.indexOf(dot) + exp : w.length + exp,
    L = pos - w.length,
    s = "" + BigInt(w);
  w =
    exp >= 0
      ? L >= 0
        ? s + "0".repeat(L)
        : r()
      : pos <= 0
      ? "0" + dot + "0".repeat(Math.abs(pos)) + s
      : r();
  L = w.split(dot);
  if ((L[0] == 0 && L[1] == 0) || (+w == 0 && +s == 0)) w = 0;
  return sign + w;
  function r() {
    return w.replace(new RegExp(`^(.{${pos}})(.)`), `$1${dot}$2`);
  }
};
const calcTimestamp = (step, to, times = 1) => {
  if (!to) {
    to = new Date().getTime();
  }
  const steps = {
    1: 500,
    3: 1500,
    5: 2500,
    15: 7500,
    30: 15000,
    45: 22500,
    60: 30000,
    120: 60000,
    180: 90000,
    240: 120000,
    1440: 720000,
    10080: 5040000,
    43200: 21600000,
  };
  const bump = {
    1: 1,
    3: 3,
    5: 5,
    15: 15,
    30: 30,
    45: 45,
    60: 60,
    120: 120,
    180: 180,
    240: 240,
    1440: 1440,
    10080: 10080,
    43200: 43200,
  };
  const arr = [];
  let from, prevDate;
  for (let i = 0; i < times; i++) {
    // Oldest
    if (!from) {
      prevDate = new Date(to - steps[step] * 60000);
      from = prevDate.getTime();
    } else {
      to = prevDate.getTime() - bump[step] * 60000;
      prevDate = new Date(to - steps[step] * 60000);
      from = prevDate.getTime();
    }
    to = parseInt(Math.floor(to / 1000));
    from = parseInt(Math.floor(from / 1000));
    arr.push({ to, from });
  }

  return arr;
};
const fmtFluctuation = (fluctuation) => {
  let change;
  if (fluctuation.includes("+")) {
    change = Number(Number(fluctuation.split("+")[1] * 100).toFixed(2));
  } else {
    change = Number((Number(fluctuation) * 100).toFixed(2));
  }
  return change;
};
const formatActiveOrderDate = (orderDate) => {
  const date = new Date().toLocaleString();
};
const chunk = (arr, chunkSize, type = "obj") => {
  const res = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);
    res.push(chunk);
  }
  if (type == "obj") {
    const obj = {};
    res.forEach((el, i) => {
      obj[i + 1] = el;
    });
    return obj;
  } else {
    return res;
  }
};
