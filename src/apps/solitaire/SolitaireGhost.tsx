import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { isRed, rankLabel, suitSymbol, type Card } from './solitaireLogic';
import styles from './Solitaire.module.css';

export interface SolitaireGhostHandle {
  show: (cards: Card[]) => void;
  moveTo: (x: number, y: number) => void;
  hide: () => void;
}

/**
 * Same discipline as SnapGhost/desktop-icon dragging: the set of cards being
 * dragged changes only once per gesture (a cheap, ordinary React state
 * update), while position updates every frame via a direct ref mutation —
 * so following the cursor costs zero re-renders.
 */
export const SolitaireGhost = forwardRef<SolitaireGhostHandle>(function SolitaireGhost(_props, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cards, setCards] = useState<Card[]>([]);

  useImperativeHandle(
    ref,
    () => ({
      show: (newCards) => {
        setCards(newCards);
        const node = containerRef.current;
        if (node !== null) node.style.opacity = '1';
      },
      moveTo: (x, y) => {
        const node = containerRef.current;
        if (node !== null) node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      },
      hide: () => {
        const node = containerRef.current;
        if (node !== null) node.style.opacity = '0';
      },
    }),
    [],
  );

  return (
    <div ref={containerRef} className={styles.ghost}>
      {cards.map((card, index) => (
        <div key={index} className={styles.ghostCard} style={{ top: index * 16 }}>
          <span className={isRed(card.suit) ? styles.cardRed : styles.cardBlack}>
            {rankLabel(card.rank)}
            {suitSymbol(card.suit)}
          </span>
        </div>
      ))}
    </div>
  );
});
