import type { FileNode, FileType, FSNode } from '../../fs/fsTypes';
import { getChildren } from '../../fs/fsUtils';
import { resolvePath } from './pathResolve';

export interface CommandContext {
  nodes: Record<string, FSNode>;
  cwd: string;
  rootId: string;
  recycleBinId: string;
  createFolder: (parentId: string, name: string) => string;
  createFile: (parentId: string, name: string, fileType: FileType, content: string) => string;
  updateFileContent: (id: string, content: string) => void;
  moveNode: (id: string, newParentId: string) => void;
  openFile: (node: FileNode) => void;
  openFolder: (folderId: string) => void;
}

export interface CommandResult {
  output: string[];
  newCwd?: string;
  clear?: boolean;
  easterEgg?: 'matrix' | 'bsod' | 'error-cascade';
}

function tokenize(input: string): string[] {
  return input.trim().split(/\s+/).filter((token) => token.length > 0);
}

export const HELP_TEXT = 'Commands: ls, cd, cat, mkdir, touch, rm, echo, open, clear, help';

export function runCommand(input: string, ctx: CommandContext): CommandResult {
  const tokens = tokenize(input);
  if (tokens.length === 0) return { output: [] };
  const [cmd, ...args] = tokens;

  switch (cmd) {
    case 'help':
      return { output: [HELP_TEXT] };

    case 'clear':
      return { output: [], clear: true };

    case 'ls': {
      const target = args[0] !== undefined ? resolvePath(ctx.nodes, ctx.cwd, ctx.rootId, args[0]) : ctx.nodes[ctx.cwd];
      if (target === undefined) return { output: [`ls: ${args[0]}: No such file or directory`] };
      if (target.kind !== 'folder') return { output: [`ls: ${args[0]}: Not a directory`] };
      const children = getChildren(ctx.nodes, target.id);
      if (children.length === 0) return { output: [] };
      return { output: [children.map((child) => (child.kind === 'folder' ? `${child.name}/` : child.name)).join('  ')] };
    }

    case 'cd': {
      if (args.length === 0) return { output: [], newCwd: ctx.rootId };
      const target = resolvePath(ctx.nodes, ctx.cwd, ctx.rootId, args[0] as string);
      if (target === undefined) return { output: [`cd: ${args[0]}: No such file or directory`] };
      if (target.kind !== 'folder') return { output: [`cd: ${args[0]}: Not a directory`] };
      return { output: [], newCwd: target.id };
    }

    case 'cat': {
      if (args.length === 0) return { output: ['cat: missing operand'] };
      const target = resolvePath(ctx.nodes, ctx.cwd, ctx.rootId, args[0] as string);
      if (target === undefined) return { output: [`cat: ${args[0]}: No such file or directory`] };
      if (target.kind !== 'file') return { output: [`cat: ${args[0]}: Is a directory`] };
      if (target.fileType !== 'text') return { output: [`cat: ${args[0]}: cannot display a binary file`] };
      return { output: target.content === '' ? [] : target.content.split('\n') };
    }

    case 'mkdir': {
      if (args.length === 0) return { output: ['mkdir: missing operand'] };
      ctx.createFolder(ctx.cwd, args[0] as string);
      return { output: [] };
    }

    case 'touch': {
      if (args.length === 0) return { output: ['touch: missing operand'] };
      const existing = getChildren(ctx.nodes, ctx.cwd).find((node) => node.name === args[0]);
      if (existing === undefined) ctx.createFile(ctx.cwd, args[0] as string, 'text', '');
      return { output: [] };
    }

    case 'rm': {
      if (args.length === 0) return { output: ['rm: missing operand'] };
      const target = getChildren(ctx.nodes, ctx.cwd).find((node) => node.name === args[0]);
      if (target === undefined) return { output: [`rm: ${args[0]}: No such file or directory`] };
      ctx.moveNode(target.id, ctx.recycleBinId);
      return { output: [] };
    }

    case 'echo': {
      const redirectIndex = args.indexOf('>');
      if (redirectIndex === -1) return { output: [args.join(' ')] };
      const text = args.slice(0, redirectIndex).join(' ');
      const filename = args[redirectIndex + 1];
      if (filename === undefined) return { output: ['echo: syntax error near unexpected token `>`'] };
      const existing = getChildren(ctx.nodes, ctx.cwd).find((node) => node.name === filename);
      if (existing !== undefined && existing.kind === 'file') {
        ctx.updateFileContent(existing.id, text);
      } else {
        ctx.createFile(ctx.cwd, filename, 'text', text);
      }
      return { output: [] };
    }

    case 'open': {
      if (args.length === 0) return { output: ['open: missing operand'] };
      const target = resolvePath(ctx.nodes, ctx.cwd, ctx.rootId, args[0] as string);
      if (target === undefined) return { output: [`open: ${args[0]}: No such file or directory`] };
      if (target.kind === 'folder') ctx.openFolder(target.id);
      else ctx.openFile(target);
      return { output: [] };
    }

    case 'whoami':
      return { output: ['Administrator (probably). This is a simulation — nobody is really watching.'] };

    case 'sudo': {
      if (args.join(' ') === 'make me a sandwich') return { output: ['Okay.', '🥪'] };
      return { output: [`sudo: ${args.join(' ')}: this isn't Linux, but nice try.`] };
    }

    case 'sl':
      return {
        output: [
          '      ====        ________                ___________ ',
          '  _D _|  |_______/        \\__I_I_____===__|_________| ',
          '   |(_)---  |   H\\________/ |   |        =|___ ___|   ',
          "   /     |  |   H  |  |     |   |         ||_| |_||   ",
          '  |      |  |   H  |__--------------------| [___] |   ',
          '  | ________|___H__/__|_____/[][]~\\_______|       |   ',
          '  |/ |   |-----------I_____I [][] []  D   |=======|__ ',
          "__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__",
          ' |/-=|___|=    ||    ||    ||    |_____/~\\___/       ',
          "  \\_/      \\O=====O=====O=====O_/      \\_/           ",
        ],
      };

    case 'matrix':
      return { output: [], easterEgg: 'matrix' };

    case 'bsod':
      return { output: [], easterEgg: 'bsod' };

    case 'error':
      return { output: [], easterEgg: 'error-cascade' };

    default:
      return { output: [`${cmd}: command not found`] };
  }
}
