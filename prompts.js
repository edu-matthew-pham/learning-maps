// prompts.js
// Loads markdown prompt templates and fills variables.
// No DOM access. No state. Pure async functions.

import { renderTemplate } from './utils.js';

const templateCache = {};

async function loadTemplate(path) {
  if (templateCache[path]) return templateCache[path];
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load prompt template: ${path}`);
  const text = await res.text();
  templateCache[path] = text;
  return text;
}

/**
 * Generate the Topic Explorer JSON generation prompt.
 * @param {Object} params
 * @param {string} params.topic
 * @param {string} params.yearLevel
 * @param {string} params.inquiryQuestion
 * @param {Object} params.schema - parsed JSON schema object
 * @returns {Promise<string>}
 */
export async function generateTopicPrompt({ topic, yearLevel, inquiryQuestion, schema, widthMode = 'typical' }) {
  const template = await loadTemplate('./prompts/generate_topic.md');

  const inquiryBlock = inquiryQuestion
    ? `Inquiry Question: ${inquiryQuestion}`
    : `No inquiry question provided. Create a meaningful guiding inquiry question that encourages historical thinking, causation, significance, or interpretation.`;

  const widthInstruction = {
    minimum: 'WIDTH INSTRUCTION: Generate minimum width content — core concepts only, 1 content block per node, concise descriptions, no enrichment directions.',
    typical: 'WIDTH INSTRUCTION: Generate typical width content — standard depth and breadth, 1–2 content blocks per node, balanced descriptions.',
    wider:   'WIDTH INSTRUCTION: Generate wider content — extended exploration, 2–3 content blocks per node, include enrichment directions, alternative perspectives, and deeper significance.',
  }[widthMode] || '';

  return renderTemplate(template, {
    topic,
    yearLevel,
    inquiryBlock,
    schema: JSON.stringify(schema, null, 2),
    widthInstruction,
  });
}

/**
 * Generate the learning activity / coach prompt.
 * @param {Object} mapData - the loaded topic explorer JSON
 * @returns {Promise<string>}
 */
export async function generateLearningActivityPrompt(mapData, widthMode = 'typical') {
  const template = await loadTemplate('./prompts/learning_activity.md');

  const widthCoachInstruction = {
    minimum: 'COACHING MODE: Minimum width — guide toward the core concept only. Keep questioning focused and convergent. Avoid enrichment or tangents.',
    typical: 'COACHING MODE: Typical width — guide through standard depth. Balance structured questioning with some exploration.',
    wider:   'COACHING MODE: Wider width — encourage extended exploration. Ask students to make connections, consider alternative perspectives, and pursue enrichment directions.',
  }[widthMode] || '';

  return renderTemplate(template, {
    topicJSON: JSON.stringify(mapData, null, 2),
    widthCoachInstruction,
  });
}