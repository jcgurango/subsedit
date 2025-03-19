function parseTimeToMilliseconds(timeStr) {
  // same as your front-end code
  const parts = timeStr.split(":"); // ["00", "06", "35,200"]
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;

  const secAndMs = parts[2].split(",");
  const seconds = parseInt(secAndMs[0], 10) || 0;
  const millis = parseInt(secAndMs[1], 10) || 0;

  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}

export function parseSrt(srtContent) {
  const blocks = srtContent.trim().split(/\r?\n\r?\n/);

  return blocks
    .map((block) => {
      const lines = block.split(/\r?\n/);
      const timeLine = lines[1] || ""; // "00:00:01,600 --> 00:00:03,200"
      const timeParts = timeLine.split("-->");
      let from = 0,
        to = 0;
      if (timeParts.length === 2) {
        from = parseTimeToMilliseconds(timeParts[0].trim()) * 1000;
        to = parseTimeToMilliseconds(timeParts[1].trim()) * 1000;
      }
      const text = lines.slice(2).join("\n");

      return {
        from,
        to,
        text,
      };
    })
    .filter(({ from, to, text }) => from || to || text);
}

function msToSrtTime(ms) {
  const date = new Date(ms);
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  const milliseconds = String(date.getUTCMilliseconds()).padStart(3, "0");

  return `${hours}:${minutes}:${seconds},${milliseconds}`;
}

export function writeSrt(subtitles) {
  return subtitles
    .map((sub, index) => {
      return `${index + 1}
${msToSrtTime(sub.from)} --> ${msToSrtTime(sub.to)}
${sub.text}\n`;
    })
    .join("\n");
}
