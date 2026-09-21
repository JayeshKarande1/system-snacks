import { foundationsTraffic } from "./lessons-foundations-traffic";
import { dataCache } from "./lessons-data-cache";
import { asyncDesign } from "./lessons-async-design";
export type Question = { prompt: string; options: [string,string,string]; correct: number; explanations: [string,string,string] };
export type Lesson = { id: string; deck: number; title: string; hook: string; idea: string; analogy: string; example: string; tradeoff: string; takeaway: string; diagram: [string,string,string]; caption: string; recall: string; questions: [Question,Question] };
export const decks = [
  { title: "Foundations", subtitle: "Start small. Think big.", icon: "blocks", color: "peach" },
  { title: "Traffic control", subtitle: "Keep requests moving.", icon: "route", color: "lavender" },
  { title: "Data decisions", subtitle: "A home for every byte.", icon: "database", color: "mint" },
  { title: "Caching", subtitle: "Skip the extra trip.", icon: "bolt", color: "yellow" },
  { title: "Async adventures", subtitle: "Good things take a queue.", icon: "send", color: "blue" },
  { title: "Connect the dots", subtitle: "Build the bigger picture.", icon: "puzzle", color: "pink" },
] as const;
export const lessons: Lesson[] = [
  {
    id: "request-journey", deck: 0, title: "A request’s little adventure", hook: "What really happens after you click?",
    idea: "A request is a message asking a system to do something. When you open a product page, your browser first needs to know where to send it. DNS resolves the website’s name to an address. The browser establishes a connection, usually protected by TLS, and sends an HTTP request. A server interprets that request, may read data, and returns an HTTP response. The browser then turns the response into something you can see.",
    analogy: "Think of ordering a sandwich. The address gets you to the café, the order tells the kitchen what you want, and the tray coming back is the response. Knowing the address is not the same as having your sandwich.",
    example: "For a profile page, the browser asks for a user, the application reads the user record, and a response carries the result back. Static images may come from a different server. A cached response can skip some steps, so not every click visits the database.",
    tradeoff: "Every extra network hop adds delay and another place something can fail. Separate components when they solve a real problem, and trace the whole request before blaming one server.",
    takeaway: "Follow the request, then follow the response.", diagram: ["Browser","Application","Database"], caption: "Request travels right; the response returns left. DNS and TLS happen before the application request.", recall: "Can you trace a profile request from browser to data and back?",
    questions: [
      { prompt: "What does DNS help your browser find?", options: ["The website’s network address","The current user’s password","The finished web page"], correct: 0, explanations: ["Exactly. DNS resolves a name to an address; the page still needs to be requested.","Passwords belong to authentication, not name resolution.","DNS finds an address. HTTP carries the page response afterward."] },
      { prompt: "A profile loads slowly. What is the best first move?", options: ["Add three databases","Trace time spent along the request","Replace HTTP with a queue"], correct: 1, explanations: ["More databases add complexity before you know the bottleneck.","Yes. Measuring each step reveals whether the delay is in the network, application, or data access.","A queue changes when work happens; it does not diagnose this slow read."] },
    ],
  },
  ...foundationsTraffic, ...dataCache, ...asyncDesign,
];

