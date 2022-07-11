type TimeInterval = {
  start: string;
  end: string;
};
/**
 * Calculates difference between two timestamps.
 * @param event
 * @returns
 */
function getDurationInMinutes(event: TimeInterval) {
  let startDate: Date, endDate: Date;
  startDate = toDate(event.start);
  endDate = toDate(event.end);

  return (endDate.getTime() - startDate.getTime()) / (60 * 1000);
}

/**
 * parsers string representation of date to Date object
 */
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

export { getDurationInMinutes };
