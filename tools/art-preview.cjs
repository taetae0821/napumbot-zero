const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const sharp=require(process.env.NAPUM_SHARP||'sharp');
const out=path.resolve(process.argv[2]||path.join(root,'../tmp/napumbot-review'));
fs.mkdirSync(out,{recursive:true});
const c=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'src/art.js'),'utf8')+'\nglobalThis.art={sceneArt,medal};',c);
const list=[[0,'r1_s1_0'],[0,'normal'],[1,'r2_s3_0'],[1,'r2_s4_0'],[2,'r3_s2_0'],[2,'r3_s4_0']];
(async()=>{const composites=[];for(let i=0;i<list.length;i++){const [r,k]=list[i];const svg=c.art.sceneArt(r,k).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ').replace('>', '><style>.art-label{font-family:Malgun Gothic,sans-serif;fill:#192d42;font-weight:900}</style>');fs.writeFileSync(path.join(out,k+'.svg'),svg);const png=await sharp(Buffer.from(svg)).png().toBuffer();composites.push({input:png,left:(i%2)*730,top:Math.floor(i/2)*450});}await sharp({create:{width:1450,height:1340,channels:4,background:'#ffffff'}}).composite(composites).png().toFile(path.join(out,'scenes.png'));console.log(path.join(out,'scenes.png'));})();
