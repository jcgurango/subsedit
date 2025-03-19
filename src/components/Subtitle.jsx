import formatDuration from "format-duration";
import { useMemo, useState } from "react";

export default function Subtitle({
  subtitle,
  currentTime,
  onSubtitleUpdated = (newSub) => {},
  onSubtitleDeleted = () => {},
  onClick,
}) {
  const isActive = useMemo(
    () => subtitle.from <= currentTime && subtitle.to >= currentTime,
    [currentTime, subtitle.from, subtitle.to],
  );
  const [isEditing, setIsEditing] = useState(false);
  const [currentText, setCurrentText] = useState(subtitle.text);

  return (
    <div
      className={`rounded-md border p-2 mb-2 ${isActive ? "border-green-800 bg-green-50" : ""}`}
    >
      <div className="flex gap-1 mb-2">
        <div className="grid grid-cols-3 w-full">
          <div className="text-center">
            <button
              className="rounded-md border px-2 py-1 bg-white mb-1"
              onClick={() => onClick("start")}
            >
              {formatDuration(subtitle.from, { ms: true })}
            </button>
            <div className="flex justify-center gap-1">
              <button
                className="rounded-md border px-2 py-1 text-sm bg-white"
                title="Nudge Left"
                onClick={(e) => {
                  onSubtitleUpdated({
                    ...subtitle,
                    from: subtitle.from - 100,
                  });
                }}
              >
                {"<<"}
              </button>
              <button
                className="rounded-md border px-2 py-1 text-sm bg-white"
                title="Set to current time"
                onClick={(e) => {
                  onSubtitleUpdated({
                    ...subtitle,
                    from: currentTime,
                  });
                }}
              >
                {"="}
              </button>
              <button
                className="rounded-md border px-2 py-1 text-sm bg-white"
                title="Nudge Right"
                onClick={(e) => {
                  onSubtitleUpdated({
                    ...subtitle,
                    from: subtitle.from + 100,
                  });
                }}
              >
                {">>"}
              </button>
            </div>
          </div>
          <div className="text-center">{"-->"}</div>
          <div className="text-center">
            <button
              className="rounded-md border px-2 py-1 bg-white mb-1"
              onClick={() => onClick("end")}
            >
              {formatDuration(subtitle.to, { ms: true })}
            </button>
            <div className="flex justify-center gap-1">
              <button
                className="rounded-md border px-2 py-1 text-sm bg-white"
                title="Nudge Left"
                onClick={(e) => {
                  onSubtitleUpdated({
                    ...subtitle,
                    to: subtitle.to - 100,
                  });
                }}
              >
                {"<<"}
              </button>
              <button
                className="rounded-md border px-2 py-1 text-sm bg-white"
                title="Set to current time"
                onClick={(e) => {
                  onSubtitleUpdated({
                    ...subtitle,
                    to: currentTime,
                  });
                }}
              >
                {"="}
              </button>
              <button
                className="rounded-md border px-2 py-1 text-sm bg-white"
                title="Nudge Right"
                onClick={(e) => {
                  onSubtitleUpdated({
                    ...subtitle,
                    to: subtitle.to + 100,
                  });
                }}
              >
                {">>"}
              </button>
            </div>
          </div>
        </div>
        <button
          className="rounded-md border px-2 py-1 text-sm bg-red-600 border-red-800 text-white"
          title="Nudge Right"
          onClick={() =>
            confirm("Are you sure you want to delete this sub?") &&
            onSubtitleDeleted()
          }
        >
          {"Delete"}
        </button>
      </div>
      <div className="flex gap-1 items-end">
        {isEditing ? (
          <div className="w-full">
            <textarea
              onChange={(e) => setCurrentText(e.target.value)}
              className="w-full rounded-lg py-2 px-3 border"
            >
              {currentText}
            </textarea>
            <div className="flex justify-end gap-2">
              <button
                className="rounded-md border px-2 py-1 text-sm bg-green-600 border-green-800 text-white"
                title="Nudge Right"
                onClick={() => {
                  onSubtitleUpdated({
                    ...subtitle,
                    text: currentText,
                  });
                  setIsEditing(false);
                }}
              >
                {"Confirm"}
              </button>
              <button
                className="rounded-md border px-2 py-1 text-sm bg-red-600 border-red-800 text-white"
                title="Nudge Right"
                onClick={() => setIsEditing(false)}
              >
                {"Cancel"}
              </button>
            </div>
          </div>
        ) : (
          <div
            className="w-full text-lg"
            dangerouslySetInnerHTML={{ __html: subtitle.text }}
            onClick={(e) => {
              setIsEditing(true);
              setCurrentText(subtitle.text);
            }}
          />
        )}
      </div>
    </div>
  );
}
