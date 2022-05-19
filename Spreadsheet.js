const ID = () => {
  const ID = SpreadsheetApp.getActiveSpreadsheet().getId();
  return `https://docs.google.com/spreadsheets/d/${ID}/edit`;
};
const Database = () => {
  const sas = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = {
    simple: sas.getSheetByName("Simple Active"),
    closed: sas.getSheetByName("Closed Trades"),
    smartBuy: sas.getSheetByName("Smart Buy Active"),
    smartSell: sas.getSheetByName("Smart Sell Active"),
  };

  const Actions = {
    View: {
      raw: (sheet) => {
        try {
          return sheets[sheet].getDataRange().getValues();
        } catch (error) {
          throw `Spreadsheet Error View Raw: ${error}`;
        }
      },
      fmt: (sheet) => {
        try {
          return Actions.Convert.rowToObj(
            sheet,
            Actions.View.raw(sheet)
          ).filter((r) => {
            return r.order_id;
          });
        } catch (error) {
          throw `Spreadsheet Error View Formatted: ${error}`;
        }
      },
      all: () => {
        try {
          const { fmt } = Actions.View;
          const m = [fmt("simple"), fmt("smartBuy"), fmt("smartSell")].flat();
          return m;
        } catch (error) {
          throw `Spreadsheet Error View All: ${error}`;
        }
      },
      headers: (sheet) => {
        try {
          return sheets[sheet]
            .getRange(1, 1, 1, sheets[sheet].getLastColumn())
            .getValues()
            .flat();
        } catch (error) {
          throw `Spreadsheet Error headers: ${error}`;
        }
      },
    },
    Add: {
      toEnd: (sheet, col, numRows, numCols, data) => {
        try {
          sheets[sheet]
            .getRange(sheets[sheet].getLastRow() + 1, col, numRows, numCols)
            .setValues(data);
          SpreadsheetApp.flush();
        } catch (error) {
          throw `Spreadsheet Error Add toEnd: ${error}`;
        }
      },
      withRowIndex: (sheet, index, data) => {
        try {
          sheets[sheet]
            .getRange(index, 1, data.length, data[0].length)
            .setValues(data);
          SpreadsheetApp.flush();
        } catch (error) {
          throw `Spreadsheet Error Add wRowIndex: ${error}`;
        }
      },
    },
    Convert: {
      ordersToRows: (orders, headers) => {
        try {
          if (!Array.isArray(orders)) {
            orders = [orders];
          }
          const rows = orders.map((order) => {
            const row = Object.keys(order)
              .map((key) => {
                if (key == "create_time") {
                  order[key] = new Date(order[key])
                    .toLocaleString()
                    .split(",")
                    .join(" ");
                }

                const index = headers.indexOf(key);
                if (index > -1) {
                  return { val: order[key], col: index + 1 };
                }
              })
              .sort((a, b) => {
                return a.col - b.col;
              })
              .map((f) => {
                return f.val;
              });
            return row;
          });
          return rows;
        } catch (error) {
          throw `Spreadsheet Error ordersToRows: ${error}`;
        }
      },
      tradesToRows: (trades) => {
        try {
          const headers = Actions.View.headers("closed");
          if (!Array.isArray(trades)) {
            trades = [trades];
          }
          const rows = trades.map((trade) => {
            const row = Object.keys(trade)
              .map((key) => {
                if (key == "create_time") {
                  trade[key] = new Date(trade[key])
                    .toLocaleString()
                    .split(",")
                    .join(" ");
                }
                const index = headers.indexOf(key);
                if (index > -1) {
                  return { val: trade[key], col: index + 1 };
                }
              })
              .sort((a, b) => {
                return a.col - b.col;
              })
              .map((f) => {
                return f.val;
              });
            return row;
          });
          return rows;
        } catch (error) {
          throw `Spreadsheet Error tradesToRows: ${error}`;
        }
      },
      rowToObj: (sheet, multiDimensionalArray) => {
        try {
          const [headers] = multiDimensionalArray;
          const singleArrOfObjs = [];
          for (
            let rowIndex = 0;
            rowIndex < multiDimensionalArray.length;
            rowIndex++
          ) {
            const row = multiDimensionalArray[rowIndex];
            if (rowIndex) {
              const obj = row.reduce((t, col, colIndex) => {
                const header = headers[colIndex];
                if (header == "create_time") {
                  if (col) {
                    t[header] = new Date(col)
                      .toLocaleString()
                      .split(",")
                      .join("");
                  }
                } else {
                  t[header] = col.toString();
                  t.sheet = sheet;
                  t.row = rowIndex + 1;
                }
                return t;
              }, {});
              singleArrOfObjs.push(obj);
            }
          }
          return singleArrOfObjs;
        } catch (error) {
          throw `Spreadsheet Error rowToObj: ${error}`;
        }
      },
    },
    Find: {
      inAll: (key, item) => {
        try {
          const rows = Actions.View.all();
          const [search] = rows.filter((f) => {
            return f[key] == item;
          });
          return search;
        } catch (error) {
          throw `Spreadsheet Error Find: ${error}`;
        }
      },
      withIndex: (sheet, index) => {
        try {
          const rows = Actions.View.fmt(sheet);
          const mapped = rows.map((m) => {
            return m[index];
          });
          return mapped;
        } catch (error) {
          throw `Spreadsheet Error Find: ${error}`;
        }
      },
    },
    Sort: {
      sheet: (sheet, col) => {
        const s = sheets[sheet];
        const maxRows = s.getMaxRows();
        const maxCols = s.getMaxColumns();
        s.getRange(2, 1, maxRows - 1, maxCols).sort(col);
      },
    },
  };
  const Methods = {
    Actions,
    Orders: {
      addIDs: (sheet, orders) => {
        try {
          if (!Array.isArray(orders)) {
            orders = [orders];
          }
          if (!orders.length) {
            return;
          }
          const headers = Actions.View.headers(sheet);
          const rows = Actions.Convert.ordersToRows(orders, headers);
          const arrayLen = rows.length;
          if (arrayLen > 1) {
            DB.Actions.Add.toEnd(sheet, 1, arrayLen, rows[0].length, rows);
          } else {
            DB.Actions.Add.toEnd(sheet, 1, 1, rows[0].length, rows);
          }
          SpreadsheetApp.flush();
        } catch (error) {
          throw `Spreadsheet Error Add OrderIDs: ${error}`;
        }
      },
      updateDetails: (sheet, orders) => {
        try {
          if (!Array.isArray(orders)) {
            orders = [orders];
          }
          const headers = Actions.View.headers(sheet);
          const dbOrderIds = Actions.Find.withIndex(sheet, "order_id");
          const needToAdd = orders.reduce((t, el) => {
            const index = dbOrderIds.indexOf(el.order_id.toString());
            const row = Actions.Convert.ordersToRows(el, headers);
            if (index > -1) {
              Actions.Add.withRowIndex(sheet, index + 2, row);
            } else {
              t.push(row[0]);
            }
            return t;
          }, []);
          if (needToAdd.length) {
            Actions.Add.toEnd(
              sheet,
              1,
              needToAdd.length,
              needToAdd[0].length,
              needToAdd
            );
          }
          SpreadsheetApp.flush();
        } catch (error) {
          throw `Spreadsheet Error Update Order: ${error}`;
        }
      },
      remove: (order_id) => {
        try {
          const search = Actions.Find.inAll("order_id", order_id);
          if (search) {
            const { sheet, row } = search;
            sheets[sheet].deleteRow(row);
            SpreadsheetApp.flush();
            return true;
          } else {
            throw "Spreadsheet: No order_id found";
          }
        } catch (error) {
          throw `Spreadsheet Error Remove Order: ${error}`;
        }
      },
      removeAll: (symbol, side = false) => {
        try {
          const rows = Actions.View.all();
          const activeWithSymbol = rows.filter((row) => {
            if (side) {
              return row.symbol == symbol && row.side == side;
            }
            return row.symbol == symbol;
          });
          const maxColRowsObj = {};
          activeWithSymbol.forEach((row) => {
            const sheet = row.sheet;
            maxColRowsObj[sheet] = { maxRows: 0, maxCols: 0 };
          });
          Object.keys(maxColRowsObj).forEach((key) => {
            const sheet = sheets[key];
            maxColRowsObj[key].maxRows = sheet.getMaxRows();
            maxColRowsObj[key].maxCols = sheet.getMaxColumns();
          });

          activeWithSymbol.forEach((row) => {
            const sheet = sheets[row.sheet];
            const { maxCols } = maxColRowsObj[row.sheet];
            sheet.getRange(row.row, 1, 1, maxCols).clear();
          });

          Object.keys(maxColRowsObj).forEach((key) => {
            const sheet = sheets[key];
            const { maxRows, maxCols } = maxColRowsObj[key];
            sheet.getRange(2, 1, maxRows - 1, maxCols).sort(5);
            SpreadsheetApp.flush();
            const lastRow = sheet.getLastRow();
            sheet.deleteRows(lastRow + 1, maxRows - lastRow);
          });
          SpreadsheetApp.flush();
        } catch (error) {
          throw `Spreadsheet Error Remove Orders: ${error}`;
        }
      },
    },
    Trades: {
      add: (trades) => {
        try {
          if (!trades.length) {
            return;
          }
          const rows = Actions.Convert.tradesToRows(trades);
          Actions.Add.toEnd("closed", 1, rows.length, rows[0].length, rows);
          Actions.Sort.sheet("closed", 4);
          SpreadsheetApp.flush();
        } catch (error) {
          throw `Spreadsheet Error Add Trade: ${error}`;
        }
      },
    },
  };
  return Methods;
};
