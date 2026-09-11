import { useEffect, useState } from 'react';
import { DateTimeDialog } from './DateTimeDialog';
import styles from './Clock.module.css';

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function Clock(): React.JSX.Element {
  const [now, setNow] = useState(() => new Date());
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <button
        type="button"
        className={styles.clock}
        onDoubleClick={() => setDialogOpen(true)}
        aria-label={`Time ${formatTime(now)}, double-click for Date/Time Properties`}
      >
        {formatTime(now)}
      </button>
      {dialogOpen && <DateTimeDialog now={now} onClose={() => setDialogOpen(false)} />}
    </>
  );
}
