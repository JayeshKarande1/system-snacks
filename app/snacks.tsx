"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Bookmark, BookOpen, Check, ChevronRight, Clock3, Database, Layers3, Lightbulb, Monitor, Network, Puzzle, RotateCcw, Send, Sparkles, Sprout, Zap } from "lucide-react";
import { decks, lessons, type Lesson } from "./curriculum";
import { STORAGE_KEY, completeAnswer, dayKey, emptyEntry, emptyProgress, parseProgress, rateReview, type Entry, type Progress } from "./progress";

const icons = [Layers3, Network, Database, Zap, Send, Puzzle];
type View = "Learn" | "Review" | "Saved";
function Diagram({ lesson }: { lesson: Lesson }) {
  return <figure className="diagram"><svg viewBox="0 0 620 100" role="img" aria-label={lesson.diagram.join(" → ")}><defs><marker id={`arrow-${lesson.id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="currentColor" /></marker></defs>{lesson.diagram.map((label,i)=><g key={label}>{i<2&&<line x1={175+i*210} y1="49" x2={229+i*210} y2="49" stroke="currentColor" strokeWidth="2" markerEnd={`url(#arrow-${lesson.id})`} /> }<rect x={10+i*210} y="15" width="160" height="68" rx="16" fill="white" stroke="currentColor" strokeWidth="1.5"/><text x={90+i*210} y="54" textAnchor="middle" fontSize="16" fontWeight="600" fill="currentColor">{label}</text></g>)}</svg><figcaption>{lesson.caption}</figcaption></figure>;
}
export default function Snacks() {
  const [progress,setProgress] = useState<Progress>(emptyProgress);
  const [ready,setReady] = useState(false);
  const [warning,setWarning] = useState("");
  const [view,setView] = useState<View>("Learn");
  const [deck,setDeck] = useState<number|null>(null);
  const [active,setActive] = useState<string|null>(null);
  const [mode,setMode] = useState<"lesson"|"review">("lesson");
  const [revealed,setRevealed] = useState(false);
  const [quiz,setQuiz] = useState<number|null>(null);
  const [choice,setChoice] = useState<number|null>(null);
  const [sessionAnswers,setSessionAnswers] = useState<number[]>([]);
  const [celebrate,setCelebrate] = useState(false);
  const [notice,setNotice] = useState("");
  const [today,setToday] = useState(dayKey);
  const heading = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<HTMLElement|null>(null);
  const dirty = useRef(false);
  useEffect(()=>{
    try { setProgress(parseProgress(localStorage.getItem(STORAGE_KEY),lessons.map(l=>l.id))); }
    catch { setWarning("Saved progress could not be loaded. You can keep learning; new progress will start here."); }
    setReady(true);
    const refresh=()=>setToday(dayKey());
    const timer=setInterval(refresh,60_000);
    window.addEventListener("focus",refresh);
    return ()=>{ clearInterval(timer); window.removeEventListener("focus",refresh); };
  },[]);
  useEffect(()=>{
    if (!ready || !dirty.current) return;
    try { localStorage.setItem(STORAGE_KEY,JSON.stringify(progress)); }
    catch { setWarning("Your browser can’t save progress. You can keep learning, but changes will be lost when you leave."); }
  },[progress,ready]);
  useEffect(()=>{ if(active) { heading.current?.focus(); window.scrollTo({top:0,behavior:"instant"}); } },[active,quiz,celebrate]);
  const entry = (id:string) => progress.entries[id] ?? emptyEntry();
  function change(id:string,update:(e:Entry)=>Entry,last=false) {
    dirty.current=true;
    setProgress(p=>({...p,last:last?id:p.last,entries:{...p.entries,[id]:update(p.entries[id]??emptyEntry())}}));
  }
  function openLesson(id:string,review=false) {
    returnFocus.current=document.activeElement as HTMLElement;
    setActive(id);setMode(review?"review":"lesson");setRevealed(false);setQuiz(null);setChoice(null);setSessionAnswers([]);setCelebrate(false);setNotice("");
    change(id,e=>({...e,started:true}),!review);
  }
  function closeLesson() { const id=active;setActive(null);setQuiz(null);setCelebrate(false);requestAnimationFrame(()=>{const target=returnFocus.current; if(target?.isConnected) target.focus(); else (document.querySelector(`[data-lesson-id="${id}"]`) as HTMLElement|null)?.focus();});}
  function navigate(next:View) {setView(next);setDeck(null);setActive(null);setNotice("");window.scrollTo({top:0,behavior:"instant"});}
  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{if(e.key==="Escape"&&active)closeLesson();};
    window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);
  },[active]);
  useEffect(()=>{
    type Context={registerTool:(tool:object,options:{signal:AbortSignal})=>unknown};
    const ctx=(document as Document & {modelContext?:Context}).modelContext;
    if(!ctx) return;
    const lifecycle=new AbortController();
    try { Promise.resolve(ctx.registerTool({name:"open_system_design_lesson",description:"Open a lesson for reading. Does not complete the lesson or answer questions.",inputSchema:{type:"object",properties:{lessonId:{type:"string",enum:lessons.map(l=>l.id)}},required:["lessonId"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:async(input:unknown)=>{
      const id=(input as {lessonId?:unknown})?.lessonId;
      if(typeof id!=="string"||!lessons.some(l=>l.id===id)) throw new Error("Unknown lesson ID");
      openLesson(id);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return {openedLessonId:id};
    }},{signal:lifecycle.signal})).catch(()=>{}); } catch {}
    return()=>lifecycle.abort();
  },[]);
  const completed=lessons.filter(l=>entry(l.id).completed);
  const due=completed.filter(l=>entry(l.id).due !== null && entry(l.id).due! <= today);
  const saved=lessons.filter(l=>entry(l.id).saved);
  const current=lessons.find(l=>l.id===progress.last&&!entry(l.id).completed)??lessons.find(l=>!entry(l.id).completed)??lessons[0];
  const lesson=lessons.find(l=>l.id===active);
  function answer(index:number) {
    if(!lesson||quiz===null)return;
    setChoice(index);
    if(index===lesson.questions[quiz].correct){
      setSessionAnswers(s=>Array.from(new Set([...s,quiz])));
      change(lesson.id,e=>completeAnswer(e,quiz));
    }
  }
  function review(remembered:boolean) {
    if(!lesson)return;
    const next=rateReview(entry(lesson.id),remembered);
    change(lesson.id,()=>next);closeLesson();setNotice(`Nice work. “${lesson.title}” returns ${next.due}.`);
  }
  function renderLessonCard(item:Lesson) {
    const e=entry(item.id);const Icon=icons[item.deck];
    return <article key={item.id} className={`lesson-card ${decks[item.deck].color}`}><div className="card-top"><span className="mini-icon"><Icon size={22}/></span><button className={`icon-button ${e.saved?"is-saved":""}`} aria-label={`${e.saved?"Unsave":"Save"} ${item.title}`} aria-pressed={e.saved} onClick={()=>change(item.id,x=>({...x,saved:!x.saved}))}><Bookmark size={19} fill={e.saved?"currentColor":"none"}/></button></div><button className="card-main" data-lesson-id={item.id} onClick={()=>openLesson(item.id,view==="Review")}><span className="eyebrow">{decks[item.deck].title}</span><h3>{item.title}</h3><p>{item.hook}</p><span className="card-bottom"><span><Clock3 size={14}/> 2 min read</span><span className="status">{e.completed?<><Check size={13}/>Practiced</>:e.started?"Learning":"New"}</span><ArrowRight size={18}/></span></button></article>;
  }
  return <div className="app-shell"><header className="topbar"><button className="brand" onClick={()=>navigate("Learn")} aria-label="System Snacks home"><span className="brand-icon"><Layers3 size={23}/></span>system<span className="brand-light">snacks</span><span className="brand-dot">✦</span></button><nav aria-label="Main navigation">{(["Learn","Review","Saved"] as View[]).map((v,i)=>{const Icon=[BookOpen,RotateCcw,Bookmark][i];return <button key={v} className={view===v?"selected":""} aria-current={view===v?"page":undefined} onClick={()=>navigate(v)}><Icon size={17}/>{v}{v==="Review"&&due.length>0&&<span className="nav-count">{due.length}</span>}</button>;})}</nav><span className="device"><Monitor size={15}/> Your little learning space</span></header>
    {warning&&<div role="alert" className="storage-warning">{warning}</div>}
    {!ready?<main className="loading" aria-live="polite">Getting your cards ready…</main>:lesson?<main className={`reader ${decks[lesson.deck].color}`}><div className="reader-toolbar"><button className="text-button" onClick={closeLesson}><ArrowLeft size={17}/> Back to {view.toLowerCase()}</button><button className="text-button" onClick={()=>change(lesson.id,e=>({...e,saved:!e.saved}))} aria-pressed={entry(lesson.id).saved}><Bookmark size={18} fill={entry(lesson.id).saved?"currentColor":"none"}/>{entry(lesson.id).saved?"Saved":"Save lesson"}</button></div>
      <article className="reading-card"><div className="reader-label"><span className="pill">{decks[lesson.deck].title}</span><span><Clock3 size={14}/> {mode==="review"?"Recall first":"2 min read · practice after"}</span></div><h1 ref={heading} tabIndex={-1}>{lesson.title}</h1>
      {mode==="review"?<><p className="reader-hook">{lesson.recall}</p><p>Try saying the answer in your own words before turning the card.</p>{!revealed?<button className="primary" onClick={()=>setRevealed(true)}>Reveal the idea <Sparkles size={17}/></button>:<div className="reveal"><div className="takeaway"><Lightbulb/><p>{lesson.takeaway}</p></div><Diagram lesson={lesson}/><p>{lesson.idea}</p><div className="review-actions"><button className="secondary" onClick={()=>review(false)}>Again <small>Tomorrow</small></button><button className="primary" onClick={()=>review(true)}>Remembered <small>In {[3,7,14][Math.min(entry(lesson.id).stage,2)]} days</small></button></div><button className="text-button" onClick={()=>{setMode("lesson");setQuiz(null);}}>Read the full lesson <ArrowRight size={16}/></button></div>}</>:celebrate?<div className="celebration"><span className="celebration-icon"><Sparkles size={42}/></span><h2>That’s a keeper.</h2><p>Two ideas tested. One concept closer to clicking.</p><div className="takeaway"><Lightbulb/><p>{lesson.takeaway}</p></div><p className="muted">Saved to your progress. Next review: {entry(lesson.id).due}.</p><button className="primary" onClick={closeLesson}>Back to your collection <ArrowRight size={18}/></button></div>:quiz!==null?<section className="quiz"><div className="quiz-progress"><span className={quiz===0?"active":"done"}/><span className={quiz===1?"active":""}/></div><span className="eyebrow">{quiz===0?"01 / RECALL":"02 / PUT IT TO WORK"}</span><h2>{lesson.questions[quiz].prompt}</h2><p className="muted">No scores, no pressure. Thinking is the practice.</p><div className="answers">{lesson.questions[quiz].options.map((option,i)=><button key={option} className={`answer ${choice===i?(i===lesson.questions[quiz].correct?"correct":"incorrect"):""}`} onClick={()=>answer(i)} disabled={choice===lesson.questions[quiz].correct}><span>{String.fromCharCode(65+i)}</span>{option}{choice===i&&i===lesson.questions[quiz].correct&&<Check size={20}/>}</button>)}</div>{choice!==null&&<div className={`feedback ${choice===lesson.questions[quiz].correct?"success":""}`} role="status"><strong>{choice===lesson.questions[quiz].correct?"You’ve got it!":"A useful wrong turn."}</strong><p>{lesson.questions[quiz].explanations[choice]}</p>{choice!==lesson.questions[quiz].correct&&<span>Give it another try.</span>}</div>}{choice===lesson.questions[quiz].correct&&<button className="primary" onClick={()=>{if(quiz===0){setQuiz(1);setChoice(null);}else if(sessionAnswers.includes(0)&&sessionAnswers.includes(1)){setCelebrate(true);}}}>{quiz===0?"Try a real situation":"Add to my progress"}<ArrowRight size={17}/></button>}<button className="text-button" onClick={()=>{setQuiz(null);setChoice(null);}}>Back to the lesson</button></section>:<><p className="reader-hook">{lesson.hook}</p><p>{lesson.idea}</p><aside className="analogy"><span className="eyebrow">☕ THINK OF IT LIKE THIS</span><p>{lesson.analogy}</p></aside><Diagram lesson={lesson}/><h2>In the real world</h2><p>{lesson.example}</p><h2>The tradeoff</h2><p>{lesson.tradeoff}</p><div className="takeaway"><Lightbulb size={23}/><div><span className="eyebrow">POCKET THIS IDEA</span><p>{lesson.takeaway}</p></div></div><div className="practice-start"><div><strong>Let’s make it stick.</strong><p>One quick recall. One real-world decision.</p></div><button className="primary" onClick={()=>{setQuiz(0);setChoice(null);setSessionAnswers([]);}}>Try it out <ArrowRight size={18}/></button></div></>}
      </article></main>:<main className="dashboard"><div className="page-heading"><div><span className="eyebrow greeting"><span/> A LITTLE LEARNING GOES A LONG WAY</span><h1>{view==="Learn"?<>Small bites.<br className="mobile-break"/> <span>Big systems.</span></>:view==="Review"?<>Make it <span>stick.</span></>:<>Your pocket <span>collection.</span></>}</h1><p>{view==="Learn"?"Two-minute reads. Tiny challenges. Ideas that stay with you.":view==="Review"?"A little recall today. A clearer mental model tomorrow.":"The ideas you want to keep close. Revisit them anytime."}</p></div><div className="progress-medallion"><span className="progress-ring" style={{"--progress":`${completed.length/lessons.length*100}%`} as React.CSSProperties}><Sprout size={27}/></span><div><strong>{completed.length}<span> / {lessons.length}</span></strong><small>snacks practiced</small></div></div></div>
      {notice&&<p role="status" className="notice"><Check size={17}/>{notice}</p>}
      {view==="Learn"&&<><section className="quick-grid" aria-label="Your next steps"><article className="continue-card"><div className="continue-copy"><span className="eyebrow"><span className="small-dot"/> {completed.length===lessons.length?"ALL 24 PRACTICED":progress.last?"CONTINUE LEARNING":"YOUR FIRST BITE"}</span><h2>{current.title}</h2><p>{current.hook}</p><button className="primary" onClick={()=>openLesson(current.id)}>{entry(current.id).started?"Continue lesson":"Let’s dig in"}<ArrowRight size={18}/></button><span className="time-note"><Clock3 size={14}/> 2 min · {decks[current.deck].title}</span></div><div className="hero-art" aria-hidden="true"><div className="orbit-dot dot-a"/><div className="orbit-dot dot-b"/><span className="art-spark">✦</span><div className="art-card back"><Database size={32}/></div><div className="art-card front"><span className="art-code">&lt; / &gt;</span><span className="art-line"/><span className="art-line short"/><span className="art-smile">◡</span></div><span className="art-label">a-ha! moments ahead</span></div></article><article className="review-callout"><span className="review-icon"><RotateCcw size={24}/></span><span className="eyebrow">A LITTLE REFRESH</span><h2>{due.length?`${due.length} snack${due.length===1?"":"s"} to revisit`:"Good ideas deserve a second bite."}</h2><p>{due.length?"Your past self left you something good. Give your memory a little nudge.":"Practice a lesson, and we’ll bring it back when it’s time to remember."}</p><button className="text-button" onClick={()=>navigate("Review")}>{due.length?"Start reviewing":"Visit your review shelf"}<ArrowRight size={17}/></button></article></section>
      <section className="deck-section"><div className="section-heading"><div><span className="eyebrow">YOUR LEARNING MENU</span><h2>Pick a curiosity.</h2></div><span className="muted">6 decks · 24 little lightbulbs</span></div><div className="deck-grid">{decks.map((d,i)=>{const Icon=icons[i];const count=completed.filter(l=>l.deck===i).length;return <button key={d.title} className={`deck ${d.color} ${deck===i?"chosen":""}`} aria-pressed={deck===i} onClick={()=>{setDeck(deck===i?null:i);requestAnimationFrame(()=>document.getElementById("lesson-list")?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"start"}));}}><div className="deck-sticker"><Icon size={31} strokeWidth={1.7}/></div><span className="deck-number">0{i+1}</span><h3>{d.title}</h3><p>{d.subtitle}</p><div className="deck-bottom"><span>{count} / 4 practiced</span><ChevronRight size={17}/></div><div className="deck-meter"><span style={{width:`${count*25}%`}}/></div></button>;})}</div></section></>}
      <section id="lesson-list" className="lesson-section"><div className="section-heading"><div><span className="eyebrow">{view==="Learn"?"ONE CONCEPT AT A TIME":view==="Review"?"YOUR MEMORY SHELF":"BOOKMARKED BY YOU"}</span><h2>{view==="Learn"?(deck===null?"All the good stuff.":decks[deck].title):view==="Review"?(due.length?"Ready for a refresh.":"You’re all caught up."):"Saved for another bite."}</h2></div>{view==="Learn"&&deck!==null?<button className="text-button" onClick={()=>setDeck(null)}>Show all lessons <ArrowRight size={16}/></button>:<span className="muted">{view==="Learn"?"Start anywhere. There’s no wrong order.":view==="Saved"?`${saved.length} saved`:"Recall → reveal → remember"}</span>}</div>
      {view==="Review"&&due.length===0&&completed.length>0&&<p className="empty-note">Nothing is due today. Keep an idea fresh with an extra practice below.</p>}
      <div className="lesson-grid">{(view==="Learn"?lessons.filter(l=>deck===null||l.deck===deck):view==="Saved"?saved:due.length?due:completed).map(renderLessonCard)}</div>
      {((view==="Saved"&&!saved.length)||(view==="Review"&&!completed.length))&&<div className="empty-state">{view==="Saved"?<Bookmark size={34}/>:<Sprout size={38}/>}<h3>{view==="Saved"?"A little room for your favorites.":"Your first idea is waiting."}</h3><p>{view==="Saved"?"Tap the bookmark on any lesson to keep it here.":"Complete a lesson’s two questions and it will return here tomorrow."}</p><button className="primary" onClick={()=>navigate("Learn")}>Explore the snacks <ArrowRight size={17}/></button></div>}</section><div className="gentle-note"><Lightbulb size={20}/><p>You don’t need to learn it all today. Just one idea that clicks.</p></div></main>}
    <footer><span className="footer-brand">system snacks <span>✦</span></span><span><Monitor size={14}/> Progress stays in this browser, on this device.</span><span>Made for your next “oh, I get it.”</span></footer>
  </div>;
}
