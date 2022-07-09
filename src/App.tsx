import React, { ChangeEvent } from "react";
import { useReducer } from "react";
import ICalParser, { EventJSON, ICalJSON } from "ical-js-parser";

import "./App.css";

function readFile(file: File, dispatch: React.Dispatch<Action>) {
  const reader = new FileReader();

  reader.onload = (event: ProgressEvent<FileReader>) => {
    let target = event.target;
    if (target && target.result) {
      const fileData = target.result;
      if (typeof fileData === "string") {
        const resultJSON = ICalParser.toJSON(fileData);
        console.log(resultJSON);
        dispatch({
          type: "upload-file",
          payload: { file: file, content: resultJSON },
        });
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
function uploadFile(file: File, dispatch: React.Dispatch<Action>) {
  // Details of the uploaded file
  console.log(file);

  let lines = readFile(file, dispatch);
  console.log(lines);
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

function getEventJsonHashCode(event: EventJSON) {
  return event.uid! + event.dtstamp?.value + event.dtstart.value;
}

type State = {
  file: File | null;
  content: ICalJSON;
  eventInclusions: Map<string, boolean>;
};

const initialState: State = {
  file: null,
  content: ICalParser.toJSON(""),
  eventInclusions: new Map(),
};

type Action =
  | { type: "upload-file"; payload: { file: File; content: ICalJSON } }
  | { type: "set-checked"; payload: { event: EventJSON; isChecked: boolean } }
  | { type: "mark-all"; isChecked: boolean };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "mark-all": {
      let copy = new Map();
      state.eventInclusions.forEach((_, key) =>
        copy.set(key, action.isChecked)
      );
      return { ...state, eventInclusions: copy };
    }
    case "set-checked": {
      let { event, isChecked } = action.payload;
      let copy = new Map(state.eventInclusions);
      copy.set(getEventJsonHashCode(event), isChecked);
      return { ...state, eventInclusions: copy };
    }
    case "upload-file": {
      let { file, content } = action.payload;

      let eventInclusions = content.events.reduce(function (
        result: Map<string, boolean>,
        event: EventJSON,
        i: Number
      ) {
        result.set(getEventJsonHashCode(event), false); //hack to use !
        return result;
      },
      new Map());

      return { eventInclusions: eventInclusions, file: file, content: content };
    }
  }
};

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // On file select (from the pop up)
  let onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file: File = (event.target.files as FileList)[0];
    uploadFile(file, dispatch);
  };

  let totalMinutes = state.content.events
    .map((event) => getTimeDifference(event))
    .reduce((a, b) => a + b, 0);
  let totalHours = totalMinutes / 60;
  let totalDays = totalHours / 24;

  let selectedMinutes = state.content.events
    .filter((event) => state.eventInclusions.get(getEventJsonHashCode(event)))
    .map((event) => getTimeDifference(event))
    .reduce((a, b) => a + b, 0);
  let selectedHours = selectedMinutes / 60;
  let selectedDays = selectedHours / 24;

  let fileDataTile = state.file ? <FileData file={state.file} /> : null;
  return (
    <>
      <h1>iCal statistics</h1>
      <div>
        <h3>Select *.ics file exported from your calendar.</h3>
        <div>
          <input type="file" onChange={onFileChange} />
        </div>
      </div>
      <div className="rowFlex">
        {fileDataTile}
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
        <button onClick={() => dispatch({ type: "mark-all", isChecked: true })}>
          Select all
        </button>
        <button
          onClick={() => dispatch({ type: "mark-all", isChecked: false })}
        >
          Deselect all
        </button>
        <table>
          <thead>
            <tr>
              <th>summary</th>
              <th>minutes</th>
              <th>include</th>
            </tr>
          </thead>
          <tbody>
            {state.content.events.map((event) => (
              <tr
                key={getEventJsonHashCode(event)}
                className={
                  state.eventInclusions.get(getEventJsonHashCode(event))
                    ? "checked"
                    : ""
                }
              >
                <td>{event.summary}</td>
                <td> {getTimeDifference(event)}</td>
                <td>
                  <label htmlFor={getEventJsonHashCode(event) + "_CB"}>
                    <input
                      id={getEventJsonHashCode(event) + "_CB"}
                      type="checkbox"
                      checked={
                        state.eventInclusions.get(
                          getEventJsonHashCode(event)
                        ) || false
                      }
                      onChange={(val) =>
                        dispatch({
                          type: "set-checked",
                          payload: {
                            event: event,
                            isChecked: val.target.checked,
                          },
                        })
                      }
                    />
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default App;
