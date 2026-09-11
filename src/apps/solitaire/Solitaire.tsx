import { useRef, useState } from 'react';
import type { AppComponentProps } from '../APP_REGISTRY';
import { usePointerDrag } from '../../hooks/usePointerDrag';
import {
  autoMoveToFoundation,
  checkWin,
  createDeck,
  deal,
  drawFromStock,
  getPileCards,
  isRed,
  moveCards,
  rankLabel,
  shuffle,
  suitSymbol,
  type Card,
  type PileRef,
  type SolitaireState,
} from './solitaireLogic';
import { encodePileRef, resolveSolitaireDropTarget } from './pileRefCodec';
import { SolitaireGhost, type SolitaireGhostHandle } from './SolitaireGhost';
import styles from './Solitaire.module.css';

function CardFace({ card }: { card: Card }): React.JSX.Element {
  return (
    <span className={isRed(card.suit) ? styles.cardRed : styles.cardBlack}>
      {rankLabel(card.rank)}
      {suitSymbol(card.suit)}
    </span>
  );
}

export function Solitaire(_props: AppComponentProps): React.JSX.Element {
  const [state, setState] = useState<SolitaireState>(() => deal(shuffle(createDeck())));
  const ghostRef = useRef<SolitaireGhostHandle>(null);
  const dragSourceRef = useRef<{ pileRef: PileRef; cardIndex: number } | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const cardDrag = usePointerDrag({
    onDrag: (_dx, _dy, clientX, clientY) => {
      ghostRef.current?.moveTo(clientX - dragOffsetRef.current.x, clientY - dragOffsetRef.current.y);
    },
    onDragEnd: (dx, dy, clientX, clientY) => {
      ghostRef.current?.hide();
      const source = dragSourceRef.current;
      dragSourceRef.current = null;
      if (source === null || (dx === 0 && dy === 0)) return;

      const target = resolveSolitaireDropTarget(clientX, clientY);
      if (target === null) return;
      const next = moveCards(state, source.pileRef, source.cardIndex, target);
      if (next !== null) setState(next);
    },
  });

  const onCardPointerDown = (pileRef: PileRef, cardIndex: number, event: React.PointerEvent): void => {
    const pile = getPileCards(state, pileRef);
    const card = pile[cardIndex];
    if (card === undefined || !card.faceUp) return;

    dragSourceRef.current = { pileRef, cardIndex };
    const rect = event.currentTarget.getBoundingClientRect();
    dragOffsetRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    ghostRef.current?.show(pile.slice(cardIndex));
    ghostRef.current?.moveTo(rect.left, rect.top);
    cardDrag.onPointerDown(event);
  };

  const onCardDoubleClick = (pileRef: PileRef): void => {
    const next = autoMoveToFoundation(state, pileRef);
    if (next !== null) setState(next);
  };

  const onStockClick = (): void => setState(drawFromStock(state));
  const onNewGame = (): void => setState(deal(shuffle(createDeck())));

  const won = checkWin(state);

  const renderWasteCard = (): React.JSX.Element | null => {
    const card = state.waste[state.waste.length - 1];
    if (card === undefined) return null;
    return (
      <div
        className={styles.card}
        onPointerDown={(event) => onCardPointerDown({ type: 'waste' }, state.waste.length - 1, event)}
        onDoubleClick={() => onCardDoubleClick({ type: 'waste' })}
      >
        <CardFace card={card} />
      </div>
    );
  };

  const renderFoundationCard = (pile: Card[]): React.JSX.Element | null => {
    const card = pile[pile.length - 1];
    if (card === undefined) return null;
    return (
      <div className={styles.card}>
        <CardFace card={card} />
      </div>
    );
  };

  return (
    <div className={styles.wrapper} data-testid="solitaire-root">
      <button type="button" className={styles.newGameButton} onClick={onNewGame}>
        New Game
      </button>

      <div className={styles.topRow}>
        <div
          className={styles.pile}
          data-pile={encodePileRef({ type: 'stock' })}
          onClick={onStockClick}
          role="button"
          tabIndex={0}
          aria-label="Draw from stock"
        >
          {state.stock.length > 0 ? <div className={`${styles.card} ${styles.cardBack}`} /> : <div className={styles.emptySlot} />}
        </div>
        <div className={styles.pile} data-pile={encodePileRef({ type: 'waste' })}>
          {renderWasteCard() ?? <div className={styles.emptySlot} />}
        </div>
        <div className={styles.spacer} />
        {([0, 1, 2, 3] as const).map((i) => (
          <div key={i} className={styles.pile} data-pile={encodePileRef({ type: 'foundation', index: i })}>
            {renderFoundationCard(state.foundations[i] ?? []) ?? <div className={styles.emptySlot} />}
          </div>
        ))}
      </div>

      <div className={styles.tableauRow}>
        {state.tableau.map((pile, colIndex) => (
          <div
            key={colIndex}
            className={styles.tableauColumn}
            data-pile={encodePileRef({ type: 'tableau', index: colIndex })}
            style={{ height: Math.max(58, pile.length * 16 + 42) }}
          >
            {pile.length === 0 && <div className={styles.emptySlot} />}
            {pile.map((card, cardIndex) => (
              <div
                key={cardIndex}
                data-testid={`tableau-${colIndex}-card-${cardIndex}`}
                className={card.faceUp ? styles.card : `${styles.card} ${styles.cardBack}`}
                style={{ top: cardIndex * 16 }}
                onPointerDown={(event) => onCardPointerDown({ type: 'tableau', index: colIndex }, cardIndex, event)}
                onDoubleClick={() => onCardDoubleClick({ type: 'tableau', index: colIndex })}
              >
                {card.faceUp && <CardFace card={card} />}
              </div>
            ))}
          </div>
        ))}
      </div>

      {won && <span className={styles.status}>You win! 🎉</span>}
      <SolitaireGhost ref={ghostRef} />
    </div>
  );
}
