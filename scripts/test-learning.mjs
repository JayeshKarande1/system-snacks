import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import ts from "typescript";

const directory = new URL("../.sites-runtime/tests/",import.meta.url);
await mkdir(directory,{recursive:true});
for(const file of ["progress","curriculum","lessons-foundations-traffic","lessons-data-cache","lessons-async-design"]){
  const source=await readFile(new URL(`../app/${file}.ts`,import.meta.url),"utf8");
  const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from "\.\/(.*?)"/g,'from "./$1.mjs"');
  await writeFile(new URL(`${file}.mjs`,directory),output);
}
const {lessons,decks}=await import(new URL("curriculum.mjs",directory));
const {emptyEntry,emptyProgress,completeAnswer,rateReview,afterDays,parseProgress}=await import(new URL("progress.mjs",directory));
assert.equal(lessons.length,24);
assert.equal(new Set(lessons.map(l=>l.id)).size,24);
for(let i=0;i<decks.length;i++)assert.equal(lessons.filter(l=>l.deck===i).length,4);
const counts=[];
for(const l of lessons){
 const count=[l.idea,l.analogy,l.example,l.tradeoff,l.takeaway].join(" ").split(/\s+/).length;
 counts.push(count);assert.ok(count>=180&&count<=240,`${l.id}: ${count} words`);
 assert.equal(l.questions.length,2);assert.equal(l.diagram.length,3);assert.ok(l.caption&&l.recall);
 for(const q of l.questions){assert.equal(q.options.length,3);assert.equal(q.explanations.length,3);assert.ok(q.correct>=0&&q.correct<3);assert.ok(q.explanations.every(Boolean));}
}
const now=new Date(2026,8,22,12);
let e=completeAnswer(emptyEntry(),0,now);assert.equal(e.completed,false);assert.equal(e.due,null);
e=completeAnswer(e,1,now);assert.equal(e.completed,true);assert.equal(e.due,"2026-09-23");
assert.deepEqual(completeAnswer(e,1,new Date(2026,8,24,12)),e,"Repeat completion must preserve review date");
for(const [days,stage] of [[3,1],[7,2],[14,3],[14,3]]){e=rateReview(e,true,now);assert.equal(e.due,afterDays(days,now));assert.equal(e.stage,stage);}
e=rateReview(e,false,now);assert.equal(e.due,"2026-09-23");assert.equal(e.stage,0);
assert.equal(afterDays(1,new Date(2026,11,31,12)),"2027-01-01");
assert.equal(afterDays(1,new Date(2028,1,28,12)),"2028-02-29");
const progress={...emptyProgress(),last:lessons[0].id,entries:{[lessons[0].id]:{...e,saved:true}}};
assert.deepEqual(parseProgress(JSON.stringify(progress),lessons.map(l=>l.id)),progress);
assert.throws(()=>parseProgress("broken",[]));
assert.throws(()=>parseProgress(JSON.stringify({...progress,version:2}),lessons.map(l=>l.id)));
assert.throws(()=>parseProgress(JSON.stringify({...progress,entries:{[lessons[0].id]:{...e,due:"2026-02-31"}}}),lessons.map(l=>l.id)));
console.log(`PASS: 24 lessons, 6 decks, 48 questions, ${Math.min(...counts)}–${Math.max(...counts)} words per lesson.`);
console.log("PASS: completion, duplicate completion, 3/7/14-day review, Again reset, year/leap boundaries, saved progress, corrupt data.");
