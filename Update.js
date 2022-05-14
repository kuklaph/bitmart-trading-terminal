function UpdateCheck() {
  // Dev
  // return;

  // GCP Dashboard: https://console.cloud.google.com/home/dashboard
  // Enable Apps Script API: https://console.developers.google.com/start/api?id=script
  // Apps Script API Settings: https://script.google.com/home/usersettings
  const thisScriptId = ScriptApp.getScriptId();
  const token = ScriptApp.getOAuthToken();
  const params = {
    headers: { Authorization: `Bearer ${token}` },
    muteHttpExceptions: true,
  };
  const requestSourceFiles = UrlFetchApp.fetch(
    "https://script.googleapis.com/v1/projects/1BGK16UEQzInctxJbEkH-bGsLsKZMSikbUVv_Qahc67CNflMNkEoIa5re/content",
    params
  );
  const requestSourceFilesCode = requestSourceFiles.getResponseCode();
  if (requestSourceFilesCode !== 200) {
    throw requestSourceFiles.getContentText();
  }
  const parsedSourceFiles = JSON.parse(requestSourceFiles).files;
  const thisProjectFiles = UrlFetchApp.fetch(
    `https://script.googleapis.com/v1/projects/${thisScriptId}/content`,
    params
  );
  const thisProjectFilesCode = thisProjectFiles.getResponseCode();
  if (thisProjectFilesCode !== 200) {
    throw thisProjectFiles.getContentText();
  }
  const parsedProjectFiles = JSON.parse(thisProjectFiles).files;

  // If Versions match no update required
  const [sourceVersion] = parsedSourceFiles
    .filter((file) => {
      return file.name.includes("Version");
    })
    .map((f) => {
      return f.name.split("_")[1];
    });
  const [projectVersion] = parsedProjectFiles
    .filter((file) => {
      return file.name.includes("Version");
    })
    .map((f) => {
      return f.name.split("_")[1];
    });
  if (sourceVersion == projectVersion) {
    console.log("Update Check Complete");
    return;
  }

  // Update
  const filesToUpdate = [];
  parsedSourceFiles.forEach((file) => {
    const sourceFileName = file.name;
    const sourceFileCode = file.source;
    const [fileDoesExist] = parsedProjectFiles.filter((f) => {
      return f.name == sourceFileName;
    });
    if (!fileDoesExist) {
      filesToUpdate.push(file);
    } else {
      fileDoesExist.source = sourceFileCode;
      filesToUpdate.push(fileDoesExist);
    }
  });
  params.method = "PUT";
  params.contentType = "application/json";
  params.payload = JSON.stringify({ files: filesToUpdate });
  const updateFilesRequest = UrlFetchApp.fetch(
    `https://script.googleapis.com/v1/projects/${thisScriptId}/content`,
    params
  );
  const updateFilesRequestCode = updateFilesRequest.getResponseCode();
  if (updateFilesRequestCode !== 200) {
    throw updateFilesRequest.getContentText();
  }

  console.log("Update Check Complete");
}
