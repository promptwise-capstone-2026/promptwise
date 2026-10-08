export const TASKS = [
  {
    id: 'study',
    label: 'Study Support',
    hint: 'Understand a topic, practise, or prepare for study.',
    promptHint: 'For example: Explain phishing.',
    fields: [
      { key: 'context', label: 'Subject or learning context', placeholder: 'e.g. First-year Information Systems; preparing for a tutorial' },
      { key: 'focus', label: 'What should the explanation focus on?', placeholder: 'e.g. Common warning signs and two practical examples' },
      { key: 'currentKnowledge', label: 'What do you already know?', placeholder: 'Optional: what feels unclear so far' }
    ]
  },
  {
    id: 'summarisation',
    label: 'Summarisation',
    hint: 'Summarise supplied material for a clear purpose.',
    promptHint: 'For example: Summarise these lecture notes for revision.',
    fields: [
      { key: 'source', label: 'Source text to summarise', placeholder: 'Paste the relevant text here. The app keeps it in this browser session.', multiline: true },
      { key: 'focus', label: 'What should the summary focus on?', placeholder: 'e.g. Main arguments and evidence' },
      { key: 'targetLength', label: 'Target length', placeholder: 'e.g. 150 words or five points' }
    ]
  },
  {
    id: 'coding',
    label: 'Coding Assistance',
    hint: 'Understand code, debug, or plan an implementation.',
    promptHint: 'For example: Help me debug this JavaScript function.',
    fields: [
      { key: 'language', label: 'Language or framework', placeholder: 'e.g. JavaScript, Python, React' },
      { key: 'goal', label: 'Expected behaviour or goal', placeholder: 'What should the code do?' },
      { key: 'actual', label: 'Actual behaviour or error', placeholder: 'What happens instead? Include an error message if there is one.' },
      { key: 'code', label: 'Relevant code', placeholder: 'Paste only the code needed to understand the question.', multiline: true }
    ]
  },
  {
    id: 'report',
    label: 'Report Writing',
    hint: 'Plan, structure, or get feedback on a report.',
    promptHint: 'For example: Help me plan a report on cyber safety.',
    fields: [
      { key: 'purpose', label: 'Report purpose or question', placeholder: 'e.g. Analyse a case for a university assignment' },
      { key: 'criteria', label: 'Assessment criteria or required sections', placeholder: 'Paste or summarise the relevant requirements.', multiline: true },
      { key: 'draft', label: 'Draft or notes for feedback', placeholder: 'Optional: paste your own draft or notes.', multiline: true },
      { key: 'preserve', label: 'What should stay in your own voice?', placeholder: 'e.g. Keep my argument and references' }
    ]
  },
  {
    id: 'presentation',
    label: 'Presentation Preparation',
    hint: 'Shape a talk or slide outline.',
    promptHint: 'For example: Plan a five-minute presentation on cyber safety.',
    fields: [
      { key: 'topic', label: 'Topic and key message', placeholder: 'What should the audience take away?' },
      { key: 'duration', label: 'Duration or slide count', placeholder: 'e.g. Five minutes or six slides' },
      { key: 'source', label: 'Source notes or evidence', placeholder: 'Optional: paste notes the presentation should use.', multiline: true },
      { key: 'speakerNotes', label: 'Speaker note needs', placeholder: 'Optional: e.g. Brief talking points per slide' }
    ]
  },
  {
    id: 'other',
    label: 'Others',
    hint: 'Describe another academic task.',
    promptHint: 'Describe what you want help with.',
    fields: [
      { key: 'taskDescription', label: 'What academic task is this?', placeholder: 'e.g. Prepare interview questions for a research project' },
      { key: 'context', label: 'Relevant context', placeholder: 'What should the tool know?' },
      { key: 'source', label: 'Input or source material', placeholder: 'Optional: material the task depends on.', multiline: true }
    ]
  }
];

export const FORMATS = ['Paragraph', 'Bullet points', 'Table', 'Outline', 'Step-by-step', 'Study cards', 'Code with explanation', 'Other'];
export const LEVELS = ['First-year student', 'Undergraduate', 'Postgraduate'];
export const TONES = ['Academic', 'Clear and accessible', 'Conversational', 'Professional', 'Technical'];
export const DEPTHS = ['Concise', 'Moderate', 'Detailed'];

export function getTask(id) {
  return TASKS.find(task => task.id === id) || TASKS[0];
}
