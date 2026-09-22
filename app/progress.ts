export const STORAGE_KEY = "system-snacks:v1";
export type Entry = { started: boolean; saved: boolean; answers: number[]; completed: boolean; stage: number; due: string | null };
export type Progress = { version: 1; entries: Record<string, Entry>; last: string | null };
export const emptyProgress = (): Progress => ({ version: 1, entries: {}, last: null });
export const emptyEntry = (): Entry => ({ started: false, saved: false, answers: [], completed: false, stage: 0, due: null });
export function dayKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
export function afterDays(days: number, now = new Date()) { const date = new Date(now); date.setDate(date.getDate()+days); return dayKey(date); }
function validDay(value: unknown): boolean {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year,month,day]=value.split("-").map(Number);
  const date=new Date(year,month-1,day,12);
  return dayKey(date)===value;
}
export function rateReview(entry: Entry, remembered: boolean, now = new Date()): Entry {
  const days = remembered ? [3,7,14][Math.min(entry.stage,2)] : 1;
  return { ...entry, stage: remembered ? Math.min(entry.stage+1,3) : 0, due: afterDays(days,now) };
}
export function completeAnswer(entry: Entry, question: number, now = new Date()): Entry {
  const answers = Array.from(new Set([...entry.answers,question]));
  const completed = answers.includes(0) && answers.includes(1);
  return { ...entry, started: true, answers, completed, due: completed && !entry.completed ? afterDays(1,now) : entry.due };
}
export function parseProgress(raw: string | null, ids: string[]): Progress {
  if (!raw) return emptyProgress();
  const value = JSON.parse(raw);
  if (value?.version !== 1 || !value.entries || typeof value.entries !== "object" || Array.isArray(value.entries)) throw new Error("Invalid progress");
  const result = emptyProgress();
  result.last = ids.includes(value.last) ? value.last : null;
  for (const id of ids) {
    const e = value.entries[id];
    if (!e) continue;
    if (typeof e.started !== "boolean" || typeof e.saved !== "boolean" || typeof e.completed !== "boolean" || !Array.isArray(e.answers) || !e.answers.every((a: unknown)=>a===0||a===1) || !Number.isInteger(e.stage) || e.stage<0 || e.stage>3 || (e.due!==null && !validDay(e.due))) throw new Error("Invalid lesson progress");
    const answers = Array.from(new Set<number>(e.answers));
    if (e.completed !== (answers.includes(0) && answers.includes(1)) || (e.completed && e.due===null)) throw new Error("Incomplete progress");
    result.entries[id] = { ...emptyEntry(), ...e, answers };
  }
  return result;
}
