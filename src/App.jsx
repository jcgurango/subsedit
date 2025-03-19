import formatDuration from "format-duration";
import { useEffect, useMemo, useRef, useState } from "react";
import Subtitle from "./components/Subtitle";
import { parseSrt, writeSrt } from "./srt";

function App() {
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(30000);
  const [subtitles, setSubtitles] = useState([]);

  const sortedSubs = useMemo(() => {
    const subs = subtitles.slice(0);
    subs.sort((a, b) => a.from - b.from);
    return subs;
  }, [subtitles]);

  useEffect(() => {
    return window.electron.receive("duration", (duration) => {
      setTotalTime(duration * 1000);
    });
  }, []);

  useEffect(() => {
    return window.electron.receive("position", (position) => {
      setCurrentTime(position * 1000);
    });
  }, []);

  useEffect(() => {
    return window.electron.receive("load", (content) => {
      setSubtitles(parseSrt(content));
    });
  }, []);

  useEffect(() => {
    return window.electron.receive("save", () => {
      window.electron.send("save", writeSrt(sortedSubs));
    });
  }, [sortedSubs]);

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 bg-white border-b py-2 flex gap-2 px-4">
        <div className="w-full flex items-center">
          <div>
            {formatDuration(currentTime, { ms: true })} /{" "}
            {formatDuration(totalTime, { ms: true })}
          </div>
        </div>
        <button
          className="rounded-md border p-3 ml-2"
          title="Add subtitle"
          onClick={() =>
            setSubtitles((s) =>
              s.concat({
                from: currentTime,
                to: currentTime,
                text: "New subtitle!",
              }),
            )
          }
        >
          +
        </button>
      </div>
      <div className="p-2">
        {sortedSubs.map((sub) => (
          <Subtitle
            key={`${sub.from}-${sub.to}-${sub.text}`}
            subtitle={sub}
            onSubtitleUpdated={(update) =>
              setSubtitles((subtitles) =>
                subtitles.map((s) => (s === sub ? update : s)),
              )
            }
            onSubtitleDeleted={() =>
              setSubtitles((subtitles) => subtitles.filter((s) => s !== sub))
            }
            currentTime={currentTime}
            onClick={(position) => {
              if (position === "start") {
                window.electron.send("seek", sub.from / 1000);
              } else {
                window.electron.send("seek", sub.to / 1000);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
