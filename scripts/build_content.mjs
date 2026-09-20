import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const dir=new URL('../assets/chatbot/data/content/',import.meta.url);
const catalog=JSON.parse(await fs.readFile(new URL('approved.json',dir),'utf8'));
const ids=new Set();
if(catalog.schemaVersion!==1||catalog.publication.type!=='PUBLICATION'||catalog.publication.id!=='publication-dataverso') throw Error('Invalid publication model');
const topicIds=new Set(catalog.topics.map(t=>{if(t.type!=='ARTICLE_TOPIC')throw Error('Invalid topic');return t.id;}));
for(const a of catalog.articles){
 if(ids.has(a.id)||a.type!=='ARTICLE'||a.status!=='approved'||!a.reviewedAt||!a.reviewBasis||!a.title||!a.summary||!a.contentHash||!/^https:\/\/dataversodata\.substack\.com\/p\/[a-z0-9-]+$/.test(a.url)||!a.topics.length||a.topics.some(t=>!topicIds.has(t))||a.publicationId!==catalog.publication.id)throw Error(`Invalid/unreviewed article ${a.id}`);
 ids.add(a.id);
}
for(const b of catalog.books){if(ids.has(b.id)||b.type!=='BOOK_REFERENCE'||b.status!=='approved'||!catalog.articles.some(a=>a.id===b.articleId&&a.url===b.source)||!/^https:\/\/amzn\.to\/[a-zA-Z0-9]+$/.test(b.url)||!b.affiliate||!b.disclosure?.includes('afiliado'))throw Error(`Invalid book ${b.id}`);ids.add(b.id);}
const output='// Reviewed public metadata. Regenerate only after explicit editorial review.\nexport const catalog = '+JSON.stringify(catalog,null,2)+';\n';
const target=new URL('catalog.js',dir);
if(process.argv.includes('--check')) {if(await fs.readFile(target,'utf8')!==output)throw Error('Catalog drift: rebuild reviewed catalog');}
else await fs.writeFile(target,output);
console.log(`Validated ${catalog.articles.length} articles and ${catalog.books.length} books.`);
