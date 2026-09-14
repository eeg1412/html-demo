export class AssetLoader{
  constructor(backend,global,maps,{concurrency=4,keepMaps=2}={}){this.backend=backend;this.global=global;this.maps=maps;this.concurrency=concurrency;this.keepMaps=keepMaps;this.cache=new Map();this.pending=new Map();this.recent=[];}
  get(url){if(!this.cache.has(url))throw new Error('Resource not loaded: '+url);return this.cache.get(url);}
  mapUrls(id){if(!this.maps[id])throw new Error('Unknown map: '+id);return this.maps[id];}
  async one(url){
    if(this.cache.has(url))return this.cache.get(url);
    if(!this.pending.has(url))this.pending.set(url,Promise.resolve().then(()=>this.backend.load(url)).then(value=>{this.cache.set(url,value);return value;}).finally(()=>this.pending.delete(url)));
    return this.pending.get(url);
  }
  async load(urls,progress=()=>{}){
    const unique=[...new Set(urls)];let completed=unique.filter(u=>this.cache.has(u)).length,index=0;
    const missing=unique.filter(u=>!this.cache.has(u)),errors=[];
    const report=()=>progress({completed,total:unique.length,ratio:unique.length?completed/unique.length:1});report();
    const worker=async()=>{while(index<missing.length){const url=missing[index++];try{await this.one(url);completed++;report();}catch(error){errors.push(error);}}};
    await Promise.all(Array.from({length:Math.min(this.concurrency,missing.length)},worker));
    if(errors.length)throw errors[0];
  }
  textures(id){return Object.fromEntries([...this.global,...this.mapUrls(id)].map(url=>[url,this.get(url)]));}
  async startup(id,progress){await this.load([...this.global,...this.mapUrls(id)],progress);return this.textures(id);}
  async map(id,progress){await this.load(this.mapUrls(id),progress);return this.textures(id);}
  async discard(id){
    if(this.recent.includes(id))return;
    const retained=new Set([...this.global,...this.recent.flatMap(n=>this.mapUrls(n))]);
    for(const url of this.mapUrls(id))if(!retained.has(url)&&this.cache.has(url)){await this.backend.unload(url);this.cache.delete(url);}
  }
  async activate(id){
    this.recent=[...this.recent.filter(n=>n!==id),id];
    while(this.recent.length>this.keepMaps){const old=this.recent.shift(),retained=new Set([...this.global,...this.recent.flatMap(n=>this.mapUrls(n))]);
      for(const url of this.mapUrls(old))if(!retained.has(url)&&this.cache.has(url)){await this.backend.unload(url);this.cache.delete(url);}
    }
  }
}
