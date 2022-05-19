const DB = Database();
// Markets ===========================================
const loadAllMarkets = () => {
  try {
    const actions = {
      getSymbolDetails: () => {
        try {
          const request = Bitmart("Markets", "getSymbolDetails");
          const { error, result } = request;
          if (error) {
            throw JSON.stringify(request);
          }
          return result;
        } catch (error) {
          throw error;
        }
      },
      getCurrencies: () => {
        try {
          const request = Bitmart("Markets", "getCurrency");
          const { error, result } = request;
          if (error) {
            throw JSON.stringify(request);
          }
          return result;
        } catch (error) {
          throw error;
        }
      },
      getTickers: () => {
        try {
          const request = Bitmart("Markets", "getTicker");
          const { error, result } = request;
          if (error) {
            throw JSON.stringify(request);
          }
          return result;
        } catch (error) {
          throw error;
        }
      },
    };
    const { currencies } = actions.getCurrencies().data;
    const { symbols } = actions.getSymbolDetails().data;
    const { tickers } = actions.getTickers().data;
    const mapped = [];
    symbols.forEach((s) => {
      const { symbol } = s;
      const base = s.base_currency;
      const status = s.trade_status;
      const [findCurrency] = currencies.filter((c) => {
        return c.id == base || c.id.includes(base);
      });
      const [findTicker] = tickers.filter((t) => {
        return t.symbol == symbol;
      });

      if (status == "trading" && findCurrency && findTicker) {
        const quote = s.quote_currency;
        const { name } = findCurrency;
        const price = findTicker.last_price;
        const { fluctuation } = findTicker;
        const change = fmtFluctuation(fluctuation);
        const list = { base, quote, symbol, name, price, change };
        mapped.push({
          list,
          details: s,
        });
      }
    });

    return mapped;
  } catch (error) {
    throw error;
  }
};
// Stats ===========================================
const load24hStats = (symbol) => {
  try {
    const request = Bitmart("Markets", "getTicker", { symbol });
    const { error, result } = request;
    if (error) {
      throw JSON.stringify(request);
    }
    const [stats] = result.data.tickers;
    const formatted = {
      BVol: stats.base_volume_24h,
    };
    return formatted;
  } catch (error) {
    throw error;
  }
};
// Chart ===========================================
const fetchSymbolKlines = (symbol, step = 60, fromTS, sets = 1) => {
  try {
    const dates = calcTimestamp(step, fromTS, sets);
    const allKlines = dates
      .map((d) => {
        const { to, from } = d;
        const request = Bitmart("Markets", "getKline", {
          from,
          to,
          symbol,
          step,
        });
        const { error, result } = request;
        if (error) {
          throw JSON.stringify(request);
        }
        return result.data.klines;
      })
      .flat()
      .map((k) => {
        return {
          time: k.timestamp,
          high: Number(k.high),
          low: Number(k.low),
          open: Number(k.open),
          close: Number(k.close),
          volume: Number(k.volume),
          quote_volume: Number(k.quote_volume),
        };
      })
      .sort((a, b) => {
        return a.time - b.time;
      });
    return allKlines;
  } catch (error) {
    throw error;
  }
};
const fetchSymbolSteps = (symbol) => {
  try {
    const request = Bitmart("Markets", "getKlineSteps", { symbol });
    const { error, result } = request;
    if (error) {
      throw JSON.stringify(request);
    }
  } catch (error) {
    throw error;
  }
};
// Current Orders ===========================================
const viewActiveOrders = (symbol, side = false) => {
  try {
    const activeOrders = DB.Actions.View.all();
    const filtered = activeOrders.filter((o) => {
      if (side) {
        return o.symbol == symbol && o.side == side;
      }
      return o.symbol == symbol;
    });
    return filtered.sort((a, b) => {
      return new Date(b.create_time) - new Date(a.create_time);
    });
  } catch (error) {
    throw error;
  }
};
const viewClosedOrders = (symbol) => {
  try {
    const closedTrades = DB.Actions.View.fmt("closed");
    const filtered = closedTrades.filter((o) => {
      return o.symbol == symbol;
    });
    return filtered.sort((a, b) => {
      return new Date(b.create_time) - new Date(a.create_time);
    });
  } catch (error) {
    throw error;
  }
};
const getExOrders = (symbol, status = 9) => {
  try {
    const request = Bitmart("Trade", "getUserOrders", {
      symbol,
      N: 100,
      status,
    });
    const { error, result } = request;
    if (error) {
      throw JSON.stringify(request);
    }
    return result.data.orders;
  } catch (error) {
    throw error;
  }
};
const getExOrderInfo = (order_id) => {
  try {
    const request = Bitmart("Trade", "getOrderDetail", {
      order_id,
    });
    const { error, result } = request;
    if (error) {
      throw JSON.stringify(request);
    }
    return result.data;
  } catch (error) {
    throw error;
  }
};
const getExTrades = (symbol, order_id = false) => {
  try {
    let params1;
    if (order_id) {
      params1 = {
        symbol,
        order_id,
        offset: 1,
        limit: 100,
      };
    } else {
      params1 = {
        symbol,
        offset: 1,
        limit: 100,
      };
    }
    const firstRequest = Bitmart("Trade", "getUserTrades", params1);
    if (firstRequest.error) {
      throw JSON.stringify(firstRequest);
    }
    const firstPageTrades = firstRequest.result.data.trades;
    let secondPageTrades = [];
    if (firstPageTrades.length == 100) {
      let params2;
      if (order_id) {
        params2 = {
          symbol,
          order_id,
          offset: 2,
          limit: 100,
        };
      } else {
        params2 = {
          symbol,
          offset: 2,
          limit: 100,
        };
      }
      const secondRequest = Bitmart("Trade", "getUserTrades", params2, true);
      if (secondRequest.error) {
        throw JSON.stringify(secondRequest);
      }
      secondPageTrades = secondRequest.result.data.trades;
    }
    const totalTrades = [...firstPageTrades, ...secondPageTrades];
    return totalTrades;
  } catch (error) {
    throw error;
  }
};
const getWallets = () => {
  try {
    const request = Bitmart("User", "getBalance");
    const { error, result } = request;
    if (error) {
      throw JSON.stringify(request);
    }
    return result.data.wallet;
  } catch (error) {
    throw error;
  }
};
const cancelActiveOrder = (order_id) => {
  const closed = DB.Actions.View.fmt("closed").map((t) => {
    return t.detail_id;
  });
  let cont = false,
    tradeDetails = [];
  try {
    const orderDetails = getExOrderInfo(order_id);
    if (orderDetails.status == "5" || orderDetails.status == "6") {
      tradeDetails = getExTrades(orderDetails.symbol);
      cont = true;
    } else if (orderDetails.status == "4") {
      cont = true;
    } else {
      DB.Orders.remove(order_id);
      return true;
    }
  } catch (error) {
    throw error;
  }

  if (cont) {
    try {
      const tradesWithOrderId = tradeDetails.filter((t) => {
        return t.order_id == order_id;
      });
      if (tradesWithOrderId.length) {
        const tradesToAdd = tradesWithOrderId.filter((t) => {
          return closed.indexOf(t.detail_id.toString()) == -1;
        });
        if (tradesToAdd.length) {
          DB.Trades.add(tradesToAdd);
        }
      }
    } catch (error) {
      cont = false;
      throw error;
    }
  }

  if (cont) {
    try {
      const request = Bitmart("Trade", "cancelOrder", { order_id });
      const { error, result } = request;
      if (error) {
        throw JSON.stringify(request);
      }
      if (!result.data.result) {
        throw JSON.stringify(request);
      }
      DB.Orders.remove(order_id);
      return true;
    } catch (error) {
      throw error;
    }
  }
};
const checkCancelIdForPartial = (activeOrdersChunk) => {
  const obj = { tradeDetails: [], noDetail: [], toCancel: [] };
  activeOrdersChunk.forEach((order) => {
    const { order_id } = order;
    try {
      const orderDetails = getExOrderInfo(order_id);
      if (orderDetails.status == "5") {
        obj.tradeDetails.push(getExTrades(orderDetails.symbol));
      }
      obj.toCancel.push(order_id);
    } catch (error) {
      obj.noDetail.push({ id: order_id, error });
    }
  });
  return obj;
};
const checkIfPartialExistsOnDB = (tradeDetails) => {
  try {
    if (!tradeDetails.length) {
      return;
    }
    const closed = DB.Actions.View.fmt("closed").map((t) => {
      return t.detail_id;
    });
    const readyToAdd = tradeDetails.filter((trade) => {
      return closed.indexOf(trade.detail_id.toString()) == -1;
    });
    DB.Trades.add(readyToAdd);
  } catch (error) {
    throw error;
  }
};
const cancelAllExchange = (symbol, side) => {
  const cancelAllBuys = () => {
    const cancelBuy = Bitmart("Trade", "cancelAllOrders", {
      symbol,
      side: "buy",
    });
    const buyError = cancelBuy.error;
    const buyResult = cancelBuy.result;
    if (buyError) {
      cancelBuy.where = cancelBuy.where + " :: Cancel Buy Orders";
      throw JSON.stringify(buyResult);
    }
  };
  const cancelAllSells = () => {
    const cancelSell = Bitmart("Trade", "cancelAllOrders", {
      symbol,
      side: "sell",
    });
    const sellError = cancelSell.error;
    const sellResult = cancelSell.result;
    if (sellError) {
      cancelSell.where = cancelSell.where + " :: Cancel Sell Orders";
      throw JSON.stringify(sellResult);
    }
  };
  try {
    switch (side) {
      case "buy":
        cancelAllBuys();
        break;
      case "sell":
        cancelAllSells();
        break;
      default:
        cancelAllBuys();
        cancelAllSells();
        break;
    }

    DB.Orders.removeAll(symbol, side);
    return true;
  } catch (error) {
    throw error;
  }
};
const cancelActiveNoCheck = (orders) => {
  try {
    orders.forEach((o) => {
      const request = Bitmart("Trade", "cancelOrder", { order_id: o });
      const { error, result } = request;
      if (error) {
        if (result.code !== 50030) {
          throw JSON.stringify(request);
        }
      }
      if (!result.data.result) {
        throw JSON.stringify(request);
      }
      DB.Orders.remove(o);
    });
  } catch (error) {
    throw error;
  }
};
// Order Terminal ===========================================
const getAvailable = (currency) => {
  try {
    const request = Bitmart("User", "getBalance", { currency });
    const { error, result } = request;
    if (error) {
      throw JSON.stringify(request);
    }
    const { wallet } = result.data;
    if (!wallet.length) {
      return 0;
    }
    const { available } = wallet[0];
    return Number(available);
  } catch (error) {
    throw error;
  }
};
const submitSimpleOrder = (form) => {
  try {
    const actions = {
      onExchange: (tradeParams, batch = false) => {
        const which = batch ? "batchOrder" : "placeOrder";
        const request = Bitmart("Trade", which, tradeParams);
        const { error, result } = request;
        if (error) {
          throw JSON.stringify(request);
        }
        return result.data;
      },
      checkStatus: (order_id, batch = false) => {
        const request = Bitmart("Trade", "getOrderDetail", {
          order_id,
        });
        const { error, result } = request;
        if (error) {
          throw JSON.stringify(request);
        }
        const order = result.data;
        order.is_smart = false;
        switch (order.status) {
          case "1":
            throw JSON.stringify(request);
          case "2":
            order.is_pending = true;
            break;
          case "4":
            order.is_pending = false;
            order.error_detail = false;
            break;
          case "5":
            order.is_pending = false;
            order.error_detail = false;
            break;
          case "6":
            order.is_pending = false;
            const request = Bitmart("Trade", "getUserTrades", {
              order_id,
              symbol: form.symbol,
            });
            const { error, result } = request;
            order.error_detail = false;
            if (!batch) {
              if (error) {
                order.error_detail = true;
                throw JSON.stringify(request);
              }
              return { sheet: "closed", data: result.data.trades };
            } else {
              if (!error) {
                return { sheet: "closed", data: result.data.trades };
              }
              order.error_detail = true;
              break;
            }
          case "7":
            order.is_pending = true;
            order.error_detail = false;
            break;
          case "8":
            order.is_pending = false;
            order.error_detail = false;
            break;
          default:
            break;
        }
        return { sheet: "simple", data: order };
      },
      single: {
        limit: () => {
          return {
            symbol: form.symbol,
            side: form.side,
            type: "limit",
            price: form.simplePriceA,
            size: form.simpleApproxBase,
          };
        },
        market: () => {
          const params = {
            buy: {
              side: "buy",
              notional: form.simpleTotal,
            },
            sell: {
              side: "sell",
              size: form.simpleTotal,
            },
          };
          params[form.side].symbol = form.symbol;
          params[form.side].type = "market";
          return params[form.side];
        },
        place: () => {
          const tradeParams =
            actions[form.simpleTradeType][form.simpleOrderType]();
          const { order_id } = actions.onExchange(tradeParams);
          DB.Orders.addIDs("simple", { order_id, error_detail: true });
          const { sheet, data } = actions.checkStatus(order_id);
          if (sheet == "simple") {
            DB.Orders.updateDetails(sheet, data);
          } else {
            if (data.length) {
              DB.Trades.add(data);
              DB.Orders.remove(order_id);
            }
          }
          return true;
        },
      },
      ladder: {
        hasErrors: (orders) => {
          const filtered = orders.filter((f) => {
            return f.isBError || f.isQError;
          });
          if (filtered.length > 0) {
            return true;
          }
          return false;
        },
        batch: (orders, symbol, side) => {
          return orders.map((o) => {
            return {
              symbol,
              side,
              type: "limit",
              price: o.price,
              size: o.bVol,
            };
          });
        },
        checkSuccess: (orderResponses) => {
          return orderResponses.reduce(
            (t, el) => {
              if (el.msg == "SUCCESS") {
                t.successfulOrders.push(el);
              } else {
                t.unSuccessfulOrders.push(el);
              }
              return t;
            },
            { unSuccessfulOrders: [], successfulOrders: [] }
          );
        },
        place: () => {
          const { ladder, onExchange, checkStatus } = actions;
          const { orders, symbol, side } = form;
          const checkHasErrors = ladder.hasErrors(orders);
          if (checkHasErrors) {
            throw "Batch has quote or base amounts below min required";
          }
          const batched = ladder.batch(orders, symbol, side);
          const { orderResponses } = onExchange({ orderParams: batched }, true);
          const { unSuccessfulOrders, successfulOrders } =
            ladder.checkSuccess(orderResponses);
          const batchOrderIDs = successfulOrders.map((o) => {
            return { order_id: o.data.orderId, error_detail: true };
          });
          DB.Orders.addIDs("simple", batchOrderIDs);
          const { ordersToAdd, tradesToAdd } = successfulOrders
            .map((o) => {
              const order_id = o.data.orderId;
              return checkStatus(order_id, true);
            })
            .reduce(
              (t, el) => {
                const { sheet, data } = el;
                if (sheet == "simple") {
                  t.ordersToAdd.push(data);
                } else {
                  t.tradesToAdd.push(data);
                }
                return t;
              },
              { ordersToAdd: [], tradesToAdd: [] }
            );
          DB.Orders.updateDetails("simple", ordersToAdd);
          if (tradesToAdd.length) {
            DB.Trades.add(tradesToAdd);
            tradesToAdd.forEach((t) => {
              const { order_id } = t;
              DB.Orders.remove(order_id);
            });
          }
          const issues = {
            error: true,
            result: {
              message: {},
            },
            where: "placeBatchOrders",
          };
          if (unSuccessfulOrders.length > 0) {
            const http = {
              error: "Some orders unsuccessful http request",
              failed: unSuccessfulOrders,
            };
            issues.result.message.http = http;
          }
          if (unSuccessfulOrders.length > 0) {
            throw JSON.stringify(issues);
          }
          return true;
        },
      },
    };
    return actions[form.simpleTradeType].place();
  } catch (error) {
    throw error;
  }
};
const submitSmartOrder = (form) => {
  const whichSheet = {
    buy: "smartBuy",
    sell: "smartSell",
  };
  const isInfinite = "infSmartTrade" in form;
  try {
    const actions = {
      onExchange: (tradeParams, batch = false) => {
        const which = batch ? "batchOrder" : "placeOrder";
        const request = Bitmart("Trade", which, tradeParams);
        const { error, result } = request;
        if (error) {
          throw JSON.stringify(request);
        }
        return result.data;
      },
      checkStatus: (order_id, batch = false) => {
        const request = Bitmart("Trade", "getOrderDetail", {
          order_id,
        });
        const { error, result } = request;
        if (error) {
          throw JSON.stringify(request);
        }
        const order = result.data;
        order.is_smart = true;
        switch (order.status) {
          case "1":
            throw JSON.stringify(request);
          case "2":
            order.is_pending = true;
            break;
          case "4":
            order.is_pending = false;
            order.error_detail = false;
            break;
          case "5":
            order.is_pending = false;
            order.error_detail = false;
            break;
          case "6":
            order.is_pending = false;
            const request = Bitmart("Trade", "getUserTrades", {
              order_id,
              symbol: form.symbol,
            });
            const { error, result } = request;
            order.error_detail = false;
            if (!batch) {
              if (error) {
                order.error_detail = true;
                throw JSON.stringify(request);
              }
              return { sheet: "closed", data: result.data.trades };
            } else {
              if (!error) {
                return { sheet: "closed", data: result.data.trades };
              }
              order.error_detail = true;
              break;
            }
          case "7":
            order.is_pending = true;
            order.error_detail = false;
            break;
          case "8":
            order.is_pending = false;
            order.error_detail = false;
            break;
          default:
            break;
        }
        return { sheet: whichSheet[form.side], data: order };
      },
      single: {
        limit: () => {
          return {
            symbol: form.symbol,
            side: form.side,
            type: "limit",
            price: form.smartPriceA,
            size: form.smartApproxBase,
          };
        },
        market: () => {
          const params = {
            buy: {
              side: "buy",
              notional: form.smartTotal,
            },
            sell: {
              side: "sell",
              size: form.smartTotal,
            },
          };
          params[form.side].symbol = form.symbol;
          params[form.side].type = "market";
          return params[form.side];
        },
        place: () => {
          const tradeParams =
            actions[form.smartTradeType][form.smartOrderType]();
          const { order_id } = actions.onExchange(tradeParams);
          DB.Orders.addIDs(whichSheet[form.side], {
            order_id,
            error_detail: true,
            is_pending: true,
            symbol: form.symbol,
            create_time: new Date(),
            side: form.side,
            type: form.smartOrderType,
            price: form.price,
            price_avg: "0",
            size: form.size,
            notional: "",
            filled_notional: "",
            filled_size: "",
            unfilled_volume: "",
            status: "",
            is_smart: true,
            source_id: isInfinite ? true : "",
            tp_price: form.smartTP,
          });
          const { sheet, data } = actions.checkStatus(order_id);
          if (sheet !== "closed") {
            DB.Orders.updateDetails(sheet, data);
          } else {
            if (data.length) {
              DB.Trades.add(data);
              DB.Orders.remove(order_id);
            }
          }
          return true;
        },
      },
      ladder: {
        hasErrors: (orders) => {
          const filtered = orders.filter((f) => {
            return f.isBError || f.isQError;
          });
          if (filtered.length > 0) {
            return true;
          }
          return false;
        },
        batch: (orders, symbol, side) => {
          return orders.map((o) => {
            return {
              symbol,
              side,
              type: "limit",
              price: o.price,
              size: o.bVol,
            };
          });
        },
        checkSuccess: (orderResponses) => {
          return orderResponses.reduce(
            (t, el) => {
              if (el.msg == "SUCCESS") {
                t.successfulOrders.push(el);
              } else {
                t.unSuccessfulOrders.push(el);
              }
              return t;
            },
            { unSuccessfulOrders: [], successfulOrders: [] }
          );
        },
        place: () => {
          const { ladder, onExchange, checkStatus } = actions;
          const { orders, symbol, side } = form;
          const checkHasErrors = ladder.hasErrors(orders);
          if (checkHasErrors) {
            throw "Batch has quote or base amounts below min required";
          }
          const batched = ladder.batch(orders, symbol, side);
          const { orderResponses } = onExchange({ orderParams: batched }, true);
          const { unSuccessfulOrders, successfulOrders } =
            ladder.checkSuccess(orderResponses);
          const batchOrderIDs = successfulOrders.map((o, i) => {
            return {
              order_id: o.data.orderId,
              error_detail: true,
              is_pending: true,
              symbol: form.symbol,
              create_time: new Date(),
              side: form.side,
              type: form.smartOrderType,
              price: form.price,
              price_avg: "0",
              size: form.size,
              notional: "",
              filled_notional: "",
              filled_size: "",
              unfilled_volume: "",
              status: "",
              is_smart: true,
              source_id: isInfinite ? true : "",
              tp_price: form.orders[i].tp,
            };
          });
          DB.Orders.addIDs(whichSheet[form.side], batchOrderIDs);
          const { ordersToAdd, tradesToAdd } = successfulOrders
            .map((o) => {
              const order_id = o.data.orderId;
              return checkStatus(order_id, true);
            })
            .reduce(
              (t, el) => {
                const { sheet, data } = el;
                if (sheet == "closed") {
                  t.tradesToAdd.push(data);
                } else {
                  t.ordersToAdd.push(data);
                }
                return t;
              },
              { ordersToAdd: [], tradesToAdd: [] }
            );
          DB.Orders.updateDetails(whichSheet[form.side], ordersToAdd);
          if (tradesToAdd.length) {
            DB.Trades.add(tradesToAdd);
            tradesToAdd.forEach((t) => {
              const { order_id } = t;
              DB.Orders.remove(order_id);
            });
          }
          const issues = {
            error: true,
            result: {
              message: {},
            },
            where: "placeBatchOrders",
          };
          if (unSuccessfulOrders.length > 0) {
            const http = {
              error: "Some orders unsuccessful http request",
              failed: unSuccessfulOrders,
            };
            issues.result.message.http = http;
          }
          if (unSuccessfulOrders.length > 0) {
            throw JSON.stringify(issues);
          }
          return true;
        },
      },
    };
    return actions[form.smartTradeType].place();
  } catch (error) {
    throw error;
  }
};
// Order Book ===========================================
const getOrderBook = (symbol) => {
  try {
    const request = Bitmart("Markets", "getDepth", { symbol });
    const { error, result } = request;
    if (error) {
      throw JSON.stringify(request);
    }
    const totalToQuote = (b) => {
      const dot = b.price.indexOf(".");
      if (dot > -1) {
        b.total = (Number(b.price) * Number(b.amount)).toFixed(
          b.price.split(".")[1].length
        );
      } else {
        b.total = (Number(b.price) * Number(b.amount)).toString();
      }
      return b;
    };
    result.data.buys = result.data.buys.map(totalToQuote);
    result.data.sells = result.data.sells.map(totalToQuote);
    result.data.sells.reverse();
    return result.data;
  } catch (error) {
    throw error;
  }
};
// Import ===========================================
const importActive = (symbol) => {
  const actions = {
    import: () => {
      const request = Bitmart(
        "Trade",
        "getUserOrders",
        {
          symbol,
          N: 100,
          status: 9,
        },
        true
      );
      const { error, result } = request;
      if (error) {
        throw JSON.stringify(request);
      }
      return result;
    },
    checkStatus: (orders) => {
      if (!orders.length) {
        return false;
      }
      const addMeta = orders.map((order) => {
        switch (order.status) {
          case "1":
            order.error_detail = true;
          case "2":
            order.is_pending = true;
            break;
          case "4":
            order.is_pending = false;
            order.error_detail = false;
            break;
          case "5":
            order.is_pending = false;
            order.error_detail = false;
            break;
          case "6":
            order.is_pending = false;
            order.error_detail = false;
            break;
          case "7":
            order.is_pending = true;
            order.error_detail = false;
            break;
          case "8":
            order.is_pending = false;
            order.error_detail = false;
            break;
          default:
            break;
        }
        order.is_smart = false;
        return order;
      });
      return addMeta;
    },
    addToDB: (ordersToAdd) => {
      const active = DB.Actions.View.all().map((t) => {
        return t.order_id;
      });
      const readyToAdd = ordersToAdd.filter((order) => {
        return active.indexOf(order.order_id.toString()) == -1;
      });
      DB.Orders.updateDetails("simple", readyToAdd);
    },
  };
  const result = actions.import();
  const readyToAdd = actions.checkStatus(result.data.orders);
  if (readyToAdd) {
    actions.addToDB(readyToAdd);
    DB.Actions.Sort.sheet("simple", 5);
  }
  return { result: "Complete", headers: result.headers };
};
const importClosed = (symbol) => {
  let headers;
  const firstRequest = Bitmart(
    "Trade",
    "getUserTrades",
    {
      symbol,
      offset: 1,
      limit: 100,
    },
    true
  );

  if (firstRequest.error) {
    throw JSON.stringify(firstRequest);
  }
  headers = firstRequest.result.headers;
  const firstPageTrades = firstRequest.result.data.trades;
  let secondPageTrades = [];
  if (firstPageTrades.length == 100) {
    const secondRequest = Bitmart(
      "Trade",
      "getUserTrades",
      {
        symbol,
        offset: 2,
        limit: 100,
      },
      true
    );
    if (secondRequest.error) {
      throw JSON.stringify(secondRequest);
    }
    secondPageTrades = secondRequest.result.data.trades;
    headers = secondRequest.result.headers;
  }
  const totalTrades = [...firstPageTrades, ...secondPageTrades];
  if (totalTrades.length) {
    const dbClosed = DB.Actions.View.fmt("closed").map((t) => {
      return t.detail_id;
    });
    const readyToAdd = totalTrades.filter((trade) => {
      return dbClosed.indexOf(trade.detail_id.toString()) == -1;
    });
    DB.Trades.add(readyToAdd);
  }
  return { result: "Complete", headers };
};
// Trigger ===========================================
const createSmartTrigger = () => {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    const names = triggers.map((t) => {
      return t.getHandlerFunction();
    });

    if (!names.includes("BitmartSimpleTrigger")) {
      ScriptApp.newTrigger("BitmartSimpleTrigger")
        .timeBased()
        .everyMinutes(5)
        // .nearMinute(10)
        .create();
    }
    if (!names.includes("BitmartSmartBuyTrigger")) {
      ScriptApp.newTrigger("BitmartSmartBuyTrigger")
        .timeBased()
        .everyMinutes(5)
        // .nearMinute(20)
        .create();
    }
    if (!names.includes("BitmartSmartSellTrigger")) {
      ScriptApp.newTrigger("BitmartSmartSellTrigger")
        .timeBased()
        .everyMinutes(5)
        // .nearMinute(30)
        .create();
    }
    if (!names.includes("fetchQuotaReset")) {
      ScriptApp.newTrigger("fetchQuotaReset")
        .timeBased()
        .everyDays(1)
        // .nearMinute(30)
        .create();
    }
  } catch (error) {
    throw error;
  }
};
const deleteSmartTrigger = () => {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    const names = triggers.map((t) => {
      return { name: t.getHandlerFunction(), trigger: t };
    });
    for (const el of names) {
      if (el.name == "BitmartSimpleTrigger") {
        ScriptApp.deleteTrigger(el.trigger);
      }
      if (el.name == "BitmartSmartBuyTrigger") {
        ScriptApp.deleteTrigger(el.trigger);
      }
      if (el.name == "BitmartSmartSellTrigger") {
        ScriptApp.deleteTrigger(el.trigger);
      }
      if (el.name == "fetchQuotaReset") {
        ScriptApp.deleteTrigger(el.trigger);
      }
    }
  } catch (error) {
    throw error;
  }
};
const urlFetchQuota = () => {
  const RL = Prop().find("rateLimit");
  if (RL) {
    return RL.urlFetchCount;
  } else {
    return 0;
  }
};
const fetchQuotaReset = () => {
  const RL = Prop().find("rateLimit");
  const reset = {
    urlFetchCount: 0,
  };
  if (RL) {
    reset.rateLimitRemaining = RL.rateLimitRemaining;
    reset.rateLimitMax = RL.rateLimitMax;
    reset.rateLimitReset = RL.rateLimitReset;
  } else {
    reset.rateLimitRemaining = 0;
    reset.rateLimitMax = 0;
    reset.rateLimitReset = 0;
  }
  Prop().save("rateLimit", reset);
  UpdateCheck();
};
const BitmartSimpleTrigger = () => {
  const data = DB.Actions.View.fmt("simple");
  if (data.length) {
    triggerActions(data);
  }
};
const BitmartSmartBuyTrigger = () => {
  const data = DB.Actions.View.fmt("smartBuy");
  if (data.length) {
    triggerActions(data);
  }
};
const BitmartSmartSellTrigger = () => {
  const data = DB.Actions.View.fmt("smartSell");
  if (data.length) {
    triggerActions(data);
  }
};
const triggerActions = (dbData) => {
  const actions = {
    checkForAPI: () => {
      const exists = Prop().find("apiSettings");
      if (!exists) {
        return false;
      }
      return true;
    },
    collectSymbols: () => {
      const symbols = [];
      dbData.forEach((row) => {
        if (row.symbol) {
          if (!symbols.includes(row.symbol)) {
            symbols.push(row.symbol);
          }
        }
      });
      return symbols;
    },
    getExchangeData: (symbolsToCheck) => {
      return symbolsToCheck.reduce(
        (t, symbol) => {
          const outstanding = getExOrders(symbol, 9);
          const filledOrCanceled = getExOrders(symbol, 10);
          const trades = getExTrades(symbol);
          t.exchangeOrders = [
            ...t.exchangeOrders,
            ...outstanding,
            ...filledOrCanceled,
          ];
          t.exchangeTrades = [...t.exchangeTrades, ...trades];
          return t;
        },
        { exchangeOrders: [], exchangeTrades: [] }
      );
    },
    checkStatus: (dbOrder, exOrder, t) => {
      switch (exOrder.status) {
        case "1":
          DB.Orders.remove(exOrder.order_id);
          break;
        case "2":
          exOrder.is_pending = true;
          exOrder.error_detail = false;
          exOrder.is_smart = dbOrder.is_smart;
          if (exOrder.is_smart == "true") {
            exOrder.source_id = dbOrder.source_id;
            exOrder.tp_price = dbOrder.tp_price;
            exOrder.sheet = dbOrder.sheet;
          }
          if (dbOrder.status !== exOrder.status) {
            t.updates[dbOrder.sheet].push(exOrder);
          }
          break;
        case "4":
          exOrder.is_pending = false;
          exOrder.error_detail = false;
          exOrder.is_smart = dbOrder.is_smart;
          if (exOrder.is_smart == "true") {
            exOrder.source_id = dbOrder.source_id;
            exOrder.tp_price = dbOrder.tp_price;
            exOrder.sheet = dbOrder.sheet;
          }
          if (dbOrder.status !== exOrder.status) {
            t.updates[dbOrder.sheet].push(exOrder);
          }
          break;
        case "5":
          exOrder.is_pending = false;
          exOrder.error_detail = false;
          exOrder.is_smart = dbOrder.is_smart;
          if (exOrder.is_smart == "true") {
            exOrder.source_id = dbOrder.source_id;
            exOrder.tp_price = dbOrder.tp_price;
            exOrder.sheet = dbOrder.sheet;
          }
          if (
            Number(exOrder.unfilled_volume) !== Number(dbOrder.unfilled_volume)
          ) {
            t.updates[dbOrder.sheet].push(exOrder);
            t.partial.push(exOrder);
          }
          break;
        case "6":
          exOrder.is_pending = false;
          exOrder.error_detail = false;
          exOrder.is_smart = dbOrder.is_smart;
          if (exOrder.is_smart == "true") {
            exOrder.source_id = dbOrder.source_id;
            exOrder.tp_price = dbOrder.tp_price;
            exOrder.sheet = dbOrder.sheet;
          }
          t.closed.push(exOrder);
          break;
        case "7":
          exOrder.is_pending = true;
          exOrder.error_detail = false;
          exOrder.is_smart = dbOrder.is_smart;
          if (exOrder.is_smart == "true") {
            exOrder.source_id = dbOrder.source_id;
            exOrder.tp_price = dbOrder.tp_price;
            exOrder.sheet = dbOrder.sheet;
          }
          if (dbOrder.status !== exOrder.status) {
            t.updates[dbOrder.sheet].push(exOrder);
          }
          break;
        case "8":
          exOrder.is_pending = false;
          exOrder.error_detail = false;
          exOrder.is_smart = dbOrder.is_smart;
          if (exOrder.is_smart == "true") {
            exOrder.source_id = dbOrder.source_id;
            exOrder.tp_price = dbOrder.tp_price;
            exOrder.sheet = dbOrder.sheet;
          }
          t.closed.push(exOrder);
          break;
        default:
          break;
      }
      return t;
    },
    lookForPartialAndFilled: (exOrders) => {
      const exchangeOrderIDs = exOrders.map((o) => {
        return o.order_id.toString();
      });
      return dbData.reduce(
        (t, dbOrder) => {
          const exOrderIndex = exchangeOrderIDs.indexOf(dbOrder.order_id);
          if (exOrderIndex > -1) {
            const foundOrderOnExchange = exOrders[exOrderIndex];
            t = actions.checkStatus(dbOrder, foundOrderOnExchange, t);
          } else {
            const getLeftOverInfo = getExOrderInfo(dbOrder.order_id);
            t = actions.checkStatus(dbOrder, getLeftOverInfo, t);
          }
          return t;
        },
        {
          updates: {
            simple: [],
            smartBuy: [],
            smartSell: [],
          },
          partial: [],
          closed: [],
        }
      );
    },
    handleUpdates: (updates) => {
      for (const sheet in updates) {
        if (Object.hasOwnProperty.call(updates, sheet)) {
          const ordersArr = updates[sheet];
          if (ordersArr.length) {
            ordersArr.forEach((o) => {
              if ("sheet" in o) {
                delete o.sheet;
              }
            });
            DB.Orders.updateDetails(sheet, ordersArr);
          }
        }
      }
    },
    handlePartial: (partialOrders) => {
      const createChunks = chunk(partialOrders, 5, "arr");
      createChunks.forEach((chunk) => {
        const createNotifications = chunk.reduce((t, el) => {
          return (t += t.length
            ? "\n" + actions.partialNotification(el)
            : actions.partialNotification(el));
        }, "");
        sendToWebhook(createNotifications);
      });
    },
    partialNotification: (exOrder) => {
      const ex_order_id = exOrder.order_id;
      const ex_symbol = exOrder.symbol;
      const ex_side = exOrder.side;
      const ex_size = exOrder.size;
      const ex_notional = exOrder.notional;
      const ex_filled_notional = exOrder.filled_notional;
      const ex_filled_size = exOrder.filled_size;
      const price = exOrder.price ? exOrder.price : exOrder.price_avg;
      const createNotification = `--- ${new Date().toLocaleString()}
        ID: ${ex_order_id}   ${ex_symbol}   ${ex_side}   partial fill \n==> Price: ${price} :: Q: ${ex_filled_notional}/${ex_notional} :: B: ${ex_filled_size}/${ex_size}
        `;
      return createNotification;
    },
    handleFinished: (closedExOrders, exTrades) => {
      const dbClosed = DB.Actions.View.fmt("closed").map((t) => {
        return t.detail_id;
      });
      const { notifications, toAdd, toRemove, isSmart } = closedExOrders.reduce(
        (t, exOrder) => {
          const completedTradesInfo = exTrades.filter((trade) => {
            return exOrder.order_id == trade.order_id;
          });
          if (
            exOrder.is_smart == "true" &&
            (!exOrder.source_id || exOrder.source_id == "true")
          ) {
            t.isSmart.push(exOrder);
          } else {
            t.toRemove.push(exOrder.order_id);
          }
          t.notifications.push(exOrder);
          completedTradesInfo.forEach((newTradeInfo) => {
            const checkIfAlreadyInDB = dbClosed.indexOf(
              newTradeInfo.detail_id.toString()
            );
            if (checkIfAlreadyInDB == -1) {
              t.toAdd.push(newTradeInfo);
            }
          });

          return t;
        },
        { notifications: [], toAdd: [], toRemove: [], isSmart: [] }
      );
      DB.Trades.add(toAdd);
      toRemove.forEach((id) => {
        DB.Orders.remove(id);
      });
      const createChunks = chunk(notifications, 5, "arr");
      createChunks.forEach((chunk) => {
        const createNotifications = chunk.reduce((t, el) => {
          return (t += t.length
            ? "\n" + actions.finishedNotification(el)
            : actions.finishedNotification(el));
        }, "");
        sendToWebhook(createNotifications);
      });
      actions.handleSmartTrade(isSmart);
    },
    finishedNotification: (order) => {
      const { order_id, symbol, side, price, price_avg, notional, size } =
        order;
      const priceFmt =
        Number(price) > 0
          ? eToNumber(Number(price))
          : eToNumber(Number(price_avg));
      const createNotification = `--- ${new Date().toLocaleString()}
        ID: ${order_id}   ${symbol}   ${side}   filled \n==> Price: ${priceFmt} :: Q: ${notional} :: B: ${size}
        `;
      return createNotification;
    },
    handleSmartTrade: (orders) => {
      const createTpOrders = orders.map((o) => {
        const newOrder = {
          sheet: {
            source_id: o.source_id,
            base_id: o.order_id,
            tp_price: Number(o.price) > 0 ? o.price : o.price_avg,
            source: o.sheet,
            moveTo: o.side == "buy" ? "smartSell" : "smartBuy",
          },
          order: {
            symbol: o.symbol,
            side: o.side == "buy" ? "sell" : "buy",
            type: "limit",
            size: o.size,
            price: o.tp_price,
          },
        };
        return newOrder;
      });
      const { smartBuy, smartSell, toRemove } = createTpOrders.reduce(
        (t, o) => {
          try {
            const request = actions.onExchange(o.order);
            t[o.sheet.moveTo].push({
              forUpdate: {
                order_id: request.order_id,
                error_detail: true,
                is_pending: true,
                symbol: o.order.symbol,
                create_time: new Date(),
                side: o.order.side,
                type: o.order.type,
                price: o.order.price,
                price_avg: "0",
                size: o.order.size,
                notional: "",
                filled_notional: "",
                filled_size: "",
                unfilled_volume: "",
                status: "",
                is_smart: true,
                source_id: o.sheet.source_id == "true" ? true : o.sheet.base_id,
                tp_price: o.sheet.tp_price,
              },
              forNotify: {
                base_id: o.sheet.base_id,
                order_id: request.order_id,
                orderDetails: o.order,
              },
            });
          } catch (error) {
            t.toRemove.push({
              forNotify: {
                base_id: o.sheet.base_id,
              },
            });
            console.log(error);
          }
          return t;
        },
        { smartBuy: [], smartSell: [], toRemove: [] }
      );
      const addBuyIds = smartBuy.map((o) => {
        return o.forUpdate;
      });
      DB.Actions.Sort.sheet("smartBuy", 5);
      DB.Orders.addIDs("smartBuy", addBuyIds);
      const addSellIds = smartSell.map((o) => {
        return o.forUpdate;
      });
      DB.Actions.Sort.sheet("smartSell", 5);
      DB.Orders.addIDs("smartSell", addSellIds);
      const comb = [...smartBuy, ...smartSell, ...toRemove];
      comb.forEach((o) => {
        DB.Orders.remove(o.forNotify.base_id);
      });
      const createChunks = chunk(comb, 5, "arr");
      createChunks.forEach((chunk) => {
        const createNotifications = chunk.reduce((t, el) => {
          return (t += t.length
            ? "\n" + actions.smartNotification(el)
            : actions.smartNotification(el));
        }, "");
        sendToWebhook(createNotifications);
      });
    },
    onExchange: (tradeParams, batch = false) => {
      const which = batch ? "batchOrder" : "placeOrder";
      const request = Bitmart("Trade", which, tradeParams);
      const { error, result } = request;
      if (error) {
        throw JSON.stringify(request);
      }
      return result.data;
    },
    smartNotification: (order) => {
      const { base_id, order_id } = order.forNotify;
      const { symbol, side, size, price } = order.forNotify.orderDetails;
      const createNotification = `--- ${new Date().toLocaleString()}
        ST:  ${base_id}   ID: ${order_id}   ${symbol}   ${side}  Placed \n==> Price: ${eToNumber(
        price
      )} :: B: ${size}
        `;
      return createNotification;
    },
  };
  if (!actions.checkForAPI()) {
    deleteSmartTrigger();
    return;
  }
  const symbolsToCheck = actions.collectSymbols();
  const { exchangeOrders, exchangeTrades } =
    actions.getExchangeData(symbolsToCheck);
  const { updates, partial, closed } =
    actions.lookForPartialAndFilled(exchangeOrders);
  actions.handleUpdates(updates);
  actions.handlePartial(partial);
  actions.handleFinished(closed, exchangeTrades);
};
