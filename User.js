const saveAPI = (memo, key, secret) => {
  try {
    Prop().save("apiSettings", { bitmart: { memo, key, secret } });
    createSmartTrigger();
    return true;
  } catch (error) {
    throw error;
  }
};
const deleteAPI = () => {
  Prop().remove("apiSettings");
};
const checkAPI = () => {
  const c = Prop().find("apiSettings");
  if (c) {
    return true;
  } else {
    return false;
  }
};

// Notifications ===========================================
const saveWebhook = (URL) => {
  try {
    const testMsg = "Bitmart Webhook test successful!";
    const params = {
      headers: {
        method: "POST",
      },
      payload: {
        content: testMsg,
      },
    };
    const request = UrlFetchApp.fetch(URL, params);
    if (request.getResponseCode() == 204) {
      Prop().save("webhook", URL);
      return true;
    }
  } catch (error) {
    throw error;
  }
};
const deleteWebhook = () => {
  Prop().remove("webhook");
};
const sendToWebhook = (msg) => {
  try {
    const URL = Prop().find("webhook");
    if (URL) {
      //const template = {
      //  embeds: [msg],
      //};
      const content = typeof msg == "string" ? msg : JSON.stringify(msg);
      const params = {
        headers: {
          method: "POST",
        },
        payload: {
          content,
        },
      };
      UrlFetchApp.fetch(URL, params);
    }
  } catch (error) {
    console.log(error);
  }
};
