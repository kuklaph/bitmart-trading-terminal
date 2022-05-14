const fetchKlinesForQuickview = (symbolArray, step = 60) => {
  try {
    const klines = symbolArray.map((symbol) => {
      const [dates] = calcTimestamp(step, null, 1);
      const { from, to } = dates;
      const { error, result } = Bitmart("Markets", "getKline", {
        from,
        to,
        symbol,
        step,
      });
      if (error) {
        throw result;
      }
      const kline = result.data.klines.map((k) => {
        return {
          time: k.timestamp,
          high: Number(k.high),
          low: Number(k.low),
          open: Number(k.open),
          close: Number(k.close),
          volume: Number(k.volume),
          quote_volume: Number(k.quote_volume),
        };
      });
      return { symbol, kline };
    });
    return klines;
  } catch (error) {
    Logger.log(error);
    throw error;
  }
};
const saveFavLinks = (linksToSave) => {
  const save = Prop().save("favLinks", linksToSave);
  if (save) {
    return true;
  }
};
const loadFavLinks = () => {
  const hasLinks = Prop().find("favLinks");
  if (!hasLinks) {
    return [];
  }
  return hasLinks;
};
const clearFavLinks = () => {
  const remove = Prop().remove("favLinks");
  if (remove) {
    return true;
  }
};
