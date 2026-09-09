import { useCallback, useEffect, useRef, useState } from "react";

// Live camera capture for stories. Opens the device camera in the page
// (getUserMedia), takes a still, then offers to save it to the phone or
// carry it into the story composer. Falls back to the OS camera/gallery
// picker whenever getUserMedia isn't available — an insecure origin, a
// browser without it, or the user having blocked camera access.
export default function CameraCaptureModal({ onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [facing, setFacing] = useState("environment"); // rear camera first
  const [shot, setShot] = useState(null); // { url, file }
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // (Re)open the camera whenever the facing direction changes — and
  // never while a captured still is on screen, so the preview stays
  // frozen on the shot.
  useEffect(() => {
    if (shot) return undefined;
    let cancelled = false;

    async function start() {
      setStarting(true);
      setError("");
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("This browser can't open the camera here. Use the button below instead.");
        setStarting(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        stopStream();
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.name === "NotAllowedError"
              ? "Camera permission was blocked. Allow it in your browser settings, or pick a photo instead."
              : err?.name === "NotFoundError"
                ? "No camera found on this device."
                : "Couldn't open the camera. You can still pick a photo instead."
          );
        }
      } finally {
        if (!cancelled) setStarting(false);
      }
    }

    start();
    return () => {
      cancelled = true;
    };
  }, [facing, shot, stopStream]);

  // Always let go of the camera when this closes — a live stream left
  // running keeps the phone's camera light on.
  useEffect(() => stopStream, [stopStream]);

  useEffect(() => {
    return () => {
      if (shot?.url) URL.revokeObjectURL(shot.url);
    };
  }, [shot]);

  function handleShutter() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    // The front camera preview is mirrored for the user's benefit, so
    // mirror the capture too — otherwise the photo comes out flipped
    // from what they just saw.
    if (facing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
        setShot({ url: URL.createObjectURL(blob), file });
        stopStream();
      },
      "image/jpeg",
      0.92
    );
  }

  function handleSaveToPhone() {
    if (!shot) return;
    const a = document.createElement("a");
    a.href = shot.url;
    a.download = shot.file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function handlePickInstead(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      stopStream();
      onCapture(file);
    }
  }

  return (
    <div className="app-camera-overlay">
      <div className="app-camera-stage">
        {shot ? (
          <img src={shot.url} alt="Captured" className="app-camera-shot" />
        ) : (
          <video ref={videoRef} playsInline muted className={"app-camera-video" + (facing === "user" ? " is-mirrored" : "")} />
        )}

        {starting && !shot && !error && <p className="app-camera-note">Starting camera...</p>}
        {error && !shot && <p className="app-camera-note is-error">{error}</p>}

        <button type="button" className="app-camera-close" onClick={onClose} aria-label="Close camera">
          ×
        </button>

        {!shot && !error && (
          <button
            type="button"
            className="app-camera-flip"
            onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
            aria-label="Switch camera"
          >
            <FlipIcon />
          </button>
        )}
      </div>

      <div className="app-camera-controls">
        {shot ? (
          <>
            <button type="button" className="app-camera-secondary" onClick={() => setShot(null)}>
              Retake
            </button>
            <button type="button" className="app-camera-secondary" onClick={handleSaveToPhone}>
              Save to phone
            </button>
            <button
              type="button"
              className="app-camera-primary"
              onClick={() => onCapture(shot.file)}
            >
              Add to story
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="app-camera-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose photo
            </button>
            <button
              type="button"
              className="app-camera-shutter"
              onClick={handleShutter}
              disabled={!!error || starting}
              aria-label="Take photo"
            />
            <span className="app-camera-spacer" aria-hidden="true" />
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handlePickInstead}
      />
    </div>
  );
}

function FlipIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 8a7 7 0 0111.5-4M20 16a7 7 0 01-11.5 4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M4 4v4h4M20 20v-4h-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
