interface MessageInlineFallbackProps {
  text?: string;
}

export function MessageInlineFallback({ text }: MessageInlineFallbackProps) {
  return <div className="text-sm text-muted-foreground">{text ?? "Do dzieła! Nie ma na co czekać!"}</div>;
}


