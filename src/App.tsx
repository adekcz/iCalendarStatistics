import React, { ChangeEvent } from "react";
import { useState, useReducer } from "react";
import ICalParser, { EventJSON, ICalJSON } from "ical-js-parser";
import { getDurationInMinutes, toDate } from "./utils/DateUtils";
import { readFile } from "./utils/FileUtils";

import { FileData } from "./components/FileData";
import { FileInfoTile } from "./components/FileInfoTile";
import "./App.css";

import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

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

let renderTableRow = function (
  event: EventJSON,
  state: State,
  dispatch: React.Dispatch<Action>,
  showAllData: boolean
) {
  return (
    <tr
      key={getEventJsonHashCode(event)}
      className={
        state.eventInclusions.get(getEventJsonHashCode(event)) ? "checked" : ""
      }
    >
      <td>{toDate(event.dtstart.value).toLocaleString()}</td>
      <td>{toDate(event.dtend.value).toLocaleString()}</td>

      <td>{event.summary}</td>
      <td> {getDurationInMinutes(eventToTimeInterval(event))}</td>
      <td>
        <label htmlFor={getEventJsonHashCode(event) + "_CB"}>
          <input
            id={getEventJsonHashCode(event) + "_CB"}
            type="checkbox"
            checked={
              state.eventInclusions.get(getEventJsonHashCode(event)) || false
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
      {!showAllData || (
        <td>
          <div className="fixedSized">{JSON.stringify(event)}</div>
        </td>
      )}
    </tr>
  );
};

function filterDates(events: EventJSON[], startDate: Date, endDate: Date) : EventJSON[] {
  return events
    .filter(event => toDate(event.dtstart.value) >= startDate)
    .filter(event => toDate(event.dtend.value) <= endDate);
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showAllData, setShowAllData] = useState(false);
  const [startDate, setStartDate] = useState(new Date("2022/06/01"));
  const [endDate, setEndDate] = useState(new Date());

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

  let totalMinutes = filterDates(state.content.events, startDate, endDate)
    .map((event) => getDurationInMinutes(eventToTimeInterval(event)))
    .reduce((a, b) => a + b, 0);

  let selectedMinutes = filterDates(state.content.events, startDate, endDate)
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
        <div className="tableControls">
          <button
            onClick={() => dispatch({ type: "mark-all", isChecked: true })}
          >
            Select all
          </button>
          <button
            onClick={() => dispatch({ type: "mark-all", isChecked: false })}
          >
            Deselect all
          </button>
          <label htmlFor={"showAllData"}>
            show all data
            <input
              id="showAllData"
              type="checkbox"
              checked={showAllData}
              onChange={(val) => setShowAllData(val.target.checked)}
            />
          </label>
          <label htmlFor="startDatePicker">
          start
          <DatePicker
        selected={startDate}
        onChange={(date) => setStartDate(date || new Date())}
        selectsStart
        startDate={startDate}
        endDate={endDate}
      />
          </label>
          <label htmlFor="endDatePicker">
          end
          <DatePicker
        selected={endDate}
        onChange={(date) => setEndDate(date  || new Date())}
        selectsEnd
        startDate={startDate}
        endDate={endDate}
        minDate={startDate}
      />
          </label>
        
        </div>

        <table>
          <thead>
            <tr>
              <th>date start</th>
              <th>date end</th>
              <th>summary</th>
              <th>minutes</th>
              <th>include</th>
              {!showAllData || <th>all data</th>}
            </tr>
          </thead>
          <tbody>
            {filterDates(state.content.events, startDate, endDate).map((event) =>
              renderTableRow(event, state, dispatch, showAllData)
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default App;
