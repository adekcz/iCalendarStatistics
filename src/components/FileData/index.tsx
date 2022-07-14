interface FileDataProps {
  file: File;
}

// File content to be displayed after
// file upload is complete
function FileData({file}: FileDataProps) {
  return (
    <div className="infoTile">
      <h2>File Details:</h2>

      <p>File Name: {file.name}</p>

      <p>File Type: {file.type}</p>

      <p>Last Modified: {new Date(file.lastModified).toLocaleString()}</p>
    </div>
  );
}

export { FileData };
