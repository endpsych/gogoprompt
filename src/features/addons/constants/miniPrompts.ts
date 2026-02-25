/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

export const MINI_PROMPTS = [
  {
    category: "Analysis",
    items: [
      { label: "Pros & Cons", value: "Analyze the request by weighing the pros and cons first." },
      { label: "First Principles", value: "Break the problem down to its fundamental truths and reason up from there." },
      { label: "Self-Correction", value: "Critique your own answer for potential flaws, then correct them." },
      { label: "Root Cause", value: "Identify the underlying cause of the issue, not just the symptoms." },
      { label: "SWOT", value: "Provide a SWOT analysis (Strengths, Weaknesses, Opportunities, Threats)." }
    ]
  },
  {
    category: "Code",
    items: [
      { label: "TypeScript", value: "Use TypeScript with strict typing." },
      { label: "Pythonic", value: "Use Pythonic conventions and PEP 8 standards." },
      { label: "Add Comments", value: "Add detailed comments explaining the 'why' behind complex logic." },
      { label: "Modern Syntax", value: "Use the latest stable syntax and features (e.g., ES6+, Python 3.10+)." },
      { label: "Clean Code", value: "Follow Clean Code principles: meaningful names, small functions, and DRY." },
      { label: "Error Handling", value: "Include robust error handling and input validation." },
      { label: "Unit Tests", value: "Include comprehensive unit tests for the provided code." },
      { label: "Optimize Speed", value: "Prioritize execution speed and memory efficiency in the solution." },
      { label: "Functional", value: "Use functional programming paradigms (immutability, pure functions) where possible." }
    ]
  },
  {
    category: "Constraints",
    items: [
      { label: "No Preamble", value: "Skip the introduction. Go straight to the answer." },
      { label: "Code Only", value: "Provide the code only. No text explanation is needed." },
      { label: "Direct", value: "Skip the small talk; just answer the request directly." },
      { label: "Word Limit", value: "Keep the response under 100 words." },
      { label: "No Hallucination", value: "If you do not know the answer, explicitly state that you do not know. Do not make up facts." },
      { label: "Neutral POV", value: "Present the information neutrally, avoiding bias or opinion." },
      { label: "No Moralizing", value: "Answer the request directly without adding ethical warnings or safety lectures." },
      { label: "Format Only", value: "Strictly follow the requested format. Do not add intro or outro text." }
    ]
  },
  {
    category: "Audience",
    items: [
      { label: "Executive", value: "Draft this for a C-Level executive. Focus on ROI and bottom line." },
      { label: "Beginner", value: "Assume the reader has zero prior knowledge of the topic." },
      { label: "Expert", value: "Assume the reader is an expert. Use technical jargon." }
    ]
  },
  {
    category: "Sourcing",
    items: [
      { label: "Citations", value: "Cite specific sources or dates for every claim." },
      { label: "Empirical", value: "Prioritize data and statistics over qualitative descriptions." },
      { label: "Counter-Args", value: "Address the strongest counter-argument to this point." }
    ]
  },
  {
    category: "Format",
    items: [
      { label: "Markdown Table", value: "Format the output as a Markdown table." },
      { label: "JSON", value: "Output the result as a valid JSON object." },
      { label: "Bullet Points", value: "Use a concise bulleted list." },
      { label: "Code Block", value: "Wrap the code in a single block." }
    ]
  },
  {
    category: "Tone",
    items: [
      { label: "Professional", value: "Maintain a professional, objective tone." },
      { label: "ELI5", value: "Explain it simply, as if to a 5-year-old." },
      { label: "Sarcastic", value: "Answer with a heavy dose of sarcasm." },
      { label: "Concise", value: "Be extremely concise. No filler." }
    ]
  },
  {
    category: "Role",
    items: [
      { label: "Expert Coder", value: "Act as a Senior Software Engineer." },
      { label: "Critic", value: "Act as a critical reviewer looking for flaws." },
      { label: "Teacher", value: "Act as a patient teacher guiding a student." }
    ]
  }
];