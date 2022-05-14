// Handles the get requests
function doGet(e) {
  UpdateCheck();
  if (!e.parameter.page) {
    // When no specific page requested, return "home page"
    return HtmlService.createTemplateFromFile("scanner")
      .evaluate()
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .setFaviconUrl("https://www.bitmart.com/fav.ico")
      .setTitle("Bitmart Utility Web App");
  }
  // else, use page parameter to pick an html file from the script
  return HtmlService.createTemplateFromFile(e.parameter["page"])
    .evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setFaviconUrl("https://www.bitmart.com/fav.ico")
    .setTitle("Bitmart Utility Web App");
}

function doPost(e) {}

// Helper function
function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}

// Helper function
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
