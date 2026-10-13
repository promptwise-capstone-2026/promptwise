# About PromptWise page content

Public copy for the auxiliary About & team page. Prepared on 10 October 2026.
The names and subject details were checked against the supplied final report.
The credits-page request comes from the user relaying Amara's recommendation.

## Public page copy

### About PromptWise

**A student prompt coach, developed for the UTS Information Systems Capstone.**

PromptWise helps university students turn an initial idea into a clearer,
better-scoped prompt before using a generative AI tool. It highlights missing
or unclear details, explains why they matter, and helps students prepare a
revised prompt they can review, edit and copy.

### Why we built it

Knowing what you need help with does not always mean knowing how to ask for it.
A short prompt may leave out the task purpose, audience, relevant material or
expected response. PromptWise makes those choices easier to see and supports
students in developing their own prompting skills.

### How it works

1. **Choose a task** — select the academic activity or describe your own.
2. **Enter your prompt** — start with your original words.
3. **Review the analysis** — see what is present, unclear or missing.
4. **Add useful details** — supply relevant context, material or preferences.
5. **Compare and edit** — review the revised prompt and copy your chosen version.

### Our approach

PromptWise uses seven task-aware criteria: clarity, context, specificity,
constraints, output format, audience/level and input/source material. Tone and
response depth are optional preferences. The purpose is to make prompt choices
understandable while keeping the student in control.

Local rules mode checks wording and assembles a draft in the browser without AI.
When enabled by the app owner, OpenAI mode analyses and rewrites prompts
using the same seven criteria. You choose the mode before starting, and each
result identifies its mode. AI findings can be wrong. Only an explicit Analyse
or Create action sends the selected text to OpenAI, after you agree. Original
files and images are not uploaded. The final prompt is still copied manually.

Optional History saves prompts, evaluations and edited drafts in this browser.
It can also recover your unfinished prompt after refresh. There is no account or
device sync. Saving can include accepted material text, so avoid sensitive work
and shared devices. You can export or remove saved data.

### Team & responsibilities

**Luu Quoc Thai Tran**

**Application development & technical integration**

System architecture, prompt-framework implementation, application development,
AI/API integration, evaluation planning and overall project integration.

**Noah Holt**

**Prompt engineering research**

GenAI in higher education, prompt-engineering principles and prompt quality,
existing-tool research, test prompts/use cases and related literature review
contributions.

**Angela Liu**

**UX & student learning**

Student use of GenAI and AI-assisted learning, user requirements, mobile UI and
user flows, wireframes and usability-test planning.

**Shared work:** We carried out the Design Thinking process together.
Existing-tool review is shared, with Noah focusing on prompt engineering research.
All three team members contribute to testing, meetings, presentations, discussion
and conclusions, and final-report review.

Developed as part of **41195 Information Systems Capstone** at the
**University of Technology Sydney**, 2026.

### Project supervision

**Dr Amara Atif — Project supervisor**

We thank Dr Amara Atif for her guidance and feedback on the project's scope
and development.

### Use responsibly

PromptWise supports prompt preparation. Students remain responsible for their
work, the information they share and their assessment requirements. Review
suggestions and check facts and sources in any AI response. The final prompt is
copied manually into the student's chosen tool.

### Copyright & licensing

© 2026 PromptWise Project Team: Luu Quoc Thai Tran, Noah Holt and Angela Liu.

The team's original project documentation and educational explanatory text are
licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).
Non-commercial sharing and adaptation require attribution, a licence link and
identification of changes. Commercial reuse requires separate permission from
the relevant rights holders, unless permitted by law.

The notice excludes source code, code examples, third-party libraries, portraits,
logos, user-supplied materials and AI-generated results. Their own rights and
terms continue to apply. It does not grant exclusive rights to the underlying idea.

**Return to prompt**

## Implementation notes — do not render as public copy

- Responsibilities were supplied by Thai on 10 October 2026 as the initial
  allocation. They identify focus areas, not proof that planned work is completed.
  The report assigns Existing Tools and Methodology/Design Thinking to all three;
  Noah also has GenAI in Higher Education. Preserve those shared contributions.
- Appendix B in the supplied report is still a contribution-table template. Fill
  it later using actual work/evidence, including AI assistance where applicable.
- Thai and Amara portraits are supplied in `public/team/thai.jpeg` and
  `public/team/amara-atif.jpeg`. All four avatar spaces display at 96 × 96 CSS px;
  Noah and Angela use decorative initials while their photos are pending.
  Thai supplied an aligned square portrait; display it without extra zoom or offsets.
  To add a remaining photo, save `noah.jpeg` or `angela.jpeg`, update its TEAM
  photo path in `src/app.js`, add the exact URL to the server allowlist and
  service-worker assets, and bump the cache. Do not cache a missing photo.
  Profile URLs are still pending; do not substitute generic or invented portraits.
- The authorisation to read private source files does not authorise publishing
  their contents, student numbers, emails or downloadable originals.
- Personal portfolio, CV and LinkedIn links can be added after the team supplies
  the actual URLs and agrees to display them. Omit unavailable links entirely;
  do not display placeholders or non-working buttons.
- This copy does not claim Amara or UTS endorses the product or guarantees a
  reference, recommendation or employment outcome.
- Derive current engine/version text from the actual configured application
  when AI is integrated. Update the privacy wording with the real data flow.
- The page's source explanation is separate from the more detailed report.
  Do not provide private report or contract download links.
