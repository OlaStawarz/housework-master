interface EmptyStateProps {
  icon: string;
  iconLabel: string;
  title: string;
  description: string;
  iconSize?: 'sm' | 'md' | 'lg';
}

export function EmptyState({ 
  icon, 
  iconLabel, 
  title, 
  description,
  iconSize = 'md' 
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'text-6xl mb-6',
    md: 'text-7xl mb-6',
    lg: 'text-8xl mb-6'
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className={`${sizeClasses[iconSize]}`} role="img" aria-label={iconLabel}>
        {icon}
      </div>
      <h2 className="text-2xl font-semibold mb-3">{title}</h2>
      <p className="text-muted-foreground max-w-md">
        {description}
      </p>
    </div>
  );
}
