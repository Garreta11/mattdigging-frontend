import React, { useState } from "react";
import "./Play.scss";

const API_URL = (process.env.REACT_APP_API_URL ?? "http://localhost:3333").replace(/\/+$/, "");

export default function Play() {
  const [trackId, setTrackId] = useState<string>("1d9916bb-054d-4574-b2ef-9795676482e9");
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  async function loadStream() {
    setLoading(true);
    setError("");
    setAudioSrc(null);
    try {
      const res = await fetch(`${API_URL}/tracks/${encodeURIComponent(trackId)}/stream`);
      if (!res.ok) {
        let message = `Request failed with ${res.status}`;
        try {
          const body = await res.json();
          if (body?.error) message = body.error;
        } catch {
          // ignore json parse errors
        }
        throw new Error(message);
      }
      const data = await res.json();
      if (!data?.url) throw new Error("No signed URL in response");
      setAudioSrc(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="play">
      <h1 className="play__title">Play</h1>
      <label className="play__label" htmlFor="track-id">track id</label>
      <div className="play__controls">
        <input
          id="track-id"
          className="play__input"
          type="text"
          value={trackId}
          onChange={(e) => setTrackId(e.target.value)}
          placeholder="Track ID (UUID)"
        />
        <button className="play__button" onClick={loadStream} disabled={!trackId || loading}>
          {loading ? "Loading..." : "Load"}
        </button>
      </div>
      {error ? <div className="play__error">{error}</div> : null}
      <audio className="play__audio" controls src={audioSrc ?? undefined}>
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}


