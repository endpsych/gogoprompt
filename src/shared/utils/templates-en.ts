/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

/**
 * English Prompt Templates
 */

import { PromptTemplate } from './templates';

export const ENGLISH_TEMPLATES: PromptTemplate[] = [
  // Writing Templates
  {
    id: 'en-writing-improve',
    title: 'Improve My Writing',
    content: `Please improve the following text while maintaining its original meaning and tone. Focus on:
- Clarity and conciseness
- Grammar and punctuation
- Flow and readability
- Word choice

Text to improve:
{{text}}

Please provide the improved version and briefly explain the key changes you made.`,
    tags: ['writing', 'editing'],
    category: 'writing',
    description: 'Enhance and polish any piece of writing',
    language: 'en',
  },
  {
    id: 'en-writing-email',
    title: 'Professional Email Writer',
    content: `Write a professional email with the following details:

Purpose: {{purpose}}
Recipient: {{recipient}}
Tone: {{tone: formal/friendly/urgent}}
Key points to include:
{{key_points}}

Please write a clear, professional email that effectively communicates these points.`,
    tags: ['writing', 'email', 'business'],
    category: 'writing',
    description: 'Craft professional emails for any situation',
    language: 'en',
  },
  {
    id: 'en-writing-summarize',
    title: 'Summarize Text',
    content: `Please summarize the following text in {{length: a few sentences/a paragraph/bullet points}}:

{{text}}

Focus on the main ideas and key takeaways. Maintain accuracy while being concise.`,
    tags: ['writing', 'summary'],
    category: 'writing',
    description: 'Create concise summaries of longer content',
    language: 'en',
  },
  {
    id: 'en-writing-blog',
    title: 'Blog Post Outline',
    content: `Create a detailed blog post outline on the following topic:

Topic: {{topic}}
Target audience: {{audience}}
Desired length: {{length: short/medium/long}}
Tone: {{tone: professional/casual/educational}}

Please include:
1. A compelling title and subtitle
2. Introduction hook
3. Main sections with subpoints
4. Key takeaways
5. Call to action`,
    tags: ['writing', 'blog', 'content'],
    category: 'writing',
    description: 'Structure engaging blog posts from scratch',
    language: 'en',
  },

  // Coding Templates
  {
    id: 'en-coding-explain',
    title: 'Explain Code',
    content: `Please explain the following code in detail:

\`\`\`{{language}}
{{code}}
\`\`\`

Provide:
1. A high-level overview of what the code does
2. Line-by-line explanation of key parts
3. Any potential issues or improvements
4. Example use cases`,
    tags: ['coding', 'learning'],
    category: 'coding',
    description: 'Get detailed explanations of any code',
    language: 'en',
  },
  {
    id: 'en-coding-debug',
    title: 'Debug My Code',
    content: `I'm encountering an issue with my code. Please help me debug it.

Language: {{language}}
Code:
\`\`\`
{{code}}
\`\`\`

Error/Issue: {{error_description}}

Expected behavior: {{expected}}
Actual behavior: {{actual}}

Please identify the problem and provide a corrected version with explanations.`,
    tags: ['coding', 'debugging'],
    category: 'coding',
    description: 'Find and fix bugs in your code',
    language: 'en',
  },
  {
    id: 'en-coding-convert',
    title: 'Convert Code',
    content: `Please convert the following code from {{source_language}} to {{target_language}}:

\`\`\`{{source_language}}
{{code}}
\`\`\`

Requirements:
- Maintain the same functionality
- Use idiomatic patterns for the target language
- Include comments explaining any significant changes
- Note any features that don't translate directly`,
    tags: ['coding', 'conversion'],
    category: 'coding',
    description: 'Convert code between programming languages',
    language: 'en',
  },
  {
    id: 'en-coding-review',
    title: 'Code Review',
    content: `Please review the following code and provide feedback:

\`\`\`{{language}}
{{code}}
\`\`\`

Please evaluate:
1. Code quality and readability
2. Potential bugs or edge cases
3. Performance considerations
4. Security concerns
5. Best practices and suggestions for improvement

Provide specific, actionable feedback with examples.`,
    tags: ['coding', 'review'],
    category: 'coding',
    description: 'Get thorough code reviews with suggestions',
    language: 'en',
  },
  {
    id: 'en-coding-regex',
    title: 'Create Regex Pattern',
    content: `Create a regular expression pattern for the following requirement:

{{requirement}}

Please provide:
1. The regex pattern
2. Explanation of each component
3. Example matches and non-matches
4. Any edge cases to consider
5. Code snippet showing usage in {{language: JavaScript/Python/etc}}`,
    tags: ['coding', 'regex'],
    category: 'coding',
    description: 'Generate and explain regex patterns',
    language: 'en',
  },

  // Analysis Templates
  {
    id: 'en-analysis-pros-cons',
    title: 'Pros and Cons Analysis',
    content: `Please provide a comprehensive pros and cons analysis of:

{{topic}}

Context: {{context}}

For each point, explain:
- The significance
- Potential impact
- Relevant considerations

Conclude with a balanced summary and recommendation if applicable.`,
    tags: ['analysis', 'decision-making'],
    category: 'analysis',
    description: 'Weigh options for better decisions',
    language: 'en',
  },
  {
    id: 'en-analysis-compare',
    title: 'Compare Options',
    content: `Please compare the following options:

Option A: {{option_a}}
Option B: {{option_b}}
{{option_c: Option C (optional)}}

Criteria to consider: {{criteria}}

Provide:
1. Feature-by-feature comparison
2. Strengths and weaknesses of each
3. Use case recommendations
4. Overall recommendation based on {{priority}}`,
    tags: ['analysis', 'comparison'],
    category: 'analysis',
    description: 'Compare multiple options systematically',
    language: 'en',
  },
  {
    id: 'en-analysis-research',
    title: 'Research Summary',
    content: `Please provide a research summary on:

Topic: {{topic}}
Focus areas: {{focus_areas}}
Depth: {{depth: overview/detailed/comprehensive}}

Include:
1. Key concepts and definitions
2. Current state of the field
3. Major findings or trends
4. Challenges and open questions
5. Recommended resources for further reading`,
    tags: ['analysis', 'research'],
    category: 'analysis',
    description: 'Get structured research summaries',
    language: 'en',
  },

  // Creative Templates
  {
    id: 'en-creative-story',
    title: 'Story Starter',
    content: `Write a short story with the following elements:

Genre: {{genre}}
Setting: {{setting}}
Main character: {{character}}
Central conflict: {{conflict}}
Tone: {{tone}}
Length: {{length: flash fiction/short story}}

Create an engaging narrative with vivid descriptions, compelling dialogue, and a satisfying arc.`,
    tags: ['creative', 'writing', 'fiction'],
    category: 'creative',
    description: 'Generate creative story ideas and drafts',
    language: 'en',
  },
  {
    id: 'en-creative-brainstorm',
    title: 'Brainstorm Ideas',
    content: `Generate creative ideas for:

Topic/Challenge: {{topic}}
Context: {{context}}
Constraints: {{constraints}}
Number of ideas: {{count: 5-10}}

For each idea, provide:
- Brief description
- Key benefits
- Potential challenges
- First steps to implement

Think outside the box and include both conventional and unconventional approaches.`,
    tags: ['creative', 'brainstorming', 'ideas'],
    category: 'creative',
    description: 'Generate creative ideas for any challenge',
    language: 'en',
  },
  {
    id: 'en-creative-naming',
    title: 'Name Generator',
    content: `Generate name ideas for:

Type: {{type: product/company/project/character}}
Description: {{description}}
Tone/Style: {{tone: professional/playful/modern/classic}}
Keywords to incorporate: {{keywords}}

Please provide:
1. 10 name suggestions with brief explanations
2. Domain availability considerations (for business names)
3. Potential issues or considerations for each
4. Top 3 recommendations with reasoning`,
    tags: ['creative', 'naming', 'branding'],
    category: 'creative',
    description: 'Generate names for products, projects, or brands',
    language: 'en',
  },

  // Business Templates
  {
    id: 'en-business-pitch',
    title: 'Elevator Pitch',
    content: `Create a compelling elevator pitch for:

Product/Service: {{product}}
Target audience: {{audience}}
Key problem solved: {{problem}}
Unique value proposition: {{value_prop}}

The pitch should be:
- 30-60 seconds when spoken
- Clear and jargon-free
- Memorable and engaging
- End with a call to action`,
    tags: ['business', 'pitch', 'marketing'],
    category: 'business',
    description: 'Craft compelling elevator pitches',
    language: 'en',
  },
  {
    id: 'en-business-meeting',
    title: 'Meeting Agenda',
    content: `Create a structured meeting agenda:

Meeting purpose: {{purpose}}
Duration: {{duration}}
Attendees: {{attendees}}
Key topics: {{topics}}

Include:
1. Welcome and objectives (time allocation)
2. Topic breakdown with time limits
3. Discussion questions for each topic
4. Action items section
5. Next steps and follow-up`,
    tags: ['business', 'meetings', 'productivity'],
    category: 'business',
    description: 'Structure effective meeting agendas',
    language: 'en',
  },
  {
    id: 'en-business-feedback',
    title: 'Constructive Feedback',
    content: `Help me provide constructive feedback on:

Situation: {{situation}}
What went well: {{positives}}
Areas for improvement: {{improvements}}
Relationship context: {{context: peer/direct report/manager}}

Create feedback that is:
- Specific and actionable
- Balanced (positive and constructive)
- Focused on behavior, not personality
- Forward-looking with suggestions`,
    tags: ['business', 'feedback', 'communication'],
    category: 'business',
    description: 'Craft constructive feedback messages',
    language: 'en',
  },

  // Learning Templates
  {
    id: 'en-learning-explain',
    title: 'Explain Like I\'m 5',
    content: `Explain the following concept in simple terms that anyone can understand:

Concept: {{concept}}

Use:
- Simple language (no jargon)
- Relatable analogies and examples
- Step-by-step breakdown if applicable
- Visual descriptions where helpful

Then provide a slightly more advanced explanation for someone with basic knowledge.`,
    tags: ['learning', 'explanation'],
    category: 'learning',
    description: 'Get simple explanations of complex topics',
    language: 'en',
  },
  {
    id: 'en-learning-study',
    title: 'Study Guide Creator',
    content: `Create a comprehensive study guide for:

Topic: {{topic}}
Level: {{level: beginner/intermediate/advanced}}
Time available: {{time}}

Include:
1. Key concepts and definitions
2. Important facts to remember
3. Common misconceptions
4. Practice questions with answers
5. Memory aids and mnemonics
6. Suggested study schedule`,
    tags: ['learning', 'study', 'education'],
    category: 'learning',
    description: 'Generate study guides for any topic',
    language: 'en',
  },
  {
    id: 'en-learning-quiz',
    title: 'Quiz Generator',
    content: `Create a quiz to test knowledge on:

Topic: {{topic}}
Difficulty: {{difficulty: easy/medium/hard}}
Number of questions: {{count}}
Question types: {{types: multiple choice/true-false/short answer}}

Include:
1. Questions covering key concepts
2. Answer key with explanations
3. Scoring guide
4. Areas to review based on common mistakes`,
    tags: ['learning', 'quiz', 'education'],
    category: 'learning',
    description: 'Create quizzes to test understanding',
    language: 'en',
  },

  // Productivity Templates
  {
    id: 'en-productivity-breakdown',
    title: 'Task Breakdown',
    content: `Break down the following task into actionable steps:

Task: {{task}}
Deadline: {{deadline}}
Available resources: {{resources}}

Provide:
1. Clear, sequential steps
2. Estimated time for each step
3. Dependencies between steps
4. Potential blockers and solutions
5. Milestones for tracking progress`,
    tags: ['productivity', 'planning'],
    category: 'productivity',
    description: 'Break complex tasks into manageable steps',
    language: 'en',
  },
  {
    id: 'en-productivity-prioritize',
    title: 'Priority Matrix',
    content: `Help me prioritize the following tasks:

{{task_list}}

Consider:
- Urgency and deadlines
- Importance and impact
- Effort required
- Dependencies

Create a priority matrix (urgent/important quadrants) and suggest an order of execution with reasoning.`,
    tags: ['productivity', 'prioritization'],
    category: 'productivity',
    description: 'Prioritize tasks using proven frameworks',
    language: 'en',
  },
  {
    id: 'en-productivity-goals',
    title: 'SMART Goal Setter',
    content: `Help me create a SMART goal for:

General goal: {{goal}}
Timeframe: {{timeframe}}
Context: {{context}}

Create a goal that is:
- Specific: Clearly defined
- Measurable: With concrete metrics
- Achievable: Realistic given constraints
- Relevant: Aligned with broader objectives
- Time-bound: With clear deadlines

Include milestones and success criteria.`,
    tags: ['productivity', 'goals', 'planning'],
    category: 'productivity',
    description: 'Create well-defined, achievable goals',
    language: 'en',
  },
  {
    id: 'en-productivity-review',
    title: 'Weekly Review',
    content: `Guide me through a weekly review:

This week's accomplishments: {{accomplishments}}
Challenges faced: {{challenges}}
Upcoming priorities: {{priorities}}

Help me:
1. Celebrate wins and progress
2. Analyze what worked and what didn't
3. Extract lessons learned
4. Plan next week's top priorities
5. Identify potential obstacles and solutions`,
    tags: ['productivity', 'review', 'planning'],
    category: 'productivity',
    description: 'Structure effective weekly reviews',
    language: 'en',
  },
];
