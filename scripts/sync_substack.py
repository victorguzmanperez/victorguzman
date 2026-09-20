"""Public RSS -> review artifact. Never writes approved browser Knowledge."""
import argparse, datetime, hashlib, html, json, os, re, tempfile
import urllib.request, urllib.parse, xml.etree.ElementTree as ET
from pathlib import Path

FEED = 'https://dataversodata.substack.com/feed'
ROOT = Path(__file__).resolve().parents[1]
TOPICS = ('power-bi', 'power-query', 'finance', 'investing', 'learning', 'books')

def plain(value):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]*>', '', html.unescape(value or ''))).strip()

def canonical_url(value):
    url = urllib.parse.urlsplit(value.strip())
    if url.scheme != 'https' or url.netloc != 'dataversodata.substack.com' or not re.fullmatch(r'/p/[a-z0-9-]+/?', url.path):
        raise ValueError('Unapproved article URL')
    return urllib.parse.urlunsplit(('https', url.netloc, url.path.rstrip('/'), '', ''))

def classify(text):
    text = text.lower()
    rules = {'power-bi': r'power bi|modelo de datos', 'power-query':r'power query', 'finance':r'finanza|dinero|rico|millonaria', 'investing':r'inver|apalanc|dividendo|6000', 'learning':r'aprender|aprendiz|cuestionarlo|mentalidad', 'books':r'libro|rico|millonaria'}
    return [topic for topic, pattern in rules.items() if re.search(pattern,text)] or ['learning']

def parse_feed(data):
    if len(data)>5_000_000 or re.search(br'<!DOCTYPE|<!ENTITY',data,re.I):
        raise ValueError('Oversized feed or forbidden XML declaration')
    root = ET.fromstring(data)
    if root.tag!='rss' or root.find('channel') is None:
        raise ValueError('Expected RSS channel')
    articles={}
    for item in root.findall('./channel/item'):
        url=canonical_url(item.findtext('link',''))
        title=plain(item.findtext('title',''))[:180]
        if not title: raise ValueError('Missing title')
        date=item.findtext('pubDate','')
        from email.utils import parsedate_to_datetime
        date=parsedate_to_datetime(date).isoformat()
        description=plain(item.findtext('description',''))[:240]
        article={'id':'article-'+url.rsplit('/',1)[1], 'type':'ARTICLE', 'publicationId':'publication-dataverso', 'title':title, 'url':url, 'publishedAt':date, 'topics':classify(title+' '+description), 'summary':description, 'source':FEED, 'status':'staged'}
        article['contentHash']=hashlib.sha256(json.dumps(article,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
        if url in articles and articles[url]['contentHash']!=article['contentHash']:
            raise ValueError('Conflicting duplicate article')
        articles[url]=article
    if not articles: raise ValueError('Empty feed; existing catalog must be preserved')
    return sorted(articles.values(),key=lambda a:a['id'])

def sync(data, output):
    articles=parse_feed(data)
    approved=json.loads((ROOT/'assets/chatbot/data/content/approved.json').read_text(encoding='utf-8'))
    known={a['id']:a for a in approved['articles']}
    for article in articles:
        old=known.get(article['id'])
        article['change']='new' if old is None else 'unchanged' if old.get('contentHash')==article['contentHash'] else 'updated'
    payload={'schemaVersion':1,'source':FEED,'promotion':'Manual review required. This file is not imported by the chatbot.', 'articles':articles}
    output=Path(output)
    allowed=(ROOT/'content/staged').resolve()
    if output.resolve().parent!=allowed: raise ValueError('Output must stay in content/staged')
    allowed.mkdir(parents=True,exist_ok=True)
    with tempfile.NamedTemporaryFile('w',encoding='utf-8',dir=allowed,delete=False) as f:
        json.dump(payload,f,ensure_ascii=False,indent=2); f.write('\n'); temporary=f.name
    os.replace(temporary,output)
    return payload

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--input',type=Path); args=parser.parse_args()
    if args.input: data=args.input.read_bytes()
    else:
        request=urllib.request.Request(FEED,headers={'User-Agent':'DataversoCatalogReview/1.0'})
        with urllib.request.urlopen(request,timeout=30) as response:
            if response.url!=FEED: raise ValueError('Unexpected feed redirect')
            data=response.read(5_000_001)
    result=sync(data,ROOT/'content/staged/dataverso.json')
    print(f"Validated {len(result['articles'])} staged articles; approved Knowledge unchanged.")
if __name__=='__main__': main()
