import { useEffect, useRef, useState } from 'react';
import type { AppComponentProps } from '../APP_REGISTRY';
import { useAppInstanceStore } from '../../stores/appInstanceStore';
import { useFSStore, DOCUMENTS_ID } from '../../stores/fsStore';
import { getImageFiles } from '../../fs/fsUtils';
import { floodFill } from './floodFill';
import styles from './Paint.module.css';

type Tool = 'pencil' | 'eraser' | 'line' | 'rect' | 'fill';

const CANVAS_W = 380;
const CANVAS_H = 220;
const ERASER_WIDTH = 14;
const PENCIL_WIDTH = 2;

interface Point {
  x: number;
  y: number;
}

function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = CANVAS_W * dpr;
  canvas.height = CANVAS_H * dpr;
  canvas.style.width = `${CANVAS_W}px`;
  canvas.style.height = `${CANVAS_H}px`;
  const ctx = canvas.getContext('2d');
  ctx?.scale(dpr, dpr);
  return ctx;
}

function fillWhite(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function loadImageOntoCanvas(ctx: CanvasRenderingContext2D, dataUrl: string): void {
  const img = new Image();
  img.onload = () => {
    fillWhite(ctx);
    ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
  };
  img.src = dataUrl;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16) || 0,
    g: parseInt(clean.slice(2, 4), 16) || 0,
    b: parseInt(clean.slice(4, 6), 16) || 0,
  };
}

