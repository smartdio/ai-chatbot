import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { xai } from '@ai-sdk/xai';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

const qwq = createOpenAICompatible({
  name: 'qwen',
  baseURL: 'http://183.221.80.21:58001/v1',
});

const qwen = createOpenAICompatible({
  name: 'qwen',
  apiKey: process.env.QWEN_API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/',
});

const proModel = createOpenAICompatible({
  name: 'pro-model',
  baseURL: 'http://43.156.25.63:8000/v1',
});
const proModelTest = createOpenAICompatible({
  name: 'pro-model',
  baseURL: 'http://localhost:8000/v1',
});

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': qwen('qwen-max'),
        // 'chat-model': qwq('qwq-32k:latest'),
        'pro-model': wrapLanguageModel({
          model: proModel('james'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'chat-model-reasoning': wrapLanguageModel({
          model: qwen('qwq-plus'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': qwen('qwen-max'),

        'artifact-model': proModelTest('psybot-author'),
      },
      imageModels: {
        'small-model': xai.image('grok-2-image'),
      },
    });
