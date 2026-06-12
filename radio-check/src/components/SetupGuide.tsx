interface SetupGuideProps {
  onGoToModel: () => void;
}

export default function SetupGuide({ onGoToModel }: SetupGuideProps) {
  return (
    <div className="mx-4 mt-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
      <div className="text-sm font-medium text-yellow-400 mb-1">
        Setup required
      </div>
      <div className="text-xs text-gray-400 mb-2">
        Download a Whisper model to enable voice dictation.
      </div>
      <button
        onClick={onGoToModel}
        className="text-xs bg-yellow-600 hover:bg-yellow-500 text-black font-medium px-3 py-1.5 rounded transition-colors"
      >
        Download a model →
      </button>
    </div>
  );
}
