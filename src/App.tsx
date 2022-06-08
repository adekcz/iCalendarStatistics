import { eventNames } from "process";
import React, { ChangeEvent } from "react";
import { useState, useEffect, useContext } from "react";
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
        const allLines = file.split(/\r\n|\n/);
        // Reading line by line
        let outcome = "";
        allLines.forEach((line: string) => {
          outcome += line;
        });
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
  };

  // On file upload (click the upload button)
  let onFileUpload = () => {
    // Create an object of formData
    const formData = new FormData();

    // Update the formData object
    formData.append("myFile", file, file.name);

    // Details of the uploaded file
    console.log(file);

    let lines = readFile(file, (val) => {
      console.log(val);
      setContent(val);
    });
    console.log(lines);

    // Request made to the backend api
    // Send formData object
    //axios.post("api/uploadfile", formData);
  };

  // File content to be displayed after
  // file upload is complete
  let fileData = () => {
    if (file) {
      return (
        <div>
          <h2>File Details:</h2>

          <p>File Name: {file.name}</p>

          <p>File Type: {file.type}</p>

          <p>Last Modified: {new Date(file.lastModified).toISOString()}</p>
        </div>
      );
    } else {
      return (
        <div>
          <br />
          <h4>Choose before Pressing the Upload button</h4>
        </div>
      );
    }
  };

  function toDate(date: string): Date {
    if (date.length == 8) {
      return new Date(
        `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(
          6,
          8
        )}`
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

  let totalMinutes = content.events.map(event => getTimeDifference(event)).reduce((a,b) => a+b, 0);
  let totalHours = totalMinutes / 60;
  let totalDays = totalHours / 24;

  function getTimeDifference(event: EventJSON) {
    let startDate: Date, endDate: Date;
    if (event.dtstart) {
      startDate = toDate(event.dtstart.value);
    } else {
      throw "no start date";
    }

    if (event.dtend) {
      endDate = toDate(event.dtend.value);
    } else {
      throw "no end date";
    }
    return (endDate.getTime() - startDate.getTime()) / (60 * 1000);
  }
  return (
    <div>
      <div>
        <h1>iCal statistics</h1>
        <h3>File Upload using React!</h3>
        <div>
          <input type="file" onChange={onFileChange} />
          <button onClick={onFileUpload}>Upload!</button>
        </div>
        {fileData()}
      </div>
      <div>
        <div>
        <p>
          total minutes: {totalMinutes}
          </p>
          <p>
          total hours: {totalHours}
          </p>
          <p>
          total days: {totalDays}
          </p>
        </div>
        <ul>
          {content.events.map((event) => (
            <li key={event.uid}>
              {" "}
              {event.summary} <p>minutes: {getTimeDifference(event)}</p>{" "}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
