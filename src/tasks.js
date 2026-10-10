export const TASKS = [
  {
    id: 'study',
    label: 'Study Support',
    hint: 'Understand a topic, practise, or prepare for study.',
    promptHint: 'For example: Explain phishing.',
    fields: [
      { key: 'context', label: 'Subject or learning context', placeholder: 'e.g. First-year Information Systems; preparing for a tutorial' },
      { key: 'focus', label: 'What should the explanation focus on?', placeholder: 'e.g. Common warning signs and two practical examples' },
      { key: 'currentKnowledge', label: 'What do you already know?', placeholder: 'Optional: what feels unclear so far' },
      { key: 'examples', label: 'Examples or practice you would find useful', placeholder: 'Optional: one worked example, a real-world analogy, or practice questions' },
      { key: 'source', label: 'Lecture slides, notes or related material', placeholder: 'Paste the relevant passage, or add a PDF, DOCX, PPTX, TXT or MD file below.', multiline: true },
      { key: 'criteria', label: 'Study question or assessment instructions', placeholder: 'Optional: add the question, assignment guide or rubric if it affects this request.', multiline: true }
    ]
  },
  {
    id: 'summarisation',
    label: 'Summarisation',
    hint: 'Summarise supplied material for a clear purpose.',
    promptHint: 'For example: Summarise these lecture notes for revision.',
    fields: [
      { key: 'source', label: 'Material to summarise', placeholder: 'Paste the relevant text, or add the document or slide deck below.', multiline: true },
      { key: 'context', label: 'Purpose of the summary', placeholder: 'Optional: revision notes, a literature comparison, or a briefing for my group' },
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
      { key: 'code', label: 'Relevant code', placeholder: 'Paste the relevant code, or add a TXT or MD file.', multiline: true },
      { key: 'source', label: 'Related documentation or learning material', placeholder: 'Optional: add the relevant documentation, lecture slides or assignment background.', multiline: true },
      { key: 'criteria', label: 'Coding requirements or assignment instructions', placeholder: 'Optional: supplied requirements, allowed libraries or expected tests.', multiline: true }
    ]
  },
  {
    id: 'report',
    label: 'Report Writing',
    hint: 'Plan, structure, or get feedback on a report.',
    promptHint: 'For example: Help me plan a report on cyber safety.',
    fields: [
      { key: 'purpose', label: 'Report purpose or question', placeholder: 'e.g. Analyse a case for a university assignment' },
      { key: 'criteria', label: 'Assignment guide, rubric or report template', placeholder: 'Paste or summarise the relevant requirements.', multiline: true },
      { key: 'source', label: 'Readings, case study or supporting sources', placeholder: 'Optional: supply the material the report should draw on.', multiline: true },
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
      { key: 'criteria', label: 'Presentation brief or marking criteria', placeholder: 'Optional: add the brief, required sections or assessment guide.', multiline: true },
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
      { key: 'focus', label: 'Specific question or outcome', placeholder: 'Which part of your task do you want help with?' },
      { key: 'source', label: 'Input or source material', placeholder: 'Optional: material the task depends on.', multiline: true },
      { key: 'criteria', label: 'Task instructions or assessment requirements', placeholder: 'Optional: supplied instructions that apply to this task.', multiline: true }
    ]
  }
];

export const FORMATS = ['Paragraph', 'Bullet points', 'Table', 'Outline', 'Step-by-step', 'Study cards', 'Code with explanation', 'Other'];
export const LEVELS = ['First-year student', 'Undergraduate', 'Postgraduate'];
export const TONES = ['Academic', 'Clear and accessible', 'Conversational', 'Professional', 'Technical'];
export const DEPTHS = ['Concise', 'Moderate', 'Detailed'];

export const PREFERENCE_LABELS = { level: 'Educational level', audience: 'Audience', depth: 'Response depth', tone: 'Tone', format: 'Output format' };

export function getDetailLabel(key, taskId) {
  const taskField = TASKS.find(task => task.id === taskId)?.fields.find(field => field.key === key);
  const anyField = TASKS.flatMap(task => task.fields).find(field => field.key === key);
  return taskField?.label || ({ source: 'Relevant source material', constraints: 'Other requirements or limits' })[key] || anyField?.label || key;
}

export function getTask(id) {
  return TASKS.find(task => task.id === id) || TASKS[0];
}
