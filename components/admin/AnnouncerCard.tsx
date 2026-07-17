"use client";

import { useEffect, useState } from "react";
import { useDraftData } from "@/lib/useDraftData";

const VOICE_PREF_KEY = "fg2_announcerVoiceURI";

export function AnnouncerCard() {
  const { leagueSettings, updateLeagueSettings } = useDraftData();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string>("");
  const [note, setNote] = useState("Loading available voices…");

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setNote("This browser doesn't support speech synthesis.");
      return;
    }
    const stored = window.localStorage.getItem(VOICE_PREF_KEY);
    if (stored) setVoiceURI(stored);

    function loadVoices() {
      const list = window.speechSynthesis.getVoices();
      if (list.length) {
        setVoices(list);
        setNote(`${list.length} voices available.`);
        setVoiceURI((cur) => cur || list[0].voiceURI);
      }
    }
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  function preview() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance("With the next pick, Sack Attack selects... Ja'Marr Chase, wide receiver, Cincinnati.");
    const voice = voices.find((v) => v.voiceURI === voiceURI);
    if (voice) utter.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  function handleVoiceChange(uri: string) {
    setVoiceURI(uri);
    window.localStorage.setItem(VOICE_PREF_KEY, uri);
  }

  return (
    <div className="a-card">
      <h2>
        Voice Announcer{" "}
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--chalk-dim)", fontWeight: 400 }}>
          (browser voice — test before deciding)
        </span>
      </h2>
      <p className="a-desc">
        This uses your browser&apos;s built-in text-to-speech, not a human recording — hit preview and judge for
        yourself whether it&apos;s good enough, or whether we need a real AI voice service instead.
      </p>
      <div className="clock-settings">
        <label className="clock-toggle">
          <input
            type="checkbox"
            checked={leagueSettings?.announcer_enabled ?? false}
            onChange={(e) => updateLeagueSettings({ announcer_enabled: e.target.checked })}
          />
          Announce every pick automatically
        </label>
        <div className="clock-seconds-row" style={{ width: 260 }}>
          <label className="field-label">Voice</label>
          <select value={voiceURI} onChange={(e) => handleVoiceChange(e.target.value)}>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="apply-bar">
        <button className="btn primary" onClick={preview}>
          🔊 Preview Announcer
        </button>
        <span className="apply-note">{note}</span>
      </div>
    </div>
  );
}
