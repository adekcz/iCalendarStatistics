import { eventNames } from "process";
import React, { ChangeEvent } from "react";
import { useState, useEffect, useContext } from "react";
import { Dispatch, SetStateAction } from "react";

import "./App.css";

function readFile(file: File, setLines: Dispatch<SetStateAction<string>>) {
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
        setLines(outcome);
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

  let [content, setContent] = useState("empty");
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

    let lines = readFile(file, (val) => {console.log(val); setContent(val)});
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

  return (
    <div>
      <h1>GeeksforGeeks</h1>
      <h3>File Upload using React!</h3>
      <div>
        <input type="file" onChange={onFileChange} />
        <button onClick={onFileUpload}>Upload!</button>
      </div>
      {fileData()}
    </div>
  );
}

export default App;
