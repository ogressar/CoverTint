const vm=require('vm'),fs=require('fs'),assert=require('assert');
const code=fs.readFileSync('src/main.js','utf8');
const els=[], marked={removeAttribute(){this.removed=true}};
let settings={}, callback, poll, unsubscribed=false, apiReady=true;
const store={getCurrent:()=>settings,onChange:f=>(callback=f,()=>unsubscribed=true)};
const api={getSettings:name=>{assert.equal(name,'CoverTint');return store},getCurrentTrack:()=>({derivedColors:{average:'#927a55',accent:'#dbb574',waveText:'#e2d4ba',miniPlayer:'#bdab95'}})};
const window={pulsesyncApi:api,addEventListener(){},removeEventListener(){}};
const document={createElement:()=>{const el={textContent:'',sheet:{disabled:false},remove(){this.removed=true}};els.push(el);return el},head:{append(){}},querySelectorAll:q=>q==='[data-ct-button-ink]'?[marked]:[]};
vm.runInNewContext(code,{window,document,console,setInterval:f=>(poll=f,1),clearInterval(){}});
const [palette,badge]=els;
assert(palette.textContent.includes('--ct-bg:'));assert.equal(badge.sheet.disabled,false);
const original=palette.textContent;
function change(v){settings={...settings,...v};callback(settings)}
change({explicitE:{value:false}});assert(badge.sheet.disabled);assert.equal(palette.textContent,original);
change({tintedText:{value:false}});assert(palette.textContent.includes('--ct-text:rgb(235,235,235)'));
change({darker:{value:true},smooth:{value:false}});assert(palette.textContent.includes('transition:none;'));assert(palette.textContent.includes('--ct-panel:rgb(55,46,32)'));
change({adaptive:{value:false}});assert.equal(palette.textContent,'');assert(marked.removed);assert(badge.sheet.disabled);
change({explicitE:{value:true}});assert(!badge.sheet.disabled);assert.equal(palette.textContent,'');
change({adaptive:{value:true}});assert(palette.textContent.includes('--ct-bg:'));
change({adaptive:{value:'false'},darker:{value:null},tintedText:{value:undefined}});assert(palette.textContent.includes('--ct-bg:'));
window.__coverTint.destroy();assert(unsubscribed);assert(palette.removed&&badge.removed);assert(!window.__coverTint);
// An API that arrives later must still attach settings.
window.pulsesyncApi=undefined;vm.runInNewContext(code,{window,document,console,setInterval:f=>(poll=f,2),clearInterval(){}});
settings={explicitE:{value:false},adaptive:{value:false}};window.pulsesyncApi=api;poll();assert(els[3].sheet.disabled);assert.equal(els[2].textContent,'');window.__coverTint.destroy();
const schema=JSON.parse(fs.readFileSync('addon/handleEvents.json'));assert.equal(schema.sections[0].items.length,5);
console.log('PASS: live settings, E toggle, palette restoration, neutral text, dimming, transitions and cleanup');
