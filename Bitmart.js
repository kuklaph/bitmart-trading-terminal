const runMeFirst = () => {
  console.log(
    "Success! Bitmart Utility has now been authorized. You may now proceed and use the application."
  );
};
const cfg = () => {
  const hasAPI = Prop().find("apiSettings");
  if (!hasAPI) {
    throw "No API Info. Please save API info.";
  }
  if (!Object.keys(hasAPI).includes("bitmart")) {
    throw "No API Info for Bitmart.";
  }
  return {
    memo: hasAPI.bitmart.memo,
    key: hasAPI.bitmart.key,
    secret: hasAPI.bitmart.secret,
  };
};
const Bitmart = (category, endpoint, params = {}, v = false) => {
  const formatQS = (obj) => {
    const str = [];
    for (const p in obj)
      if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      }
    return `?${str.join("&")}`;
  };
  const sign = (opts) => {
    const { ep, m, a, p } = opts;
    const baseURL = "https://api-cloud.bitmart.com/";
    const timestamp = new Date().getTime().toString();
    const requestObj = {
      contentType: "application/json",
      method: m,
    };
    let qs;
    const requestTypes = {
      GET: () => {
        qs = formatQS(p);
        requestObj.url = `${baseURL}${ep}${qs}`;
      },
      DELETE: () => {
        qs = formatQS(p);
        requestObj.url = `${baseURL}${ep}${qs}`;
      },
      PUT: () => {
        requestObj.url = baseURL + ep;
        qs = JSON.stringify(p);
        requestObj.payload = qs;
      },
      POST: () => {
        requestObj.url = baseURL + ep;
        qs = JSON.stringify(p);
        requestObj.payload = qs;
      },
    };
    requestTypes[m]();
    let h;
    const auth = {
      NONE: () => {
        h = {
          "X-BM-TIMESTAMP": timestamp,
        };
      },
      KEYED: () => {
        const { key } = cfg();
        h = {
          "X-BM-KEY": key,
          "X-BM-TIMESTAMP": timestamp,
        };
      },
      SIGNED: () => {
        const { memo, key, secret } = cfg();
        const sigString = `${timestamp}#${memo}#${qs}`;
        let signature = Utilities.computeHmacSha256Signature(sigString, secret);
        signature = signature
          .map(function (e) {
            return ("0" + (e < 0 ? e + 256 : e).toString(16)).slice(-2);
          })
          .join("");
        h = {
          "X-BM-KEY": key,
          "X-BM-SIGN": signature,
          "X-BM-TIMESTAMP": timestamp,
        };
      },
    };
    auth[a]();
    requestObj.headers = h;
    return requestObj;
  };

  const methods = {
    Markets: {
      getCurrency: () => {
        try {
          const opts = {
            ep: "spot/v1/currencies",
            m: "GET",
            a: "NONE",
            p: params,
          };
          const request = Fetch(sign(opts), v);
          if (request.message !== "OK") {
            return {
              error: true,
              result: request,
              where: "Markets:getCurrency",
            };
          }
          return { error: false, result: request };
        } catch (error) {
          throw error;
        }
      },
      getSymbols: () => {
        try {
          const opts = {
            ep: "spot/v1/symbols",
            m: "GET",
            a: "NONE",
            p: params,
          };
          const request = Fetch(sign(opts), v);
          if (request.message !== "OK") {
            return {
              error: true,
              result: request,
              where: "Markets:getSymbols",
            };
          }
          return { error: false, result: request };
        } catch (error) {
          throw error;
        }
      },
      getSymbolDetails: () => {
        try {
          const opts = {
            ep: "spot/v1/symbols/details",
            m: "GET",
            a: "NONE",
            p: params,
          };
          const request = Fetch(sign(opts), v);
          if (request.message !== "OK") {
            return {
              error: true,
              result: request,
              where: "Markets:getSymbolDetails",
            };
          }
          return { error: false, result: request };
        } catch (error) {
          throw error;
        }
      },
      getTicker: () => {
        try {
          const opts = {
            ep: "spot/v1/ticker",
            m: "GET",
            a: "NONE",
            p: params,
          };
          const request = Fetch(sign(opts), v);
          if (request.message !== "OK") {
            return { error: true, result: request, where: "Markets:getTicker" };
          }
          return { error: false, result: request };
        } catch (error) {
          throw error;
        }
      },
      getKlineSteps: () => {
        try {
          const opts = {
            ep: "spot/v1/steps",
            m: "GET",
            a: "NONE",
            p: params,
          };
          const request = Fetch(sign(opts), v);
          if (request.message !== "OK") {
            return {
              error: true,
              result: request,
              where: "Markets:getKlineSteps",
            };
          }
          return { error: false, result: request };
        } catch (error) {
          throw error;
        }
      },
      getKline: () => {
        try {
          const opts = {
            ep: "spot/v1/symbols/kline",
            m: "GET",
            a: "NONE",
            p: params,
          };
          const request = Fetch(sign(opts), v);
          if (request.message !== "OK") {
            return { error: true, result: request, where: "Markets:getKline" };
          }
          return { error: false, result: request };
        } catch (error) {
          throw error;
        }
      },
      getDepth: () => {
        try {
          const opts = {
            ep: "spot/v1/symbols/book",
            m: "GET",
            a: "NONE",
            p: params,
          };
          const request = Fetch(sign(opts), v);
          if (request.message !== "OK") {
            return { error: true, result: request, where: "Markets:getDepth" };
          }
          return { error: false, result: request };
        } catch (error) {
          throw error;
        }
      },
      getTrades: () => {
        try {
          const opts = {
            ep: "spot/v1/symbols/trades",
            m: "GET",
            a: "NONE",
            p: params,
          };
          const request = Fetch(sign(opts), v);
          if (request.message !== "OK") {
            return { error: true, result: request, where: "Markets:getTrades" };
          }
          return { error: false, result: request };
        } catch (error) {
          throw error;
        }
      },
    },
    Trade: {
      placeOrder: () => {
        try {
          const opts = {
            ep: "spot/v1/submit_order",
            m: "POST",
            a: "SIGNED",
            p: params,
          };
          const request = Fetch(sign(opts), v);
          if (request.message !== "OK") {
            return { error: true, result: request, where: "Trade:placeOrder" };
          }
          return { error: false, result: request };
        } catch (error) {
          throw error;
        }
      },
      batchOrder: () => {
        try {
          const opts = {
            ep: "spot/v1/batch_orders",
            m: "POST",
            a: "SIGNED",
            p: params,
          };
          const request = Fetch(sign(opts), v);
          if (request.message !== "OK") {
            return { error: true, result: request, where: "Trade:batchOrder" };
          }
          return { error: false, result: request };
        } catch (error) {
          throw error;
        }
      },
      cancelOrder: () => {
        try {
          const opts = {
            ep: "spot/v2/cancel_order",
            m: "POST",
            a: "SIGNED",
            p: params,
          };
          const request = Fetch(sign(opts), v);
          if (request.message !== "OK") {
            return { error: true, result: request, where: "Trade:cancelOrder" };
          }
          return { error: false, result: request };
        } catch (error) {
          throw error;
        }
      },
      cancelAllOrders: () => {
        try {
          const opts = {
            ep: "spot/v1/cancel_orders",
            m: "POST",
            a: "SIGNED",
            p: params,
          };
          const request = Fetch(sign(opts), v);
          if (request.message !== "OK") {
            return {
              error: true,
              result: request,
              where: "Trade:cancelAllOrders",
            };
          }
          return { error: false, result: request };
        } catch (error) {
          throw error;
        }
      },
      getOrderDetail: () => {
        try {
          const opts = {
            ep: "spot/v1/order_detail",
            m: "GET",
            a: "SIGNED",
            p: params,
          };
          const request = Fetch(sign(opts), v);
          if (request.message !== "OK") {
            return {
              error: true,
              result: request,
              where: "Trade:getOrderDetail",
            };
          }
          return { error: false, result: request };
        } catch (error) {
          throw error;
        }
      },
      getUserOrders: () => {
        try {
          const opts = {
            ep: "spot/v2/orders",
            m: "GET",
            a: "SIGNED",
            p: params,
          };
          const request = Fetch(sign(opts), v);
          if (request.message !== "OK") {
            return {
              error: true,
              result: request,
              where: "Trade:getUserOrders",
            };
          }
          return { error: false, result: request };
        } catch (error) {
          throw error;
        }
      },
      getUserTrades: () => {
        try {
          const opts = {
            ep: "spot/v1/trades",
            m: "GET",
            a: "SIGNED",
            p: params,
          };
          const request = Fetch(sign(opts), v);
          if (request.message !== "OK") {
            return {
              error: true,
              result: request,
              where: "Trade:getUserTrades",
            };
          }
          return { error: false, result: request };
        } catch (error) {
          throw error;
        }
      },
    },
    User: {
      getBalance: () => {
        try {
          const opts = {
            ep: "account/v1/wallet",
            m: "GET",
            a: "KEYED",
            p: params,
          };
          const request = Fetch(sign(opts), v);
          if (request.message !== "OK") {
            return { error: true, result: request, where: "User:getBalance" };
          }
          return { error: false, result: request };
        } catch (error) {
          throw error;
        }
      },
    },
  };

  return methods[category][endpoint]();
};
