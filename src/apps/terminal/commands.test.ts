import { beforeEach, describe, expect, test, vi } from 'vitest';
import { HELP_TEXT, runCommand, type CommandContext } from './commands';
import type { FSNode } from '../../fs/fsTypes';

const ROOT_ID = 'root';
const DOCS_ID = 'docs';
const RECYCLE_ID = 'recycle';

let nodes: Record<string, FSNode>;
let ctx: CommandContext;

beforeEach(() => {
  nodes = {
    [ROOT_ID]: { id: ROOT_ID, parentId: null, name: 'This PC', kind: 'folder', createdAt: 0, modifiedAt: 0 },
    [DOCS_ID]: { id: DOCS_ID, parentId: ROOT_ID, name: 'Documents', kind: 'folder', createdAt: 0, modifiedAt: 0 },
    [RECYCLE_ID]: { id: RECYCLE_ID, parentId: ROOT_ID, name: 'Recycle Bin', kind: 'folder', createdAt: 0, modifiedAt: 0 },
    file1: {
      id: 'file1',
      parentId: DOCS_ID,
      name: 'notes.txt',
      kind: 'file',
      fileType: 'text',
      content: 'line one\nline two',
      createdAt: 0,
      modifiedAt: 0,
    },
    pic: {
      id: 'pic',
      parentId: DOCS_ID,
      name: 'pic.png',
      kind: 'file',
      fileType: 'image',
      content: 'data:image/png;base64,',
      createdAt: 0,
      modifiedAt: 0,
    },
  };

  ctx = {
    nodes,
    cwd: DOCS_ID,
    rootId: ROOT_ID,
    recycleBinId: RECYCLE_ID,
    createFolder: vi.fn().mockReturnValue('new-folder-id'),
    createFile: vi.fn().mockReturnValue('new-file-id'),
    updateFileContent: vi.fn(),
    moveNode: vi.fn(),
    openFile: vi.fn(),
    openFolder: vi.fn(),
  };
});

describe('help / clear', () => {
  test('help lists the commands', () => {
    expect(runCommand('help', ctx).output).toEqual([HELP_TEXT]);
  });

  test('clear signals the caller to wipe the scrollback', () => {
    expect(runCommand('clear', ctx)).toEqual({ output: [], clear: true });
  });

  test('an empty line produces no output', () => {
    expect(runCommand('   ', ctx).output).toEqual([]);
  });
});

describe('ls', () => {
  test('lists the current directory, folders suffixed with /', () => {
    expect(runCommand('ls', ctx).output[0]).toContain('notes.txt');
    expect(runCommand('ls', ctx).output[0]).toContain('pic.png');
  });

  test('lists a named subdirectory', () => {
    expect(runCommand('ls ..', ctx).output[0]).toContain('Documents/');
  });

  test('errors on a nonexistent path', () => {
    expect(runCommand('ls nope', ctx).output[0]).toMatch(/No such file or directory/);
  });

  test('errors when the target is a file, not a directory', () => {
    expect(runCommand('ls notes.txt', ctx).output[0]).toMatch(/Not a directory/);
  });
});

describe('cd', () => {
  test('changes cwd to the resolved folder', () => {
    expect(runCommand('cd ..', ctx).newCwd).toBe(ROOT_ID);
  });

  test('cd with no argument goes to root', () => {
    expect(runCommand('cd', ctx).newCwd).toBe(ROOT_ID);
  });

  test('errors and does not change cwd for a nonexistent path', () => {
    const result = runCommand('cd nope', ctx);
    expect(result.newCwd).toBeUndefined();
    expect(result.output[0]).toMatch(/No such file or directory/);
  });

  test('errors when the target is a file', () => {
    expect(runCommand('cd notes.txt', ctx).output[0]).toMatch(/Not a directory/);
  });
});

describe('cat', () => {
  test('prints a text file split into lines', () => {
    expect(runCommand('cat notes.txt', ctx).output).toEqual(['line one', 'line two']);
  });

  test('errors on a directory', () => {
    expect(runCommand('cat ..', ctx).output[0]).toMatch(/Is a directory/);
  });

  test('errors on a binary (image) file', () => {
    expect(runCommand('cat pic.png', ctx).output[0]).toMatch(/cannot display a binary file/);
  });

  test('errors with missing operand', () => {
    expect(runCommand('cat', ctx).output[0]).toMatch(/missing operand/);
  });
});

describe('mkdir / touch / rm', () => {
  test('mkdir creates a folder in cwd', () => {
    runCommand('mkdir Reports', ctx);
    expect(ctx.createFolder).toHaveBeenCalledWith(DOCS_ID, 'Reports');
  });

  test('touch creates an empty text file when it does not exist', () => {
    runCommand('touch new.txt', ctx);
    expect(ctx.createFile).toHaveBeenCalledWith(DOCS_ID, 'new.txt', 'text', '');
  });

  test('touch on an existing file does not create a duplicate', () => {
    runCommand('touch notes.txt', ctx);
    expect(ctx.createFile).not.toHaveBeenCalled();
  });

  test('rm moves the named file to the recycle bin', () => {
    runCommand('rm notes.txt', ctx);
    expect(ctx.moveNode).toHaveBeenCalledWith('file1', RECYCLE_ID);
  });

  test('rm errors on a nonexistent name', () => {
    expect(runCommand('rm nope', ctx).output[0]).toMatch(/No such file or directory/);
  });
});

describe('echo', () => {
  test('without redirection, echoes the text back', () => {
    expect(runCommand('echo hello world', ctx).output).toEqual(['hello world']);
  });

  test('with redirection to a new file, creates it with that content', () => {
    runCommand('echo hello > greeting.txt', ctx);
    expect(ctx.createFile).toHaveBeenCalledWith(DOCS_ID, 'greeting.txt', 'text', 'hello');
  });

  test('with redirection to an existing file, overwrites its content', () => {
    runCommand('echo replaced > notes.txt', ctx);
    expect(ctx.updateFileContent).toHaveBeenCalledWith('file1', 'replaced');
    expect(ctx.createFile).not.toHaveBeenCalled();
  });
});

describe('open', () => {
  test('opens a file via the shared openFile helper', () => {
    runCommand('open notes.txt', ctx);
    expect(ctx.openFile).toHaveBeenCalledWith(nodes.file1);
  });

  test('opens a folder via the shared openFolder helper', () => {
    runCommand('open ..', ctx);
    expect(ctx.openFolder).toHaveBeenCalledWith(ROOT_ID);
  });
});

describe('unknown command', () => {
  test('reports command not found', () => {
    expect(runCommand('frobnicate', ctx).output[0]).toMatch(/command not found/);
  });
});
