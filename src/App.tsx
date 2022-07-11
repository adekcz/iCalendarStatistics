import React, { ChangeEvent } from "react";
import { useReducer } from "react";
import ICalParser, { EventJSON, ICalJSON } from "ical-js-parser";
import { getDurationInMinutes } from "./utils/DateUtils";
import { readFile } from "./utils/FileUtils";

import { FileData } from "./components/FileData";
import { FileInfoTile } from "./components/FileInfoTile";
import "./App.css";

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

function eventToTimeInterval(input: EventJSON) {
  return { start: input.dtstart.value, end: input.dtend.value };
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // On file select (from the pop up)
  let onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file: File = (event.target.files as FileList)[0];
    const readICalJSON = function (file: File, content: ICalJSON) {
      dispatch({
        type: "upload-file",
        payload: { file: file, content: content },
      });
    };
    readFile(file, readICalJSON);
  };

  let totalMinutes = state.content.events
    .map((event) => getDurationInMinutes(eventToTimeInterval(event)))
    .reduce((a, b) => a + b, 0);

  let selectedMinutes = state.content.events
    .filter((event) => state.eventInclusions.get(getEventJsonHashCode(event)))
    .map((event) => getDurationInMinutes(eventToTimeInterval(event)))
    .reduce((a, b) => a + b, 0);

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
        <FileInfoTile label="global stats" minutes={totalMinutes} />
        <FileInfoTile label="selected stats" minutes={selectedMinutes} />
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
                <td> {getDurationInMinutes(eventToTimeInterval(event))}</td>
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
