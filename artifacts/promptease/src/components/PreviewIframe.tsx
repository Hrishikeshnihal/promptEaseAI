import React, { useEffect, useRef, useState } from "react";
import { transformCodeForPreview } from "../lib/preview-utils";

interface PreviewIframeProps {
  code: string;
}

export function PreviewIframe({ code }: PreviewIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleFullscreen = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    if (!document.fullscreenElement) {
      iframe.requestFullscreen().catch((err) => {
        console.error("Fullscreen error:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    if (!iframeRef.current || !code) return;

    setError(null);

    const { transformedCode, iconMock } = transformCodeForPreview(code);

    // 🔥 FIX: remove export default (CRITICAL)
    const safeCode = transformedCode
      .replace(/export default function App/g, "function App")
      .replace(/export default function GeneratedApp/g, "function App")
      .replace(/function GeneratedApp/g, "function App")
      .replace(/export default App;?/g, "")
      .replace(/export default/g, "");

    console.log("--- PREVIEW START ---");
    console.log("Final SAFE code:\n", safeCode);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />

          <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <script src="https://cdn.tailwindcss.com"></script>

          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              overflow-x: hidden;
            }

            * {
              box-sizing: border-box;
            }

            #error-overlay {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(255,255,255,0.95);
              display: none;
              z-index: 9999;
              padding: 20px;
              color: #ef4444;
              font-family: monospace;
              overflow: auto;
            }
          </style>

          <script>
            window.addEventListener("error", function(e) {
              window.parent.postMessage({
                type: "preview_error",
                message: e.message || "Runtime error"
              }, "*");
            });

            window.addEventListener("unhandledrejection", function(e) {
              window.parent.postMessage({
                type: "preview_error",
                message: e.reason?.message || String(e.reason)
              }, "*");
            });

            ${iconMock || ""}
          </script>
        </head>

        <body>
          <div id="root"></div>
          <div id="error-overlay"></div>

          <script type="text/babel">
            try {
              ${safeCode}

              const root = ReactDOM.createRoot(document.getElementById("root"));

              let ComponentToRender = null;

              if (typeof App !== "undefined") {
                ComponentToRender = App;
              } else if (typeof GeneratedApp !== "undefined") {
                ComponentToRender = GeneratedApp;
              } else if (typeof Component !== "undefined") {
                ComponentToRender = Component;
              }

              if (!ComponentToRender) {
                throw new Error("No component found to render");
              }

              root.render(React.createElement(ComponentToRender));
            } catch (err) {
              const overlay = document.getElementById("error-overlay");
              overlay.style.display = "block";
              overlay.innerHTML =
                "<h2>Render Error</h2><pre>" +
                (err?.message || String(err)) +
                "</pre>";

              window.parent.postMessage({
                type: "preview_error",
                message: err?.message || String(err)
              }, "*");
            }
          </script>
        </body>
      </html>
    `;

    iframeRef.current.srcdoc = html;
  }, [code]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "preview_error") {
        setError(event.data.message);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  if (!code) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        No preview yet
      </div>
    );
  }

  return (
    <div className="w-full h-full relative border rounded-xl overflow-hidden bg-white">
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 z-20 bg-black/75 text-white px-3 py-1.5 text-xs rounded-lg hover:bg-black transition shadow-sm"
      >
        ⛶ Full Screen
      </button>

      {error && (
        <div className="absolute top-0 left-0 w-full bg-red-100 text-red-600 text-xs p-2 z-10">
          {error}
        </div>
      )}

      <iframe
        ref={iframeRef}
        sandbox="allow-scripts allow-same-origin"
        className="w-full h-full border-0"
      />
    </div>
  );
}