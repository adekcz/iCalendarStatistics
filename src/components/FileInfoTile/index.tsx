interface FileInfoTileProps {
  label: string; 
  minutes: number 
}

function FileInfoTile({label, minutes}: FileInfoTileProps) {
  let hours = minutes / 60;
  let days = hours / 24;
  return (
    <div className="infoTile">
      <h2> {label}</h2>
      <div>
        <p>total minutes: {minutes.toFixed(2)}</p>
        <p>total hours: {hours.toFixed(2)}</p>
        <p>total days: {days.toFixed(2)}</p>
      </div>
    </div>
  );
}

export { FileInfoTile };
