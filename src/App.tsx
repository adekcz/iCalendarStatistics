import React, { ChangeEvent } from "react";
import { useState } from "react";
import { Dispatch, SetStateAction } from "react";
import ICalParser, { EventJSON, ICalJSON } from "ical-js-parser";

import "./App.css";

function readFile(file: File, setIcalJson: Dispatch<SetStateAction<ICalJSON>>) {
  const reader = new FileReader();

  reader.onload = (event: ProgressEvent<FileReader>) => {
    let target = event.target;
    if (target && target.result) {
      const file = target.result;
      if (typeof file === "string") {
        const resultJSON = ICalParser.toJSON(file);
        setIcalJson(resultJSON);
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

// On file upload (click the upload button)
function onFileUpload(
  file: File,
  setContent: React.Dispatch<React.SetStateAction<ICalJSON>>,
  recalculateInclusion: () => void
) {
  // Create an object of formData
  const formData = new FormData();

  // Update the formData object
  formData.append("myFile", file, file.name);

  // Details of the uploaded file
  console.log(file);

  let lines = readFile(file, (val) => {
    console.log(val);
    setContent(ICalParser.toJSON(""));
    setContent(val);
    recalculateInclusion();
  });
  console.log(lines);

  // Request made to the backend api
  // Send formData object
  //axios.post("api/uploadfile", formData);
}

function toDate(date: string): Date {
  if (date.length === 8) {
    return new Date(
      `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`
    );
  }
  return new Date(
    `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(
      6,
      8
    )}T${date.substring(9, 11)}:${date.substring(11, 13)}:${date.substring(
      13,
      date.length
    )}`
  );
}

function getTimeDifference(event: EventJSON) {
  let startDate: Date, endDate: Date;
  if (event.dtstart) {
    startDate = toDate(event.dtstart.value);
  } else {
    throw new Error("no start date");
  }

  if (event.dtend) {
    endDate = toDate(event.dtend.value);
  } else {
    throw new Error("no end date");
  }
  return (endDate.getTime() - startDate.getTime()) / (60 * 1000);
}

interface FileDataProps {
  file: File;
  onFileChange: any;
}

// File content to be displayed after
// file upload is complete
function FileData(props: FileDataProps) {
  return (
    <div className="infoTile">
      <h2>File Details:</h2>

      <p>File Name: {props.file.name}</p>

      <p>File Type: {props.file.type}</p>

      <p>Last Modified: {new Date(props.file.lastModified).toLocaleString()}</p>
    </div>
  );
}

function getIdentifier(event: EventJSON) {
  return event.uid! + event.dtstamp?.value + event.dtstart.value;
}

function eventsInclusionDefault(content: ICalJSON) {
  return content.events.reduce(function (
    result: Map<string, boolean>,
    event: EventJSON,
    i: Number
  ) {
    result.set(getIdentifier(event), false); //hack to use !
    return result;
  },
  new Map());
}

function App() {
  let [file, setFile] = useState<File>(
    new File(["foo"], "foo.txt", {
      type: "text/plain",
    })
  );

  let [content, setContent] = useState<ICalJSON>(ICalParser.toJSON(""));
  // On file select (from the pop up)
  let onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file: File = (event.target.files as FileList)[0];
    setFile(file);
    onFileUpload(file, setContent, recalculateInclusion);
  };

  let totalMinutes = content.events
    .map((event) => getTimeDifference(event))
    .reduce((a, b) => a + b, 0);
  let totalHours = totalMinutes / 60;
  let totalDays = totalHours / 24;

  let [includeInCalculation, setIncludeInCalculation] = useState(
    eventsInclusionDefault(content)
  );

  let selectedMinutes = content.events
    .filter((event) => includeInCalculation.get(getIdentifier(event)))
    .map((event) => getTimeDifference(event))
    .reduce((a, b) => a + b, 0);
  let selectedHours = selectedMinutes / 60;
  let selectedDays = selectedHours / 24;

  function recalculateInclusion() {
    setIncludeInCalculation(eventsInclusionDefault(content));
  }
  function setChecked(event: EventJSON, checked: boolean) {
    let copy = new Map();
    includeInCalculation.forEach((val, key) => copy.set(key, val));
    copy.set(getIdentifier(event), checked);
    setIncludeInCalculation(copy);
  }

  return (
    <div>
      <div>
        <h1>iCal statistics</h1>
        <div>
          <h3>Select *.ics file exported from your calendar.</h3>
          <div>
            <input type="file" onChange={onFileChange} />
          </div>
        </div>
        <div className="rowFlex">
          <FileData file={file} onFileChange={onFileChange} />
          <div className="infoTile">
            <h2> global stats</h2>
            <div>
              <p>total minutes: {Number(totalMinutes).toFixed(2)}</p>
              <p>total hours: {Number(totalHours).toFixed(2)}</p>
              <p>total days: {Number(totalDays).toFixed(2)}</p>
            </div>
          </div>
          <div className="infoTile">
            <h2> selected stats</h2>
            <div>
              <p>selected minutes: {Number(selectedMinutes).toFixed(2)}</p>
              <p>selected hours: {Number(selectedHours).toFixed(2)}</p>
              <p>selected days: {Number(selectedDays).toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div>
          <h2>Events</h2>
          <table>
            <thead>
              <tr>
                <th>summary</th>
                <th>minutes</th>
                <th>include</th>
              </tr>
            </thead>
            <tbody>
              {content.events.map((event) => (
                <tr
                  key={getIdentifier(event)}
                  className={
                    includeInCalculation.get(getIdentifier(event)) ? "checked" : ""
                  }
                >
                  <td>{event.summary}</td>
                  <td> {getTimeDifference(event)}</td>
                  <td>
                    <label htmlFor={getIdentifier(event)+ "_CB"}>
                      <input
                        id={getIdentifier(event) + "_CB"}
                        type="checkbox"
                        checked={includeInCalculation.get(getIdentifier(event)) || false}
                        onChange={(val) =>
                          setChecked(event, val.target.checked)
                        }
                      />
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
