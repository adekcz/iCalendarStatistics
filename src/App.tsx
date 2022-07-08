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
  const node = (
    <div>
      <h3>File Upload using React!</h3>
      <div>
        <input type="file" onChange={props.onFileChange} />
      </div>
    </div>
  );
  if (props.file) {
    return (
      <div>
        {node}
        <div>
          <h2>File Details:</h2>

          <p>File Name: {props.file.name}</p>

          <p>File Type: {props.file.type}</p>

          <p>
            Last Modified: {new Date(props.file.lastModified).toISOString()}
          </p>
        </div>
      </div>
    );
  } else {
    return (
      <div>
        {node}
        <div>
          <br />
          <h4>Choose before Pressing the Upload button</h4>
        </div>
      </div>
    );
  }
}

function eventsInclusionDefault(content: ICalJSON) {
  return content.events.reduce(function (
    result: Map<string, boolean>,
    event: EventJSON,
    i: Number
  ) {
    result.set(event.uid!, false); //hack to use !
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
    .filter((event) => includeInCalculation.get(event.uid!))
    .map((event) => getTimeDifference(event))
    .reduce((a, b) => a + b, 0);
  let selectedHours = selectedMinutes / 60;
  let selectedDays = selectedHours / 24;

  function recalculateInclusion() {
    setIncludeInCalculation(eventsInclusionDefault(content));
  }
  function setChecked(uid: string, checked: boolean) {
    let copy = new Map();
    includeInCalculation.forEach((val, key) => copy.set(key, val));
    copy.set(uid, checked);
    setIncludeInCalculation(copy);
  }

  return (
    <div>
      <div>
        <h1>iCal statistics</h1>
        <FileData file={file} onFileChange={onFileChange} />
      </div>
      <div>
        <h2> global stats</h2>
        <div>
          <p>total minutes: {totalMinutes}</p>
          <p>total hours: {totalHours}</p>
          <p>total days: {totalDays}</p>
        </div>
        <h2> selected stats</h2>
        <div>
          <p>selected minutes: {selectedMinutes}</p>
          <p>selected hours: {selectedHours}</p>
          <p>selected days: {selectedDays}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>summary</th>
              <th>minutes</th>
              <th>controls</th>
            </tr>
          </thead>
          <tbody>
            {content.events.map((event) => (
              <tr
                key={event.uid}
                className={
                  includeInCalculation.get(event.uid!) ? "checked" : ""
                }
              >
                <td>{event.summary}</td>
                <td> {getTimeDifference(event)}</td>
                <td>
                  {" "}
                  <input
                    type="checkbox"
                    checked={includeInCalculation.get(event.uid!) || false}
                    onChange={(val) =>
                      setChecked(event.uid!, val.target.checked)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
