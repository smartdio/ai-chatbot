import { ArtifactKind } from '@/components/artifact';
import fs from 'fs';
import path from 'path';

const artifactsPromptPath = path.join(
  process.cwd(),
  'lib/ai/prompts/artifacts_cn.txt'
);
export const artifactsPrompt = fs.readFileSync(artifactsPromptPath, 'utf-8');

const regularPromptPath = path.join(process.cwd(), 'lib/ai/prompts/regular-psybot.txt');
export const regularPrompt = fs.readFileSync(regularPromptPath, 'utf-8');

export const systemPrompt = ({
  selectedChatModel,
}: {
  selectedChatModel: string;
}) => {
  if (selectedChatModel === 'chat-model-reasoning') {
    return regularPrompt;
  } else {
    return `${regularPrompt}\n\n${artifactsPrompt}`;
  }
};

const codePromptPath = path.join(process.cwd(), 'lib/ai/prompts/code.txt');
export const codePrompt = fs.readFileSync(codePromptPath, 'utf-8');

export const sheetPrompt = `
You are a spreadsheet creation assistant. Create a spreadsheet in csv format based on the given prompt. The spreadsheet should contain meaningful column headers and data.
`;

export const updateDocumentPrompt = (
  currentContent: string | null,
  type: ArtifactKind,
) =>
  type === 'text'
    ? `\
Improve the following contents of the document based on the given prompt.

${currentContent}
`
    : type === 'code'
      ? `\
Improve the following code snippet based on the given prompt.

${currentContent}
`
      : type === 'sheet'
        ? `\
Improve the following spreadsheet based on the given prompt.

${currentContent}
`
        : '';
