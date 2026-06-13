import { open } from "@tauri-apps/plugin-opener";

const HANDY_URL = "https://github.com/cjpais/Handy";

export default function AboutPanel() {
  const openLink = (url: string) => open(url).catch(console.error);

  return (
    <div className="p-4 space-y-5">
      {/* App identity */}
      <div className="flex flex-col items-center gap-1 pt-2 pb-1">
        <span className="text-4xl">📻</span>
        <div className="text-base font-semibold text-gray-100">RadioCheck</div>
        <div className="text-xs text-gray-500">v0.1.0 beta</div>
        <div className="text-xs text-gray-500 text-center mt-1">
          Voice dictation for racing simulators
        </div>
      </div>

      <hr className="border-gray-800" />

      {/* Handy attribution — required by MIT licence */}
      <section className="space-y-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Built on Handy
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          RadioCheck is built on{" "}
          <button
            onClick={() => openLink(HANDY_URL)}
            className="text-green-400 hover:text-green-300 underline underline-offset-2"
          >
            Handy
          </button>
          , an open-source desktop voice-dictation app by{" "}
          <button
            onClick={() => openLink("https://github.com/cjpais")}
            className="text-green-400 hover:text-green-300 underline underline-offset-2"
          >
            CJ Pais
          </button>
          . Large portions of the audio pipeline, Whisper integration, and
          shortcut handling are taken directly from that project.
        </p>

        {/* MIT copyright notice — required verbatim */}
        <div className="bg-gray-900 rounded-lg p-3 space-y-1">
          <div className="text-xs font-medium text-gray-400">
            Handy — MIT License
          </div>
          <p className="text-xs text-gray-600 leading-relaxed font-mono">
            Copyright (c) 2025 CJ Pais
            <br />
            <br />
            Permission is hereby granted, free of charge, to any person
            obtaining a copy of this software and associated documentation
            files (the "Software"), to deal in the Software without
            restriction, including without limitation the rights to use,
            copy, modify, merge, publish, distribute, sublicense, and/or
            sell copies of the Software, and to permit persons to whom the
            Software is furnished to do so, subject to the following
            conditions:
            <br />
            <br />
            The above copyright notice and this permission notice shall be
            included in all copies or substantial portions of the Software.
            <br />
            <br />
            THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
            EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
            OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
            NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
            HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
            WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
            FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
            OTHER DEALINGS IN THE SOFTWARE.
          </p>
        </div>

        <button
          onClick={() => openLink(HANDY_URL)}
          className="w-full py-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors"
        >
          View Handy on GitHub →
        </button>
      </section>

      <hr className="border-gray-800" />

      {/* Key open-source components */}
      <section className="space-y-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Open source components
        </div>
        <div className="space-y-2">
          {COMPONENTS.map(({ name, description, url, license }) => (
            <div
              key={name}
              className="flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <button
                  onClick={() => openLink(url)}
                  className="text-xs text-green-400 hover:text-green-300 underline underline-offset-2 font-medium"
                >
                  {name}
                </button>
                <div className="text-xs text-gray-600 leading-tight">
                  {description}
                </div>
              </div>
              <span className="flex-shrink-0 text-xs text-gray-700 font-mono">
                {license}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const COMPONENTS: {
  name: string;
  description: string;
  url: string;
  license: string;
}[] = [
  {
    name: "whisper.cpp",
    description: "Local speech recognition (Georgi Gerganov)",
    url: "https://github.com/ggml-org/whisper.cpp",
    license: "MIT",
  },
  {
    name: "Silero VAD",
    description: "Voice activity detection model",
    url: "https://github.com/snakers4/silero-vad",
    license: "MIT",
  },
  {
    name: "Tauri",
    description: "Cross-platform desktop app framework",
    url: "https://tauri.app",
    license: "MIT/Apache-2",
  },
  {
    name: "React",
    description: "UI library",
    url: "https://react.dev",
    license: "MIT",
  },
  {
    name: "cpal",
    description: "Cross-platform audio I/O",
    url: "https://github.com/RustAudio/cpal",
    license: "Apache-2",
  },
  {
    name: "rdev",
    description: "Global keyboard shortcuts",
    url: "https://github.com/rustdesk-org/rdev",
    license: "MIT",
  },
];
