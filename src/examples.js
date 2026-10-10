// Synthetic demonstration content, not research evidence or real student documents.
// A finite shuffled deck provides variety without making paid AI calls to load examples.
const sample = (id, taskId, title, original, details, format, tone = 'Clear and accessible', depth = 'Concise') => ({
  id, taskId, title, original, details,
  preferences: { level: 'First-year student', format, tone, depth }
});
export const EXAMPLES = [
  sample('study-phishing', 'study', 'Recognise phishing emails', 'Explain phishing.', {
    context: 'First-year Information Systems tutorial.', focus: 'Recognising suspicious emails and why their warning signs matter.',
    currentKnowledge: 'I know messages can be deceptive but struggle to recognise convincing examples.',
    examples: 'Two clearly labelled fictional email examples and one question to check my understanding.',
    source: 'Synthetic lecture notes: Phishing messages may impersonate trusted organisations. Warning signs can include unexpected requests for sensitive information, urgency and misleading link destinations.',
    constraints: 'Keep the response under 200 words. Explain technical terms.'
  }, 'Bullet points'),
  sample('study-keys', 'study', 'Understand database keys', 'Explain primary and foreign keys.', {
    context: 'Preparing for an introductory database tutorial.', focus: 'The difference between the two key types and how tables connect.',
    currentKnowledge: 'I understand tables and rows but confuse the two types of key.', examples: 'Use a fictional Students and Enrolments example, then ask one practice question.',
    source: 'Synthetic lecture notes: A primary key uniquely identifies a row. A foreign key references a key in another table. An enrolment record can refer to a student record.',
    constraints: 'Use only the supplied concepts; explain any new terminology.'
  }, 'Table', 'Conversational', 'Moderate'),
  sample('study-requirements', 'study', 'Compare software requirements', 'Help me understand software requirements.', {
    context: 'Revision for a first-year systems analysis class.', focus: 'Distinguish functional requirements from quality requirements.',
    examples: 'Two fictional examples for a library app and a short self-check question.',
    source: 'Synthetic lecture notes: Functional requirements describe what a system should do. Quality requirements describe qualities such as usability or performance.',
    constraints: 'Do not invent performance targets for the library app.'
  }, 'Study cards'),
  sample('summary-databases', 'summarisation', 'Revise database notes', 'Summarise these notes.', {
    context: 'Revision before an introductory database tutorial.', focus: 'Keys and relationships.', targetLength: 'About 100 words.',
    source: 'Synthetic course notes: Relational databases organise records in tables. Primary keys identify rows. Foreign keys connect related tables. A join combines related data from tables.',
    constraints: 'Use only the supplied notes. Flag anything that needs clarification.'
  }, 'Bullet points'),
  sample('summary-usability', 'summarisation', 'Summarise practice feedback', 'Summarise this feedback for my group.', {
    context: 'A group reviewing a fictional student timetable prototype.', focus: 'Recurring problems and possible follow-up questions.', targetLength: 'Three main points.',
    source: 'Synthetic feedback: Participant A could not find the edit button. Participant B liked the weekly view but missed the save confirmation. Participant C also struggled to find edit. These are fictional practice observations.',
    constraints: 'Keep observations separate from suggestions. Do not generalise beyond these three fictional observations.'
  }, 'Table', 'Professional'),
  sample('summary-cloud', 'summarisation', 'Organise cloud concepts', 'Make revision notes from this.', {
    context: 'Preparing a short revision sheet for an introductory IT class.', focus: 'The difference between IaaS, PaaS and SaaS.', targetLength: 'Up to 150 words.',
    source: 'Synthetic lecture notes: IaaS provides infrastructure resources. PaaS provides a managed application platform. SaaS provides an application used as a service. Responsibility depends on the service and provider.',
    constraints: 'Do not add vendors or prices that are absent from the notes.'
  }, 'Study cards'),
  sample('code-sum', 'coding', 'Debug a missing return', 'Help me debug this JavaScript function.', {
    language: 'JavaScript', goal: 'Return the sum of two numbers.', actual: 'The function returns undefined.',
    code: 'function add(a, b) { a + b; }', criteria: 'Explain the cause and guide my reasoning before showing a correction.',
    constraints: 'Use plain JavaScript without external libraries.'
  }, 'Code with explanation', 'Clear and accessible', 'Moderate'),
  sample('code-loop', 'coding', 'Find a loop boundary issue', 'Why does my loop print an extra value?', {
    language: 'JavaScript', goal: 'Print each fruit name once.', actual: 'The output includes undefined after the fruit names.',
    code: 'const fruits = ["apple", "pear"];\nfor (let i = 0; i <= fruits.length; i++) {\n  console.log(fruits[i]);\n}',
    criteria: 'Help me trace the index values, then suggest the smallest correction.', constraints: 'Keep the array and the for-loop approach.'
  }, 'Step-by-step'),
  sample('code-python', 'coding', 'Understand a Python type error', 'Help me fix this Python code.', {
    language: 'Python 3', goal: 'Show the age after one more year.', actual: 'Adding 1 to the entered age raises a TypeError.',
    code: 'age = input("Age: ")\nprint(age + 1)', criteria: 'Explain the types involved and let me predict the fix before revealing it.',
    constraints: 'Assume valid whole-number input for this exercise; mention that assumption explicitly.'
  }, 'Code with explanation', 'Conversational'),
  sample('report-intro', 'report', 'Review a report introduction', 'Give feedback on my report introduction.', {
    purpose: 'A student report about phishing awareness.', draft: 'Phishing is a problem. Our project will explore ways students recognise suspicious messages.',
    criteria: 'Practice brief: explain the problem, intended audience and project aim.', preserve: 'Keep my project aim and intended meaning.',
    constraints: 'Give feedback on focus and structure. Do not write the report for me or invent statistics.'
  }, 'Bullet points', 'Academic'),
  sample('report-outline', 'report', 'Plan a usability report', 'Help me plan my report.', {
    purpose: 'Describe a small usability review of a fictional timetable prototype.',
    criteria: 'Practice brief: include the aim, method, observations, limitations and next steps.',
    draft: 'Planning notes: three fictional participants; edit control hard to find; save confirmation unclear. No real user study has been conducted.',
    preserve: 'Keep fictional practice observations clearly labelled.', constraints: 'Suggest an outline and questions I need to answer. Do not present these notes as real research results.'
  }, 'Outline', 'Professional', 'Moderate'),
  sample('report-argument', 'report', 'Strengthen an argument', 'Help me improve this paragraph.', {
    purpose: 'A practice report discussing usability and account security.',
    draft: 'More login checks always make a system better. However, some users find repeated checks frustrating. We need to think about both issues.',
    criteria: 'Practice brief: make a balanced argument and identify claims that need evidence.',
    preserve: 'Keep the discussion of security and user frustration.', constraints: 'Give revision suggestions rather than replacing my paragraph. Do not invent references.'
  }, 'Table', 'Academic'),
  sample('presentation-phishing', 'presentation', 'Plan a phishing awareness talk', 'Help me plan a presentation about phishing.', {
    topic: 'Recognising suspicious messages before acting.', duration: 'Five minutes; four slides.',
    source: 'Synthetic notes: inspect the sender, check link destinations and report suspicious messages through the appropriate channel.',
    criteria: 'Practice brief: introduce the problem, explain warning signs and finish with a short audience question.',
    speakerNotes: 'Brief talking points for each slide.', constraints: 'Use fictional examples and flag where verified evidence would help.'
  }, 'Outline', 'Clear and accessible', 'Moderate'),
  sample('presentation-library', 'presentation', 'Present a library prototype', 'Help me present our library app idea.', {
    topic: 'A fictional prototype for finding available study rooms.', duration: 'Three minutes; three slides.',
    source: 'Synthetic project notes: proposed room search and booking confirmation screens. No implementation, user testing or performance measurements yet.',
    criteria: 'Practice brief: explain the problem, proposed workflow and next validation step.',
    speakerNotes: 'Short notes for speaking to classmates.', constraints: 'Distinguish proposed features from completed work. Do not invent user-test results.'
  }, 'Outline', 'Professional'),
  sample('presentation-keys', 'presentation', 'Teach database relationships', 'Plan a short talk on database relationships.', {
    topic: 'How Students and Enrolments tables can be connected.', duration: 'Four minutes; up to four slides.',
    source: 'Synthetic lecture notes: a student has a unique identifier; each enrolment refers to a student identifier. One student can have multiple enrolments.',
    criteria: 'Practice brief: introduce the two tables, illustrate a relationship and ask one checking question.',
    speakerNotes: 'One transition sentence per slide.', constraints: 'Use fictional records. Describe any proposed diagram in words.'
  }, 'Outline', 'Conversational', 'Moderate'),
  sample('other-interview', 'other', 'Prepare usability interview questions', 'Help me prepare interview questions.', {
    taskDescription: 'Prepare interview questions for a student usability study.', context: 'Interview students after they use a prompt-coaching prototype.',
    focus: 'Find confusing steps and useful feedback.', constraints: 'Six neutral, open questions. Do not assume participants liked the app.'
  }, 'Bullet points', 'Conversational'),
  sample('other-email', 'other', 'Plan a supervisor update', 'Help me write an update to my supervisor.', {
    taskDescription: 'Plan an academic project progress email.', context: 'Our student prototype now has a task selector and editable prompt output; formal user testing is still pending.',
    focus: 'Explain progress, the next test session and one request for feedback.',
    constraints: 'Use only the supplied project facts. Leave the supervisor name and meeting date as placeholders.'
  }, 'Paragraph', 'Professional'),
  sample('other-studyplan', 'other', 'Make a revision plan', 'Help me plan my revision.', {
    taskDescription: 'Organise revision for a university database quiz.', context: 'I have three evenings with 45 minutes available each evening.',
    focus: 'Primary keys, foreign keys and simple joins.', source: 'Synthetic topic list: keys, relationships and introductory joins.',
    constraints: 'Include a short self-check each evening. Do not assume the actual quiz questions or invent a quiz date.'
  }, 'Table')
];

/** No repeats within a deck; a new cycle cannot immediately repeat the last item.
 * State lasts for this page session only. Returned copies can be freely edited. */
export function createExamplePicker(random = Math.random) {
  let deck = [], lastId = '';
  return () => {
    if (!deck.length) {
      deck = [...EXAMPLES];
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      if (deck.at(-1)?.id === lastId) [deck[0], deck[deck.length - 1]] = [deck.at(-1), deck[0]];
    }
    const selected = deck.pop();
    lastId = selected.id;
    return structuredClone(selected);
  };
}
