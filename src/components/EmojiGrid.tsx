interface EmojiGridProps {
  selectedEmoji: string | null | undefined;
  onSelect: (emoji: string) => void;
}

const COMMON_EMOJIS = [
  "🏠",
  "🏡",
  "🏢",
  "🍳",
  "🔪",
  "🍽️",
  "☕",
  "🥄",
  "🍴",
  "🥗",
  "🍕",
  "🛁",
  "🚿",
  "🚽",
  "🧽",
  "🧻",
  "🛏️",
  "🛋️",
  "🪑",
  "🚪",
  "🔑",
  "🔓",
  "🧺",
  "🧹",
  "🧯",
  "🌸",
  "🌿",
  "📚",
  "📖",
  "✏️",
  "📝",
  "💻",
  "🖥️",
  "⌨️",
  "🖱️",
  "🎮",
  "🎨",
  "🎬",
  "📷",
  "🚗",
  "🚲",
  "🛴",
  "🛹",
];

export function EmojiGrid({ selectedEmoji, onSelect }: EmojiGridProps) {
  return (
    <div className="grid grid-cols-8 gap-2">
      {COMMON_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className={`
            text-2xl p-2 rounded-lg border-2 transition-all
            hover:scale-110 hover:shadow-md
            ${selectedEmoji === emoji ? "border-primary bg-primary/10" : "border-muted hover:border-primary/50"}
          `}
          aria-label={`Wybierz emoji ${emoji}`}
          aria-pressed={selectedEmoji === emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
