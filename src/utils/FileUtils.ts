import ICalParser, { ICalJSON } from "ical-js-parser";

function readFile(
  file: File,
  readICalJson: (file: File, content: ICalJSON) => void
) {
  const reader = new FileReader();

  reader.onload = (event: ProgressEvent<FileReader>) => {
    let target = event.target;
    if (target && target.result) {
      const fileData = target.result;
      if (typeof fileData === "string") {
        const resultJSON = ICalParser.toJSON(fileData);
        console.log(resultJSON);
        readICalJson(file, resultJSON);
      } else {
        console.log("file is not string");
      }
    } else {
      console.log("no file found");
    }
  };

  reader.onerror = (event: ProgressEvent<FileReader>) => {
    if (event) {
      if (event.target) {
        if (event.target.error) {
          alert(event.target.error.name);
        }
      }
    }
  };
  reader.readAsText(file);
}

export { readFile };
