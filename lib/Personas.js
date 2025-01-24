// @/lib/personas/personas.js

import { createModelConfig } from './personas/utils/modelFactory';
import { globalInstruction } from './personas/globalInstruction';
import { searchEngineInstruction } from './personas/searchEngineInstruction';
import { welcomeInstruction } from './personas/welcomeInstruction';
import { asisstantInstruction } from './personas/asisstantInstruction';

// Create all AI personas configurations
export const AIPersonas = [
   // Claude Models
   // createModelConfig({
   //    key: 'welcome-host-claude-3-5-sonnet-latest',
   //    name: 'Claude',
   //    categories: ['coding', 'chat'],
   //    role: 'welcome chat',
   //    provider: 'anthropic',
   //    modelCodeName: 'claude-3-5-sonnet-20241022',
   //    instructions: welcomeInstruction,
   //    description: 'A specialized guide for first-time users, providing a warm welcome and interactive introduction to the platform.',
   //    rating: 4.9,
   //    isPro: true,
   //    isNew: true,
   //    showOnModelSelection: false,
   //    features: {
   //       suitableFor: ['data_analysis', 'academic_research'],
   //       bestFor: ['detailed_explanations', 'data_driven_decisions'],
   //       specificFeatures: ['customization', 'security_features'],
   //    },
   // }),
   createModelConfig({
      key: 'claude-3-5-sonnet-latest-helper',
      name: 'Claude with Vision',
      categories: ['vision', 'complex_reasoning', 'coding', 'chat'],
      role: 'analytical_assistant',
      provider: 'anthropic',
      modelCodeName: 'claude-3-5-sonnet-20241022',
      hasVision: false,
      rating: 4.9,
      speed: 'fast',
      isPro: true,
      isNew: true,
      instructions: asisstantInstruction.replace("{{{_AI_ASSISTANT_}}}", 'Claude'),
      features: {
         suitableFor: ['data_analysis', 'academic_research'],
         bestFor: ['detailed_explanations', 'data_driven_decisions'],
         specificFeatures: ['customization', 'security_features'],
      }, capabilities: {
         supportedParameters: {
            maxTokens: {
               name: 'max_tokens', default: 8191  // Claude's high token limit         
               //
            },
            temperature: { supported: true, default: 0.7 }
         }
      },
   }),
   createModelConfig({
      key: 'claude-3-5-sonnet-latest',
      name: 'Claude with Vision',
      categories: ['vision', 'complex_reasoning', 'coding', 'chat'],
      role: 'analytical_assistant',
      provider: 'anthropic',
      modelCodeName: 'claude-3-5-sonnet-20241022',
      hasVision: true,
      description: 'Claude excels in delivering clear and concise analytical insights, making it ideal for data-driven decision-making and detailed explanations.',
      rating: 4.9,
      speed: 'fast',
      isPro: true,
      isNew: true,
      instructions: globalInstruction.replace("{{{_AI_ASSISTANT_}}}", 'Claude'),
      features: {
         suitableFor: ['data_analysis', 'academic_research'],
         bestFor: ['detailed_explanations', 'data_driven_decisions'],
         specificFeatures: ['customization', 'security_features'],
      }, capabilities: {
         supportedParameters: {
            maxTokens: {
               name: 'max_tokens', default: 8191  // Claude's high token limit         
               //
            },
            temperature: { supported: true, default: 0.7 }
         }
      },
   }),

   // OpenAI Models
   createModelConfig({
      key: 'CHATGPT-o1-preview',
      name: 'o1-preview',
      role: 'chatgpt',
      provider: 'openai',
      modelCodeName: 'o1-preview',
      categories: ['complex_reasoning'],
      capabilities: {
         supportsSystemMessage: false,
         supportedParameters: {
            maxTokens: {
               name: 'max_completion_tokens',
               default: 32000
            },
            temperature: {
               supported: false,
               default: 1
            }
         }
      },
      instructions: globalInstruction.replace("{{{_AI_ASSISTANT_}}}", 'o1-preview'),
      description: 'o1-preview is designed for generating comprehensive and detailed responses, suitable for in-depth analysis and extended conversations.',
      rating: 4.8,
      speed: 'slow',
      isNew: true,
      features: {
         suitableFor: ['content_creation', 'academic_research', 'coding_assistance'],
         bestFor: ['detailed_explanations', 'concise_summaries'],
         specificFeatures: ['language_support', 'customization'],
      },
   }),
   // createModelConfig({
   //    key: 'CHATGPT-o1',
   //    name: 'o1',
   //    role: 'chatgpt',
   //    provider: 'openai',
   //    modelCodeName: 'o1',
   //    categories: ['complex_reasoning'],
   //    capabilities: {
   //       supportsSystemMessage: false,
   //       supportedParameters: {
   //          maxTokens: {
   //             name: 'max_completion_tokens',
   //             default: 8000
   //          },
   //          temperature: {
   //             supported: false,
   //             default: 1
   //          }
   //       }
   //    },
   //    instructions: globalInstruction.replace("{{{_AI_ASSISTANT_}}}", 'o1-preview'),
   //    description: 'o1-preview is designed for generating comprehensive and detailed responses, suitable for in-depth analysis and extended conversations.',
   //    rating: 4.8,
   //    speed: 'slow',
   //    isNew: true,
   //    features: {
   //       suitableFor: ['content_creation', 'academic_research', 'coding_assistance'],
   //       bestFor: ['detailed_explanations', 'concise_summaries'],
   //       specificFeatures: ['language_support', 'customization'],
   //    },
   // }),

   createModelConfig({
      key: 'gpt-4o-mini',
      name: '4o-mini with Vision',
      role: 'visual_analysis_assistant',
      provider: 'openai',
      modelCodeName: 'gpt-4o-mini',
      categories: ['vision', 'chat'],
      hasVision: true,
      rating: 4.8,
      speed: 'fast',
      isPro: true,
      capabilities: {
         supportsSystemMessage: true,
         supportsImageGeneration: true,
         imageStyles: ['vivid', 'natural'],
         imageSizes: ['small', 'medium', 'large'],
         imageQualities: ['standard', 'hd'],
         supportedParameters: {
            maxTokens: {
               name: 'max_completion_tokens',
               default: 16000
            },
            temperature: {
               supported: true,
               default: 0.7
            }
         }
      },
      features: {
         suitableFor: ['image_analysis', 'visual_description', 'document_understanding'],
         bestFor: ['visual_content_analysis', 'image_based_queries', 'visual_problem_solving'],
         specificFeatures: ['image_understanding', 'multi_modal_interaction', 'detailed_visual_analysis'],
      },
      description: 'Advanced vision-enabled AI assistant capable of analyzing images and providing detailed visual understanding.',
      instructions: globalInstruction.replace("{{{_AI_ASSISTANT_}}}", '4o-mini'),
      allowed: {
         send: { text: true, file: true, image: true },
         receive: { text: true, file: false, image: true }
      }
   }),

   // DEEPSEEK
   createModelConfig({
      key: 'deepseek',
      name: 'deepseek',
      role: 'visual_analysis_assistant',
      provider: 'deepseek',
      modelCodeName: 'deepseek-chat',
      categories: ['chat'],
      hasVision: false,
      rating: 4.8,
      speed: 'fast',
      isPro: true,
      capabilities: {

         supportedParameters: {
            maxTokens: {
               name: 'max_completion_tokens',
               default: 8191  // DeepSeek's token limit
            },
            temperature: {
               supported: false,
               default: 1
            }
         }
      },
      features: {
         suitableFor: ['image_analysis', 'visual_description', 'document_understanding'],
         bestFor: ['visual_content_analysis', 'image_based_queries', 'visual_problem_solving'],
         specificFeatures: ['image_understanding', 'multi_modal_interaction', 'detailed_visual_analysis'],
      },
      description: 'Advanced vision-enabled AI assistant capable of analyzing images and providing detailed visual understanding.',
      instructions: globalInstruction.replace("{{{_AI_ASSISTANT_}}}", 'deepseek'),
   }),
   // createModelConfig({
   //    key: 'deepseek-reasoner',
   //    name: 'deepseek-reasoner',
   //    role: 'visual_analysis_assistant',
   //    provider: 'deepseek',
   //    modelCodeName: 'deepseek-reasoner',
   //    categories: ['chat'],
   //    hasVision: true,
   //    rating: 4.8,
   //    speed: 'fast',
   //    isPro: true,
   //    capabilities: {

   //       supportedParameters: {
   //          maxTokens: {
   //             name: 'max_completion_tokens',
   //             default: 8191  // DeepSeek's token limit
   //          },
   //          temperature: {
   //             supported: false,
   //             default: 1
   //          }
   //       }
   //    },
   //    features: {
   //       suitableFor: ['image_analysis', 'visual_description', 'document_understanding'],
   //       bestFor: ['visual_content_analysis', 'image_based_queries', 'visual_problem_solving'],
   //       specificFeatures: ['image_understanding', 'multi_modal_interaction', 'detailed_visual_analysis'],
   //    },
   //    description: 'Advanced vision-enabled AI assistant capable of analyzing images and providing detailed visual understanding.',
   //    instructions: globalInstruction.replace("{{{_AI_ASSISTANT_}}}", 'deepseek'),
   // }),

   createModelConfig({
      key: 'chatgpt-4o-latest',
      name: '4o',
      role: 'visual_analysis_assistant',
      provider: 'openai',
      capabilities: {
         supportsSystemMessage: true,
         supportsImageGeneration: true,
         imageStyles: ['vivid', 'natural'],
         imageSizes: ['small', 'medium', 'large'],
         imageQualities: ['standard', 'hd'],
         supportedParameters: {
            maxTokens: {
               name: 'max_completion_tokens',
               default: 8191
            },
            temperature: {
               supported: true,
               default: 0.7
            }
         }
      },
      modelCodeName: 'chatgpt-4o-latest',
      categories: ['chat'],
      hasVision: false,
      rating: 4.8,
      speed: 'fast',
      isPro: true,
      features: {
         suitableFor: ['image_analysis', 'visual_description', 'document_understanding'],
         bestFor: ['visual_content_analysis', 'image_based_queries', 'visual_problem_solving'],
         specificFeatures: ['image_understanding', 'multi_modal_interaction', 'detailed_visual_analysis'],
      },
      description: 'Advanced vision-enabled AI assistant capable of analyzing images and providing detailed visual understanding.',
      instructions: globalInstruction.replace("{{{_AI_ASSISTANT_}}}", '4o'),
      allowed: {
         send: { text: true, file: true, image: true },
         receive: { text: true, file: false, image: true }
      }
   }),

   createModelConfig({
      key: 'CHATGPT-o1-mini',
      name: 'o1-mini',
      role: 'chatgpt',
      provider: 'openai',
      modelCodeName: 'o1-mini',
      categories: ['coding'],
      color: 'from-gray-400 to-gray-500',
      capabilities: {
         supportsSystemMessage: false,
         supportedParameters: {
            maxTokens: {
               name: 'max_completion_tokens',
               default: 16000
            },
            temperature: {
               supported: false,
               default: 1
            }
         }
      },
      instructions: globalInstruction.replace("{{{_AI_ASSISTANT_}}}", 'o1-mini'),
      description: 'o1-mini offers quick and efficient responses, ideal for short queries and fast-paced interactions.',
      rating: 4.5,
      speed: 'fast',
      features: {
         suitableFor: ['quick_queries', 'customer_support'],
         bestFor: ['concise_summaries', 'interactive_assistance'],
         specificFeatures: ['integration_capabilities'],
      },
   }),

   // X Models
   createModelConfig({
      key: 'x-grok-2-vision-1212',
      name: 'X with Vision',
      categories: ['vision', 'coding', 'chat'],
      role: 'analytical_assistant',
      provider: 'x',
      modelCodeName: 'grok-2-vision-1212',
      hasVision: true,
      description: 'X is an advanced analytical assistant designed to provide tailored, in-depth analysis across various fields.',
      rating: 4.9,
      speed: 'fast',
      price_group: "expensive",
      isPro: true,
      isNew: true,
      instructions: globalInstruction.replace("{{{_AI_ASSISTANT_}}}", 'X'),
      features: {
         suitableFor: ['data_analysis', 'academic_research', 'technical_support'],
         bestFor: ['in_depth_analysis', 'customized_learning', 'interactive_coding'],
         specificFeatures: ['adaptive_communication', 'advanced_security', 'real_time_collaboration'],
      },
   }),

   createModelConfig({
      key: 'x-grok-2-1212',
      name: 'X',
      categories: ['coding', 'chat'],
      role: 'analytical_assistant',
      provider: 'x',
      modelCodeName: 'grok-2-vision-1212',
      description: 'X is an advanced analytical assistant designed for general-purpose AI interactions.',
      rating: 4.9,
      speed: 'fast',
      isPro: true,
      price_group: "expensive",
      isNew: true,
      instructions: globalInstruction.replace("{{{_AI_ASSISTANT_}}}", 'X'),
      features: {
         suitableFor: ['data_analysis', 'academic_research', 'technical_support'],
         bestFor: ['in_depth_analysis', 'customized_learning', 'interactive_coding'],
         specificFeatures: ['adaptive_communication', 'advanced_security', 'real_time_collaboration'],
      },
   }),

   // Gemini Model
   createModelConfig({
      key: 'gemini-vision-flash',
      name: 'Gemini with Vision',
      categories: ['complex_reasoning', 'coding', 'chat'],
      role: 'versatile_ai_assistant',
      provider: 'gemini',
      modelCodeName: 'gemini-2.0-flash-exp',
      hasVision: true,
      description: 'Gemini is a versatile AI assistant combining natural language understanding with vision capabilities.',
      rating: 4.8,
      speed: 'very_fast',
      isPro: true,
      isNew: true,
      instructions: globalInstruction.replace("{{{_AI_ASSISTANT_}}}", 'Gemini'),
      features: {
         suitableFor: ['data_analysis', 'creative_writing', 'code_generation', 'image_understanding'],
         bestFor: ['fast_responses', 'visual_analysis', 'interactive_coding'],
         specificFeatures: ['vision_understanding', 'code_generation', 'real_time_chat'],
      },
   }),

   // Perplexity Model
   createModelConfig({
      key: 'perplexity-mixtral',
      name: 'Perplexity',
      role: 'ai_based_search_engine',
      provider: 'perplexity',
      modelCodeName: 'llama-3.1-sonar-small-128k-online',
      categories: ['internet_search'],
      instructions: searchEngineInstruction,
      description: 'Real-time search with concise, accurate responses and engaging presentation.',
      rating: 4.7,
      speed: 'very_fast',
      isPro: true,
      isNew: true,
      features: {
         suitableFor: ['data_analysis', 'code_generation', 'research'],
         bestFor: ['live_real_data', 'accurate', 'user_friendly_explanations'],
         specificFeatures: ['high_performance', 'technical_accuracy', 'engaging_outputs'],
      },
   }),
];

// Utility functions
export const getModelByKey = (key) => AIPersonas.find(model => model.key === key);
export const getModelsByCategory = (category) => AIPersonas.filter(model => model.categories.includes(category));
export const getModelsByProvider = (provider) => AIPersonas.filter(model => model.provider === provider);
export const getAllModelKeys = () => AIPersonas.map(model => model.key);
export const getProModels = () => AIPersonas.filter(model => model.isPro);
export const getVisionModels = () => AIPersonas.filter(model => model.hasVision);
export const getImageGenerationModels = () =>
   AIPersonas.filter(model => model.capabilities.supportsImageGeneration);