export function Paint({ windowId }: AppComponentProps): React.JSX.Element {
  const instance = useAppInstanceStore((state) => state.byWindowId[windowId]);
  const patchInstanceState = useAppInstanceStore((state) => state.patchInstanceState);
  const fileId = typeof instance?.fileId === 'string' ? instance.fileId : undefined;

  const nodes = useFSStore((state) => state.nodes);
  const createFile = useFSStore((state) => state.createFile);
  const updateFileContent = useFSStore((state) => state.updateFileContent);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState('#000000');
  const isDrawing = useRef(false);
  const startPoint = useRef<Point>({ x: 0, y: 0 });

  const [dialog, setDialog] = useState<'none' | 'open' | 'save-as'>('none');
  const [saveAsName, setSaveAsName] = useState('');

  // Runs once: sizes both canvases for the device pixel ratio, then loads
  // whatever file this window was opened with (set by openFile before this
  // component ever mounts) — a reactive effect keyed on fileId would also
  // fire on every unrelated store change and re-load over the user's
  // in-progress drawing, so this is deliberately a one-shot read.
  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (canvas === null || overlay === null) return;
    const ctx = setupCanvas(canvas);
    setupCanvas(overlay);
    if (ctx === null) return;
    fillWhite(ctx);

    const initialFileId = useAppInstanceStore.getState().byWindowId[windowId]?.fileId;
    if (typeof initialFileId === 'string') {
      const node = useFSStore.getState().nodes[initialFileId];
      if (node?.kind === 'file' && node.fileType === 'image') loadImageOntoCanvas(ctx, node.content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally one-shot, see comment above
  }, []);

  const getCanvasPoint = (event: React.PointerEvent): Point => {
    const canvas = canvasRef.current;
    if (canvas === null) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const drawPreview = (point: Point): void => {
    const overlay = overlayRef.current;
    const ctx = overlay?.getContext('2d');
    if (ctx === null || ctx === undefined) return;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.strokeStyle = color;
    ctx.lineWidth = PENCIL_WIDTH;
    const start = startPoint.current;
    if (tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    } else if (tool === 'rect') {
      ctx.strokeRect(Math.min(start.x, point.x), Math.min(start.y, point.y), Math.abs(point.x - start.x), Math.abs(point.y - start.y));
    }
  };

  const commitShape = (point: Point): void => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx === null || ctx === undefined || canvas === null || overlay === null) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = PENCIL_WIDTH;
    const start = startPoint.current;
    if (tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    } else if (tool === 'rect') {
      ctx.strokeRect(Math.min(start.x, point.x), Math.min(start.y, point.y), Math.abs(point.x - start.x), Math.abs(point.y - start.y));
    }
    overlay.getContext('2d')?.clearRect(0, 0, CANVAS_W, CANVAS_H);
  };

  const onFillAt = (point: Point): void => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx === null || ctx === undefined || canvas === null) return;
    const dpr = window.devicePixelRatio || 1;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    floodFill(
      { data: imageData.data, width: canvas.width, height: canvas.height },
      Math.floor(point.x * dpr),
      Math.floor(point.y * dpr),
      { ...hexToRgb(color), a: 255 },
    );
    ctx.putImageData(imageData, 0, 0);
  };

  const onCanvasPointerDown = (event: React.PointerEvent): void => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    canvas.setPointerCapture(event.pointerId);
    const point = getCanvasPoint(event);
    startPoint.current = point;

    if (tool === 'fill') {
      onFillAt(point);
      return;
    }
    isDrawing.current = true;
    if (tool === 'pencil' || tool === 'eraser') {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
      ctx?.moveTo(point.x, point.y);
    }
  };

  const onCanvasPointerMove = (event: React.PointerEvent): void => {
    if (!isDrawing.current) return;
    const point = getCanvasPoint(event);
    if (tool === 'pencil' || tool === 'eraser') {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx === null || ctx === undefined) return;
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.lineWidth = tool === 'eraser' ? ERASER_WIDTH : PENCIL_WIDTH;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    } else if (tool === 'line' || tool === 'rect') {
      drawPreview(point);
    }
  };

  const onCanvasPointerUp = (event: React.PointerEvent): void => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (tool === 'line' || tool === 'rect') commitShape(getCanvasPoint(event));
  };

  const onSave = (): void => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    if (fileId !== undefined) {
      updateFileContent(fileId, canvas.toDataURL('image/png'));
      return;
    }
    setSaveAsName('');
    setDialog('save-as');
  };

  const onConfirmSaveAs = (): void => {
    const canvas = canvasRef.current;
    const name = saveAsName.trim();
    if (canvas === null || name === '') return;
    const newId = createFile(DOCUMENTS_ID, name, 'image', canvas.toDataURL('image/png'));
    patchInstanceState(windowId, { fileId: newId });
    setDialog('none');
  };

  const onOpenImage = (nodeId: string, dataUrl: string): void => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx !== null && ctx !== undefined) loadImageOntoCanvas(ctx, dataUrl);
    patchInstanceState(windowId, { fileId: nodeId });
    setDialog('none');
  };

  const imageFiles = getImageFiles(nodes, DOCUMENTS_ID);
  const tools: { id: Tool; label: string }[] = [
    { id: 'pencil', label: '✏️' },
    { id: 'eraser', label: '🧹' },
    { id: 'line', label: '╱' },
    { id: 'rect', label: '▭' },
    { id: 'fill', label: '🪣' },
  ];

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        {tools.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-label={t.id}
            aria-pressed={tool === t.id}
            className={`${styles.toolButton} ${tool === t.id ? styles.toolButtonActive : ''}`}
            onClick={() => setTool(t.id)}
          >
            {t.label}
          </button>
        ))}
        <input
          type="color"
          className={styles.colorInput}
          value={color}
          aria-label="Color"
          onChange={(event) => setColor(event.target.value)}
        />
        <button type="button" className={styles.toolButton} onClick={() => setDialog('open')}>
          Open
        </button>
        <button type="button" className={styles.toolButton} onClick={onSave}>
          Save
        </button>
      </div>
      <div className={styles.canvasArea}>
        <div className={styles.canvasStack}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            onPointerDown={onCanvasPointerDown}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
          />
          <canvas ref={overlayRef} className={styles.overlay} />
        </div>
      </div>
      {dialog === 'open' && (
        <div className={styles.dialog}>
          <span className={styles.dialogTitle}>Open</span>
          <ul className={styles.fileList}>
            {imageFiles.length === 0 && <li>No images saved yet.</li>}
            {imageFiles.map((file) => (
              <li key={file.id}>
                <button type="button" className={styles.fileListItem} onClick={() => onOpenImage(file.id, file.content)}>
                  {file.name}
                </button>
              </li>
            ))}
          </ul>
          <div className={styles.dialogActions}>
            <button type="button" className={styles.toolButton} onClick={() => setDialog('none')}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {dialog === 'save-as' && (
        <div className={styles.dialog}>
          <span className={styles.dialogTitle}>Save As</span>
          <input
            className={styles.nameInput}
            value={saveAsName}
            autoFocus
            onFocus={(event) => event.target.select()}
            onChange={(event) => setSaveAsName(event.target.value)}
            placeholder="picture.png"
            aria-label="File name"
          />
          <div className={styles.dialogActions}>
            <button type="button" className={styles.toolButton} onClick={onConfirmSaveAs}>
              Save
            </button>
            <button type="button" className={styles.toolButton} onClick={() => setDialog('none')}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
