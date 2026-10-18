/* QuizSift - scored quiz builder + player. No build step, no dependencies. */
(function(){
"use strict";

/* ---------- encode / decode ---------- */
function encodeQuiz(q){
  var json = JSON.stringify(q);
  var b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function decodeQuiz(s){
  var b64 = s.replace(/-/g,"+").replace(/_/g,"/");
  while(b64.length % 4) b64 += "=";
  var json = decodeURIComponent(escape(atob(b64)));
  return JSON.parse(json);
}

/* ---------- templates ---------- */
var TEMPLATES = {
  leadqual: {
    v:1,
    title:"Is your project a fit? Lead qualification scorecard",
    desc:"Answer 5 quick questions and get an instant fit score.",
    questions:[
      {q:"What best describes your role?",opts:[
        {t:"Founder / owner",p:3},{t:"Marketing or sales lead",p:2},{t:"Agency / consultant",p:2},{t:"Just researching",p:0}]},
      {q:"How big is your team?",opts:[
        {t:"1-10",p:1},{t:"11-50",p:2},{t:"51-200",p:3},{t:"200+",p:3}]},
      {q:"Do you have budget set aside for this?",opts:[
        {t:"Yes, approved",p:4},{t:"Roughly, needs sign-off",p:2},{t:"No budget yet",p:0}]},
      {q:"When do you want to start?",opts:[
        {t:"This month",p:4},{t:"This quarter",p:3},{t:"Later this year",p:1},{t:"No timeline",p:0}]},
      {q:"How are you solving this today?",opts:[
        {t:"Nothing in place",p:2},{t:"Manual workaround",p:3},{t:"Paying for a tool that disappoints",p:4},{t:"Happy with current setup",p:0}]}
    ],
    outcomes:[
      {min:0,max:6,title:"Early stage",desc:"You are still exploring. Save these resources and come back when your timeline firms up.",cta:null},
      {min:7,max:12,title:"Worth a conversation",desc:"You have a real need taking shape. A short call would help scope it.",cta:{label:"Book a discovery call",url:""}},
      {min:13,max:20,title:"Strong fit - act now",desc:"Budget, timeline and pain all line up. You will get value from a conversation this week.",cta:{label:"Book a call this week",url:""}}
    ],
    lead:{on:false,endpoint:"",askmsg:true}
  },
  productrec: {
    v:1,
    title:"Which plan fits you? Product recommendation quiz",
    desc:"Four questions, one clear recommendation.",
    questions:[
      {q:"How many people will use it?",opts:[
        {t:"Just me",p:1},{t:"2-10",p:2},{t:"11-50",p:3},{t:"50+",p:4}]},
      {q:"What matters most?",opts:[
        {t:"Lowest cost",p:1},{t:"Ease of use",p:2},{t:"Integrations",p:3},{t:"Support and security",p:4}]},
      {q:"How technical is your team?",opts:[
        {t:"Not technical",p:1},{t:"Comfortable with tools",p:2},{t:"Developers on staff",p:4}]},
      {q:"Expected monthly usage?",opts:[
        {t:"Occasional",p:1},{t:"Weekly",p:2},{t:"Daily",p:3},{t:"Business-critical",p:4}]}
    ],
    outcomes:[
      {min:4,max:6,title:"Starter",desc:"The Starter plan covers light, individual use without paying for seats you do not need.",cta:{label:"See Starter",url:""}},
      {min:7,max:11,title:"Growth",desc:"The Growth plan fits small teams that live in the tool every week.",cta:{label:"See Growth",url:""}},
      {min:12,max:16,title:"Scale",desc:"Your usage and support needs point to the Scale plan with priority support.",cta:{label:"See Scale",url:""}}
    ],
    lead:{on:false,endpoint:"",askmsg:true}
  },
  webaudit: {
    v:1,
    title:"Website conversion self-audit",
    desc:"Score your site against 6 conversion basics.",
    questions:[
      {q:"Does your homepage say who it is for within 5 seconds?",opts:[
        {t:"Yes, clearly",p:3},{t:"Sort of",p:1},{t:"No",p:0}]},
      {q:"Is there one primary call to action per page?",opts:[
        {t:"Yes",p:3},{t:"Several competing ones",p:1},{t:"No clear CTA",p:0}]},
      {q:"Do you show proof (reviews, results, logos)?",opts:[
        {t:"Yes, near the top",p:3},{t:"Buried somewhere",p:1},{t:"None yet",p:0}]},
      {q:"Does the site load in under 3 seconds on mobile?",opts:[
        {t:"Yes",p:3},{t:"Not sure",p:1},{t:"No",p:0}]},
      {q:"Can a visitor contact you or buy in 2 clicks or fewer?",opts:[
        {t:"Yes",p:3},{t:"3-4 clicks",p:1},{t:"More",p:0}]},
      {q:"Do you know your top traffic source last month?",opts:[
        {t:"Yes, exactly",p:3},{t:"Roughly",p:1},{t:"No idea",p:0}]}
    ],
    outcomes:[
      {min:0,max:6,title:"Leaking visitors",desc:"Several basics are missing. Fix the headline, one CTA, and page speed first - they compound.",cta:null},
      {min:7,max:12,title:"Foundation is there",desc:"The bones are good. Tighten proof placement and measurement to lift conversions.",cta:null},
      {min:13,max:18,title:"Strong setup",desc:"You cover the basics. Now test headlines and offers systematically.",cta:null}
    ],
    lead:{on:false,endpoint:"",askmsg:true}
  },
  coursefit: {
    v:1,
    title:"Is this course right for you?",
    desc:"Answer 5 questions and see whether this course matches where you are right now.",
    questions:[
      {q:"How much experience do you already have with this topic?",opts:[
        {t:"None - starting from zero",p:1},{t:"Some basics",p:2},{t:"Working knowledge",p:3},{t:"Advanced",p:4}]},
      {q:"How many hours a week can you give it?",opts:[
        {t:"Under 1 hour",p:0},{t:"1-3 hours",p:2},{t:"3-5 hours",p:3},{t:"5+ hours",p:4}]},
      {q:"How clear is your goal?",opts:[
        {t:"Still figuring it out",p:1},{t:"General direction",p:2},{t:"Specific outcome in mind",p:4}]},
      {q:"How do you learn best?",opts:[
        {t:"Watching and following along",p:3},{t:"Reading at my own pace",p:3},{t:"Doing projects",p:3},{t:"I struggle to finish self-paced material",p:1}]},
      {q:"Have you finished an online course before?",opts:[
        {t:"Yes, several",p:4},{t:"One or two",p:3},{t:"Started but never finished",p:1},{t:"Never tried",p:2}]}
    ],
    outcomes:[
      {min:0,max:7,title:"Not the right moment",desc:"You would likely get more from free intro material first. Come back when your weekly time and goal are clearer.",cta:null},
      {min:8,max:12,title:"A good fit with one caveat",desc:"You have the background and goal. Block weekly time on your calendar before you enroll - that is the part most people skip.",cta:{label:"See the course outline",url:""}},
      {min:13,max:19,title:"Strong fit",desc:"Your experience, time and goal all line up. You are exactly who gets the most out of this course.",cta:{label:"Enroll now",url:""}}
    ],
    lead:{on:false,endpoint:"",askmsg:true}
  },
  servicepick: {
    v:1,
    title:"Which service package fits your business?",
    desc:"Five questions, one honest recommendation - no sales call required.",
    questions:[
      {q:"Where is your business right now?",opts:[
        {t:"Just starting out",p:1},{t:"Steady but small",p:2},{t:"Growing fast",p:3},{t:"Established, optimizing",p:4}]},
      {q:"What is your biggest bottleneck?",opts:[
        {t:"Getting found",p:2},{t:"Converting interest into sales",p:3},{t:"Delivering on time",p:3},{t:"Keeping customers",p:4}]},
      {q:"How much can you invest monthly?",opts:[
        {t:"Very little right now",p:1},{t:"A modest budget",p:2},{t:"A real budget",p:3},{t:"Whatever moves the needle",p:4}]},
      {q:"How do you like to work with outside help?",opts:[
        {t:"Teach me and I will do it",p:1},{t:"Do it with me",p:2},{t:"Do it for me",p:4}]},
      {q:"How soon do you need results?",opts:[
        {t:"No rush, building steadily",p:1},{t:"This quarter",p:3},{t:"Yesterday",p:4}]}
    ],
    outcomes:[
      {min:0,max:7,title:"Essentials",desc:"Start with the Essentials package: a focused setup and a playbook you can run yourself while budget is tight.",cta:{label:"See Essentials",url:""}},
      {min:8,max:13,title:"Growth",desc:"The Growth package pairs you with hands-on help on your biggest bottleneck, without committing to a full retainer.",cta:{label:"See Growth",url:""}},
      {min:14,max:19,title:"Partner",desc:"You are ready for the Partner package: a dedicated team running the work end to end while you steer.",cta:{label:"Book an intro call",url:""}}
    ],
    lead:{on:false,endpoint:"",askmsg:true}
  },
  onboardfirst: {
    v:1,
    title:"What should you set up first in your business?",
    desc:"Six questions that turn a messy launch list into one clear first step.",
    questions:[
      {q:"How do new customers find you today?",opts:[
        {t:"They do not yet",p:0},{t:"Word of mouth only",p:2},{t:"One channel that works",p:3},{t:"Several channels",p:4}]},
      {q:"When someone is interested, what happens next?",opts:[
        {t:"I hope they message me",p:0},{t:"They email or DM me",p:2},{t:"A form captures their details",p:3},{t:"An automated flow follows up",p:4}]},
      {q:"How do you track your work and tasks?",opts:[
        {t:"In my head",p:0},{t:"Scattered notes",p:1},{t:"One to-do system",p:3},{t:"A system my whole team uses",p:4}]},
      {q:"How do you get paid?",opts:[
        {t:"I have not charged anyone yet",p:0},{t:"Manual invoices or transfers",p:2},{t:"Payment links",p:3},{t:"Automated billing",p:4}]},
      {q:"How do customers get help after buying?",opts:[
        {t:"They cannot easily",p:0},{t:"They message me directly",p:2},{t:"A shared inbox",p:3},{t:"A help desk with tracked tickets",p:4}]},
      {q:"Do you know your numbers from last month?",opts:[
        {t:"No idea",p:0},{t:"Rough sense",p:1},{t:"I track the basics",p:3},{t:"A dashboard I check weekly",p:4}]}
    ],
    outcomes:[
      {min:0,max:7,title:"Start with being findable",desc:"Nothing else matters until strangers can find you and tell you they are interested. Set up one channel and one way to capture enquiries this week.",cta:null},
      {min:8,max:15,title:"Fix the follow-through",desc:"People find you, but work slips. Put a single task system and a payment link in place before adding anything new.",cta:null},
      {min:16,max:24,title:"Systemize what works",desc:"Your basics run. Now automate follow-up and start tracking a few weekly numbers so growth does not depend on memory.",cta:null}
    ],
    lead:{on:false,endpoint:"",askmsg:true}
  },
  contentprefs: {
    v:1,
    title:"What should we actually send you?",
    desc:"Four questions so you only get the emails you will open.",
    questions:[
      {q:"What do you want more of?",opts:[
        {t:"Practical how-tos",p:2},{t:"Industry news in plain language",p:2},{t:"Case studies and results",p:3},{t:"Offers and product updates",p:1}]},
      {q:"How often is welcome?",opts:[
        {t:"Monthly is plenty",p:1},{t:"Every two weeks",p:2},{t:"Weekly",p:3},{t:"Whenever it is good",p:3}]},
      {q:"How deep should it go?",opts:[
        {t:"Quick tips I can use in minutes",p:1},{t:"A solid read with examples",p:2},{t:"Deep dives with data",p:3}]},
      {q:"How experienced are you with this topic?",opts:[
        {t:"Beginner",p:1},{t:"Intermediate",p:2},{t:"Advanced",p:3}]}
    ],
    outcomes:[
      {min:4,max:6,title:"The occasional digest",desc:"You will get a short monthly roundup - the highlights, nothing else.",cta:null},
      {min:7,max:9,title:"The practical weekly",desc:"Expect one useful, example-led email a week. Skimmable in three minutes.",cta:null},
      {min:10,max:12,title:"The deep diver",desc:"You will get the full breakdowns - data, examples and templates - as they are published.",cta:null}
    ],
    lead:{on:false,endpoint:"",askmsg:true}
  }
};

var TEMPLATE_LABELS = {leadqual:"Lead qualification",productrec:"Product recommendation",webaudit:"Website audit",coursefit:"Course fit",servicepick:"Service package picker",onboardfirst:"First setup priorities",contentprefs:"Subscriber preferences"};

/* ---------- utils ---------- */
function el(id){return document.getElementById(id);}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function toast(msg){
  var t=document.createElement("div");t.className="toast";t.textContent=msg;
  document.body.appendChild(t);setTimeout(function(){t.remove();},2400);
}
function copyText(txt,ok){
  function done(){toast(ok||"Copied");}
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(done,function(){fallback();});
  } else fallback();
  function fallback(){
    var ta=document.createElement("textarea");ta.value=txt;document.body.appendChild(ta);
    ta.select();try{document.execCommand("copy");done();}catch(e){toast("Copy failed - select the link manually");}
    ta.remove();
  }
}
function shareUrlFor(quiz){
  var base = location.origin + location.pathname.replace(/[^/]*$/,"");
  return base + "index.html#/q/" + encodeQuiz(quiz);
}

function sanitizeQuiz(q){
  if(!q||typeof q!=="object")return null;
  if(!Array.isArray(q.questions)||!q.questions.length)return null;
  if(!Array.isArray(q.outcomes)||!q.outcomes.length)return null;
  var out={v:1,title:String(q.title||"").slice(0,120),desc:String(q.desc||"").slice(0,400),questions:[],outcomes:[],lead:{on:false,endpoint:"",askmsg:true}};
  for(var i=0;i<q.questions.length&&i<40;i++){
    var qq=q.questions[i];if(!qq||!Array.isArray(qq.opts))return null;
    var nq={q:String(qq.q||"").slice(0,200),opts:[]};
    for(var j=0;j<qq.opts.length&&j<6;j++){
      var o=qq.opts[j];if(!o)continue;
      nq.opts.push({t:String(o.t||"").slice(0,120),p:Math.max(-20,Math.min(20,parseInt(o.p,10)||0))});
    }
    if(nq.opts.length<2)return null;
    out.questions.push(nq);
  }
  for(var k=0;k<q.outcomes.length&&k<12;k++){
    var oo=q.outcomes[k];if(!oo)return null;
    var no={min:parseInt(oo.min,10)||0,max:parseInt(oo.max,10)||0,title:String(oo.title||"").slice(0,100),desc:String(oo.desc||"").slice(0,400),cta:null};
    if(oo.cta&&oo.cta.url&&/^https:\/\//.test(oo.cta.url))no.cta={label:String(oo.cta.label||"Next step").slice(0,40),url:String(oo.cta.url).slice(0,500)};
    out.outcomes.push(no);
  }
  if(q.lead&&q.lead.on&&/^https:\/\/.+/.test(String(q.lead.endpoint||""))){
    out.lead={on:true,endpoint:String(q.lead.endpoint).slice(0,500),askmsg:q.lead.askmsg!==false};
  }
  return out;
}
function importQuiz(src){
  src=String(src||"").trim();
  if(!src)return {err:"Paste a share link or quiz JSON first."};
  var q=null;
  var m=src.match(/#\/q\/([A-Za-z0-9_-]+)/);
  try{
    if(src.charAt(0)==="{"){q=JSON.parse(src);}
    else if(m){q=decodeQuiz(m[1]);}
    else if(/^[A-Za-z0-9_-]+$/.test(src)&&src.length>20){q=decodeQuiz(src);}
    else return {err:"That does not look like a QuizSift share link or quiz JSON."};
  }catch(e){return {err:"Could not read that quiz - check it is complete and try again."};}
  var clean=sanitizeQuiz(q);
  if(!clean)return {err:"That data is not a valid QuizSift quiz."};
  return {quiz:clean};
}

/* ---------- builder state ---------- */
var draft = null;
function blankQuiz(){
  return {v:1,title:"",desc:"",questions:[newQuestion()],outcomes:[
    {min:0,max:0,title:"",desc:"",cta:null}
  ],lead:{on:false,endpoint:"",askmsg:true}};
}
function newQuestion(){return {q:"",opts:[{t:"",p:1},{t:"",p:0}]};}

function renderBuilder(root){
  if(!draft) draft = blankQuiz();
  var h = '';
  h += '<div class="wrap" style="padding-top:28px">';
  h += '<h1 style="font-size:30px;margin:0 0 4px">Build your scored quiz</h1>';
  h += '<p class="muted">Everything runs in your browser. Your quiz is stored inside its share link - there is no account and no database on our side.</p>';
  h += '<div class="card"><h3 style="margin-top:0">Start from a template</h3><div class="row">';
  Object.keys(TEMPLATE_LABELS).forEach(function(k){ h += '<button class="btn ghost small" data-tpl="'+k+'">'+TEMPLATE_LABELS[k]+'</button>'; });
  h += '</div></div>';

  h += '<div class="card"><h3 style="margin-top:0">Import / export</h3>';
  h += '<p class="muted" style="font-size:13px;margin-top:0">Keep a backup or move a quiz between browsers. Export is the same data that lives inside a share link.</p>';
  h += '<div class="row"><button class="btn ghost small" id="exp-copy">Copy quiz JSON</button>';
  h += '<button class="btn ghost small" id="exp-dl">Download .json</button></div>';
  h += '<label style="margin-top:12px">Paste a QuizSift share link or quiz JSON to load it back into the builder</label>';
  h += '<textarea id="imp-src" style="min-height:70px" placeholder="https://...index.html#/q/eyJ...  or  {\"v\":1,...}"></textarea>';
  h += '<div class="row"><button class="btn ghost small" id="imp-btn">Load into builder</button></div>';
  h += '<div id="imp-err"></div></div>';

  h += '<div class="card"><h3 style="margin-top:0">Basics</h3>';
  h += '<label>Quiz title</label><input type="text" id="f-title" maxlength="120" placeholder="e.g. Is your business ready for a CRM?" value="'+esc(draft.title)+'">';
  h += '<label>Intro shown before the first question</label><textarea id="f-desc" maxlength="400" placeholder="One or two sentences on what the taker gets.">'+esc(draft.desc)+'</textarea>';
  h += '</div>';

  h += '<div class="card"><h3 style="margin-top:0">Questions</h3><div id="q-list"></div>';
  h += '<button class="btn ghost small" id="add-q">+ Add question</button></div>';

  h += '<div class="card"><h3 style="margin-top:0">Outcomes by score</h3>';
  h += '<p class="muted" style="font-size:13px;margin-top:0">Each taker sees the outcome whose range contains their total score. Ranges may not overlap.</p>';
  h += '<div id="o-list"></div>';
  h += '<button class="btn ghost small" id="add-o">+ Add outcome</button></div>';

  h += '<div class="card"><h3 style="margin-top:0">Lead capture (optional)</h3>';
  h += '<label class="row" style="align-items:flex-start;gap:10px"><input type="checkbox" id="f-leadon" style="width:auto;flex:none;margin-top:4px"'+(draft.lead.on?" checked":"")+'> <span style="flex:1">Ask takers for their name and email before showing the result</span></label>';
  h += '<div id="lead-fields"'+(draft.lead.on?"":' class="hidden"')+'>';
  h += '<label>Your form endpoint URL</label>';
  h += '<input type="url" id="f-endpoint" placeholder="https://formspree.io/f/your-id" value="'+esc(draft.lead.endpoint)+'">';
  h += '<p class="muted" style="font-size:13px">Submissions go <b>directly from the taker\'s browser to this endpoint</b>. Create a free form with a form service you trust (for example Formspree, Tally, or Web3Forms), paste its endpoint here, and the leads land in your account there. QuizSift never receives or stores them.</p>';
  h += '</div></div>';

  h += '<div class="card"><h3 style="margin-top:0">Publish</h3>';
  h += '<div id="pub-errors"></div>';
  h += '<div class="row"><button class="btn" id="publish">Generate share link</button>';
  h += '<button class="btn ghost" id="preview">Preview</button></div>';
  h += '<div id="pub-out"></div>';
  h += '</div>';
  h += '<p class="muted" style="font-size:13px">Note: anyone with the share link can view the quiz content. Do not put secrets in questions.</p>';
  h += '</div>';
  root.innerHTML = h;

  root.querySelectorAll("[data-tpl]").forEach(function(b){
    b.addEventListener("click",function(){
      draft = JSON.parse(JSON.stringify(TEMPLATES[b.getAttribute("data-tpl")]));
      renderBuilder(root);
      toast("Template loaded - edit it, then publish");
    });
  });
  el("f-title").addEventListener("input",function(){draft.title=this.value;});
  el("f-desc").addEventListener("input",function(){draft.desc=this.value;});
  el("f-leadon").addEventListener("change",function(){
    draft.lead.on=this.checked;
    el("lead-fields").classList.toggle("hidden",!this.checked);
  });
  el("f-endpoint").addEventListener("input",function(){draft.lead.endpoint=this.value.trim();});
  el("exp-copy").addEventListener("click",function(){copyText(JSON.stringify(draft,null,2),"Quiz JSON copied");});
  el("exp-dl").addEventListener("click",function(){
    var blob=new Blob([JSON.stringify(draft,null,2)],{type:"application/json"});
    var a=document.createElement("a");a.href=URL.createObjectURL(blob);
    a.download=(String(draft.title||"quizsift-quiz").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"quiz")+".json";
    document.body.appendChild(a);a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);
  });
  el("imp-btn").addEventListener("click",function(){
    var r=importQuiz(el("imp-src").value);
    if(r.err){el("imp-err").innerHTML='<div class="notice">'+esc(r.err)+'</div>';return;}
    draft=r.quiz;renderBuilder(root);toast("Quiz loaded into the builder");
  });
  el("add-q").addEventListener("click",function(){draft.questions.push(newQuestion());drawQuestions();});
  el("add-o").addEventListener("click",function(){draft.outcomes.push({min:0,max:0,title:"",desc:"",cta:null});drawOutcomes();});
  el("publish").addEventListener("click",function(){publish(root);});
  el("preview").addEventListener("click",function(){
    var errs = validate();
    if(errs.length){showErrors(errs);return;}
    location.hash = "#/q/" + encodeQuiz(draft) + "?preview=1";
  });
  drawQuestions(); drawOutcomes();
}

function drawQuestions(){
  var box = el("q-list"); box.innerHTML="";
  draft.questions.forEach(function(qq,qi){
    var d = document.createElement("div"); d.className="qblock";
    var h = '<div class="row"><b style="flex:none">Q'+(qi+1)+'</b><input type="text" data-k="q" maxlength="200" placeholder="Question text" value="'+esc(qq.q)+'">';
    if(draft.questions.length>1) h+='<button class="iconbtn" data-del-q style="flex:none">Remove</button>';
    h+='</div><div data-opts></div>';
    h+='<button class="iconbtn" data-add-opt>+ Add option</button>';
    d.innerHTML=h;
    d.querySelector("[data-k=q]").addEventListener("input",function(){qq.q=this.value;});
    var del=d.querySelector("[data-del-q]");
    if(del) del.addEventListener("click",function(){draft.questions.splice(qi,1);drawQuestions();});
    d.querySelector("[data-add-opt]").addEventListener("click",function(){
      if(qq.opts.length>=6){toast("6 options max");return;}
      qq.opts.push({t:"",p:0});drawQuestions();
    });
    var obox=d.querySelector("[data-opts]");
    qq.opts.forEach(function(o,oi){
      var r=document.createElement("div");r.className="optrow";
      r.innerHTML='<input type="text" maxlength="120" placeholder="Option '+(oi+1)+'" value="'+esc(o.t)+'"><input type="number" min="-20" max="20" step="1" title="Points" value="'+o.p+'">'+(qq.opts.length>2?'<button class="iconbtn">x</button>':'');
      var inp=r.children[0], pts=r.children[1], x=r.children[2];
      inp.addEventListener("input",function(){o.t=this.value;});
      pts.addEventListener("input",function(){o.p=parseInt(this.value||"0",10)||0;});
      if(x) x.addEventListener("click",function(){qq.opts.splice(oi,1);drawQuestions();});
      obox.appendChild(r);
    });
    box.appendChild(d);
  });
}

function drawOutcomes(){
  var box = el("o-list"); box.innerHTML="";
  draft.outcomes.forEach(function(o,oi){
    var d=document.createElement("div");d.className="qblock";
    var h='<div class="row"><label style="flex:none;margin:0">Score</label>';
    h+='<input type="number" style="width:80px;flex:none" data-k="min" value="'+o.min+'"><span style="flex:none">to</span>';
    h+='<input type="number" style="width:80px;flex:none" data-k="max" value="'+o.max+'">';
    if(draft.outcomes.length>1)h+='<button class="iconbtn" data-del style="flex:none">Remove</button>';
    h+='</div>';
    h+='<label>Outcome title</label><input type="text" data-k="title" maxlength="100" placeholder="e.g. Strong fit" value="'+esc(o.title)+'">';
    h+='<label>What the taker reads</label><textarea data-k="desc" maxlength="400" placeholder="Short, useful verdict.">'+esc(o.desc)+'</textarea>';
    h+='<label>Button link (optional)</label><div class="row"><input type="text" data-k="ctal" maxlength="40" placeholder="Button label" value="'+esc(o.cta?o.cta.label:"")+'"><input type="url" data-k="ctau" placeholder="https://..." value="'+esc(o.cta?o.cta.url:"")+'"></div>';
    d.innerHTML=h;
    d.querySelector("[data-k=min]").addEventListener("input",function(){o.min=parseInt(this.value||"0",10)||0;});
    d.querySelector("[data-k=max]").addEventListener("input",function(){o.max=parseInt(this.value||"0",10)||0;});
    d.querySelector("[data-k=title]").addEventListener("input",function(){o.title=this.value;});
    d.querySelector("[data-k=desc]").addEventListener("input",function(){o.desc=this.value;});
    d.querySelector("[data-k=ctal]").addEventListener("input",function(){syncCta(o);});
    d.querySelector("[data-k=ctau]").addEventListener("input",function(){syncCta(o);});
    function syncCta(o){
      var l=d.querySelector("[data-k=ctal]").value.trim(), u=d.querySelector("[data-k=ctau]").value.trim();
      o.cta = (l&&u)?{label:l,url:u}:null;
    }
    var del=d.querySelector("[data-del]");
    if(del)del.addEventListener("click",function(){draft.outcomes.splice(oi,1);drawOutcomes();});
    box.appendChild(d);
  });
}

function validate(){
  var e=[];
  if(!draft.title.trim())e.push("Add a quiz title.");
  draft.questions.forEach(function(q,i){
    if(!q.q.trim())e.push("Question "+(i+1)+" is empty.");
    var filled=q.opts.filter(function(o){return o.t.trim();});
    if(filled.length<2)e.push("Question "+(i+1)+" needs at least 2 answer options.");
  });
  var ranges=draft.outcomes.slice().sort(function(a,b){return a.min-b.min;});
  ranges.forEach(function(o,i){
    if(!o.title.trim())e.push("Outcome "+(i+1)+" needs a title.");
    if(o.max<o.min)e.push("Outcome \""+(o.title||i+1)+"\" has max below min.");
    if(i>0&&o.min<=ranges[i-1].max)e.push("Outcome ranges overlap (\""+ranges[i-1].title+"\" and \""+o.title+"\").");
  });
  if(draft.lead.on){
    if(!/^https:\/\/.+/.test(draft.lead.endpoint))e.push("Lead capture is on - paste your https form endpoint URL.");
  }
  return e;
}
function showErrors(errs){
  el("pub-errors").innerHTML='<div class="notice">'+errs.map(esc).join("<br>")+'</div>';
  el("pub-errors").scrollIntoView({behavior:"smooth",block:"center"});
}
function publish(root){
  var errs=validate();
  if(errs.length){showErrors(errs);return;}
  el("pub-errors").innerHTML="";
  var url=shareUrlFor(draft);
  var h='<div class="notice ok">Your quiz is live at its link. Share it anywhere.</div>';
  h+='<div class="row" style="margin-top:10px"><input type="text" readonly value="'+esc(url)+'" id="share-url" style="font-size:13px"><button class="btn small" id="copy-share" style="flex:none">Copy link</button></div>';
  h+='<p class="muted" style="font-size:13px">Link length: '+url.length+' characters. Shorter quizzes make shorter links; very large quizzes (12+ questions) can hit link-length limits in some chat apps.</p>';
  h+='<div class="row"><a class="btn ghost small" href="'+esc(url)+'" target="_blank" rel="noopener">Open quiz</a></div>';
  el("pub-out").innerHTML=h;
  el("copy-share").addEventListener("click",function(){copyText(url,"Link copied");});
  el("pub-out").scrollIntoView({behavior:"smooth",block:"center"});
}

/* ---------- player ---------- */
function renderPlayer(root,quiz,isPreview){
  var answers=[], idx=0, total=0;
  var leadData=null;

  function drawIntro(){
    var h='<div class="wrap" style="max-width:640px;padding-top:44px">';
    h+='<div class="card" style="text-align:center;padding:36px 26px">';
    h+='<h1 style="font-size:28px;margin:0 0 10px">'+esc(quiz.title)+'</h1>';
    if(quiz.desc)h+='<p class="muted">'+esc(quiz.desc)+'</p>';
    h+='<p class="muted" style="font-size:13px">'+quiz.questions.length+' questions - about a minute</p>';
    h+='<button class="btn" id="start">Start</button>';
    h+='</div>'+foot()+'</div>';
    root.innerHTML=h;
    el("start").addEventListener("click",drawQ);
  }
  function drawQ(){
    var q=quiz.questions[idx];
    var h='<div class="wrap" style="max-width:640px;padding-top:36px">';
    h+='<div class="progress"><i style="width:'+Math.round(idx/quiz.questions.length*100)+'%"></i></div>';
    h+='<div class="card"><p class="muted" style="font-size:13px;margin:0">Question '+(idx+1)+' of '+quiz.questions.length+'</p>';
    h+='<h2 style="margin:6px 0 14px;font-size:22px">'+esc(q.q)+'</h2><div id="opts"></div></div>'+foot()+'</div>';
    root.innerHTML=h;
    var ob=el("opts");
    q.opts.forEach(function(o,oi){
      if(!String(o.t).trim())return;
      var b=document.createElement("button");
      b.className="btn ghost";b.style.display="block";b.style.width="100%";b.style.textAlign="left";b.style.margin="8px 0";
      b.textContent=o.t;
      b.addEventListener("click",function(){
        answers.push({q:q.q,a:o.t,p:o.p});
        total+=o.p;
        idx++;
        if(idx<quiz.questions.length)drawQ();
        else if(quiz.lead&&quiz.lead.on)drawLead();
        else drawResult();
      });
      ob.appendChild(b);
    });
  }
  function drawLead(){
    var h='<div class="wrap" style="max-width:640px;padding-top:36px">';
    h+='<div class="card"><h2 style="margin-top:0;font-size:22px">Where should we send your result?</h2>';
    h+='<form id="leadf"><label>Name</label><input type="text" id="ld-name" required maxlength="80">';
    h+='<label>Email</label><input type="email" id="ld-email" required maxlength="120">';
    if(quiz.lead.askmsg)h+='<label>Anything to add? (optional)</label><textarea id="ld-msg" maxlength="500"></textarea>';
    h+='<p class="muted" style="font-size:12px">This goes to the quiz creator\'s own form service, not to QuizSift.</p>';
    h+='<div class="row"><button class="btn" type="submit">See my result</button>';
    h+='<button class="btn ghost small" type="button" id="skip">Skip</button></div></form>';
    h+='<div id="lead-err"></div></div>'+foot()+'</div>';
    root.innerHTML=h;
    el("skip").addEventListener("click",drawResult);
    el("leadf").addEventListener("submit",function(ev){
      ev.preventDefault();
      leadData={name:el("ld-name").value.trim(),email:el("ld-email").value.trim(),message:(el("ld-msg")?el("ld-msg").value.trim():"")};
      submitLead(function(){drawResult();});
    });
  }
  function outcomeFor(score){
    var m=null;
    quiz.outcomes.forEach(function(o){if(score>=o.min&&score<=o.max&&(!m||o.min>=m.min))m=o;});
    if(!m){ // nearest fallback
      quiz.outcomes.forEach(function(o){if(!m||Math.abs(score-o.max)<Math.abs(score-m.max))m=o;});
    }
    return m;
  }
  function submitLead(done){
    var err=el("lead-err");err.innerHTML="";
    var outcome=outcomeFor(total);
    var payload={
      name:leadData.name,email:leadData.email,message:leadData.message,
      quiz:quiz.title,score:total,outcome:outcome?outcome.title:"",
      answers:answers.map(function(a){return a.q+" -> "+a.a;}).join(" | ")
    };
    fetch(quiz.lead.endpoint,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(payload)})
      .then(function(r){done();})
      .catch(function(){done();}); // never block the result on lead delivery
  }
  function drawResult(){
    var outcome=outcomeFor(total);
    var h='<div class="wrap" style="max-width:640px;padding-top:40px">';
    h+='<div class="card" style="text-align:center;padding:34px 24px">';
    h+='<p class="muted" style="margin:0;font-size:13px">Your score</p>';
    h+='<div class="bigscore">'+total+'</div>';
    if(outcome){
      h+='<h2 style="margin:10px 0 6px">'+esc(outcome.title)+'</h2>';
      if(outcome.desc)h+='<p class="muted">'+esc(outcome.desc)+'</p>';
      if(outcome.cta&&outcome.cta.url)h+='<p><a class="btn" href="'+esc(outcome.cta.url)+'" target="_blank" rel="noopener">'+esc(outcome.cta.label||"Next step")+'</a></p>';
    }
    h+='<p style="margin-top:18px"><button class="btn ghost small" id="copyres">Copy my result</button></p>';
    h+='</div>';
    if(isPreview)h+='<div class="notice">Preview mode - <a href="#/builder">back to the builder</a>. Publish to get a share link.</div>';
    h+=foot()+'</div>';
    root.innerHTML=h;
    el("copyres").addEventListener("click",function(){
      var lines=[quiz.title,"Score: "+total+(outcome?" - "+outcome.title:""),""];
      answers.forEach(function(a,i){lines.push("Q"+(i+1)+": "+a.q);lines.push("A: "+a.a);});
      copyText(lines.join("\n"),"Result copied");
    });
  }
  function foot(){
    return '<p class="muted" style="text-align:center;font-size:12px;margin-top:26px">Made with <a href="'+location.pathname.replace(/[^/]*$/,"")+'index.html">QuizSift</a> - build your own scored quiz, free.</p>';
  }
  drawIntro();
}

/* ---------- router ---------- */
function route(){
  var root=el("app");
  var hash=location.hash||"";
  var landing=el("landing");
  if(hash.indexOf("#/builder")===0){
    document.title="Build a scored quiz - QuizSift";
    if(landing)landing.classList.add("hidden");
    root.classList.remove("hidden");
    var im=hash.match(/[?&]import=([A-Za-z0-9_-]+)/);
    if(im){
      var r=importQuiz(im[1]);
      if(!r.err)draft=r.quiz;
      try{history.replaceState(null,"","#/builder");}catch(e){}
    }
    renderBuilder(root);
    return;
  }
  if(hash.indexOf("#/q/")===0){
    if(landing)landing.classList.add("hidden");
    root.classList.remove("hidden");
    var payload=hash.slice(4);
    var isPreview=false;
    var pi=payload.indexOf("?preview=1");
    if(pi>-1){isPreview=true;payload=payload.slice(0,pi);}
    try{
      var quiz=decodeQuiz(payload);
      if(!quiz||!quiz.questions||!quiz.outcomes)throw new Error("bad");
      document.title=quiz.title+" - QuizSift";
      renderPlayer(root,quiz,isPreview);
    }catch(e){
      root.innerHTML='<div class="wrap" style="padding-top:44px"><div class="notice">This quiz link looks broken or truncated. Ask the creator to resend the full link.</div></div>';
    }
    return;
  }
  // landing
  if(landing)landing.classList.remove("hidden");
  root.classList.add("hidden");
}
window.addEventListener("hashchange",route);
document.addEventListener("DOMContentLoaded",route);
})();
