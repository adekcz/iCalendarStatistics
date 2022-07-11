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

export { FileData };
