"""Public RSS -> review artifact. Never writes approved browser Knowledge."""
import argparse, datetime, hashlib, html, json, os, re, tempfile
import urllib.request, urllib.parse, xml.etree.ElementTree as ET
from pathlib import Path

FEED = 'https://dataversodata.substack.com/feed'
ROOT = Path(__file__).resolve().parents[1]
TOPICS = ('power-bi', 'power-query', 'finance', 'investing', 'learning', 'books')
STAGED_FIELDS = frozenset({
    'id', 'type', 'publicationId', 'title', 'url', 'publishedAt', 'topics',
    'summary', 'source', 'status', 'contentHash', 'change'
})


def plain(value):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]*>', '', html.unescape(value or ''))).strip()


def canonical_url(value):
    url = urllib.parse.urlsplit(value.strip())
    if url.scheme != 'https' or url.netloc != 'dataversodata.substack.com' or not re.fullmatch(r'/p/[a-z0-9-]+/?', url.path):
        raise ValueError('Unapproved article URL')
    return urllib.parse.urlunsplit(('https', url.netloc, url.path.rstrip('/'), '', ''))


def classify(text):
    text = text.lower()
    rules = {
        'power-bi': r'power bi|modelo de datos',
        'power-query': r'power query',
        'finance': r'finanza|dinero|rico|millonaria',
        'investing': r'inver|apalanc|dividendo|6000',
        'learning': r'aprender|aprendiz|cuestionarlo|mentalidad',
        'books': r'libro|rico|millonaria',
    }
    return [topic for topic, pattern in rules.items() if re.search(pattern, text)] or ['learning']


def article_content_hash(article):
    payload = {
        key: article[key]
        for key in (
            'id', 'type', 'publicationId', 'title', 'url', 'publishedAt',
            'topics', 'summary', 'source', 'status'
        )
    }
    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, ensure_ascii=False).encode()
    ).hexdigest()


def parse_feed(data):
    if len(data) > 5_000_000 or re.search(br'<!DOCTYPE|<!ENTITY', data, re.I):
        raise ValueError('Oversized feed or forbidden XML declaration')
    root = ET.fromstring(data)
    if root.tag != 'rss' or root.find('channel') is None:
        raise ValueError('Expected RSS channel')
    articles = {}
    for item in root.findall('./channel/item'):
        url = canonical_url(item.findtext('link', ''))
        title = plain(item.findtext('title', ''))[:180]
        if not title:
            raise ValueError('Missing title')
        date = item.findtext('pubDate', '')
        from email.utils import parsedate_to_datetime
        date = parsedate_to_datetime(date).isoformat()
        description = plain(item.findtext('description', ''))[:240]
        article = {
            'id': 'article-' + url.rsplit('/', 1)[1],
            'type': 'ARTICLE',
            'publicationId': 'publication-dataverso',
            'title': title,
            'url': url,
            'publishedAt': date,
            'topics': classify(title + ' ' + description),
            'summary': description,
            'source': FEED,
            'status': 'staged',
        }
        article['contentHash'] = article_content_hash(article)
        if url in articles and articles[url]['contentHash'] != article['contentHash']:
            raise ValueError('Conflicting duplicate article')
        articles[url] = article
    if not articles:
        raise ValueError('Empty feed; existing catalog must be preserved')
    return sorted(articles.values(), key=lambda article: article['id'])


def load_approved():
    return json.loads(
        (ROOT / 'assets/chatbot/data/content/approved.json').read_text(encoding='utf-8')
    )


def expected_change(article, approved_by_id):
    previous = approved_by_id.get(article['id'])
    if previous is None:
        return 'new'
    return 'unchanged' if previous.get('contentHash') == article['contentHash'] else 'updated'


def validate_staged_payload(payload, approved=None):
    if not isinstance(payload, dict):
        raise ValueError('Staged payload must be an object')
    if payload.get('schemaVersion') != 1:
        raise ValueError('Invalid staged schemaVersion')
    if payload.get('source') != FEED:
        raise ValueError('Invalid staged source')
    if payload.get('promotion') != 'Manual review required. This file is not imported by the chatbot.':
        raise ValueError('Invalid staged review policy')

    articles = payload.get('articles')
    if not isinstance(articles, list) or not articles:
        raise ValueError('Staged payload must contain articles')

    approved_by_id = {
        article['id']: article
        for article in (approved or {}).get('articles', [])
    }
    seen_ids = set()
    seen_urls = set()

    for article in articles:
        if not isinstance(article, dict) or set(article) != STAGED_FIELDS:
            raise ValueError('Invalid staged article fields')
        if article['type'] != 'ARTICLE' or article['publicationId'] != 'publication-dataverso':
            raise ValueError('Invalid staged article identity')
        if article['status'] != 'staged' or article['source'] != FEED:
            raise ValueError('Invalid staged article source/status')
        if not isinstance(article['title'], str) or not article['title'].strip() or len(article['title']) > 180:
            raise ValueError('Invalid staged title')
        if not isinstance(article['summary'], str) or len(article['summary']) > 240:
            raise ValueError('Invalid staged summary')

        url = canonical_url(article['url'])
        if url != article['url']:
            raise ValueError('Staged URL is not canonical')
        expected_id = 'article-' + url.rsplit('/', 1)[1]
        if article['id'] != expected_id:
            raise ValueError('Staged article id does not match URL')
        if article['id'] in seen_ids or url in seen_urls:
            raise ValueError('Duplicate staged article')
        seen_ids.add(article['id'])
        seen_urls.add(url)

        topics = article['topics']
        if not isinstance(topics, list) or not topics or any(topic not in TOPICS for topic in topics):
            raise ValueError('Invalid staged topics')
        if len(set(topics)) != len(topics):
            raise ValueError('Duplicate staged topic')

        try:
            published = datetime.datetime.fromisoformat(article['publishedAt'])
        except (TypeError, ValueError) as exc:
            raise ValueError('Invalid staged publishedAt') from exc
        if published.tzinfo is None:
            raise ValueError('Staged publishedAt must include timezone')

        expected_hash = article_content_hash(article)
        if article['contentHash'] != expected_hash:
            raise ValueError('Staged article contentHash mismatch')

        if article['change'] not in {'new', 'unchanged', 'updated'}:
            raise ValueError('Invalid staged change classification')
        if approved is not None and article['change'] != expected_change(article, approved_by_id):
            raise ValueError('Staged change classification mismatch')

    return payload


def check_staged(path=None):
    path = Path(path or (ROOT / 'content/staged/dataverso.json'))
    payload = json.loads(path.read_text(encoding='utf-8'))
    validate_staged_payload(payload, load_approved())
    return payload


def sync(data, output):
    articles = parse_feed(data)
    approved = load_approved()
    known = {article['id']: article for article in approved['articles']}
    for article in articles:
        article['change'] = expected_change(article, known)
    payload = {
        'schemaVersion': 1,
        'source': FEED,
        'promotion': 'Manual review required. This file is not imported by the chatbot.',
        'articles': articles,
    }
    validate_staged_payload(payload, approved)

    output = Path(output)
    allowed = (ROOT / 'content/staged').resolve()
    if output.resolve().parent != allowed:
        raise ValueError('Output must stay in content/staged')
    allowed.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile('w', encoding='utf-8', dir=allowed, delete=False) as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write('\n')
        temporary = handle.name
    os.replace(temporary, output)
    return payload


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', type=Path)
    parser.add_argument(
        '--check-staged',
        action='store_true',
        help='Validate content/staged/dataverso.json without network access.',
    )
    args = parser.parse_args()

    if args.check_staged:
        if args.input:
            parser.error('--input cannot be combined with --check-staged')
        result = check_staged()
        print(f"Validated {len(result['articles'])} staged articles offline; approved Knowledge unchanged.")
        return

    if args.input:
        data = args.input.read_bytes()
    else:
        request = urllib.request.Request(FEED, headers={'User-Agent': 'DataversoCatalogReview/1.0'})
        with urllib.request.urlopen(request, timeout=30) as response:
            if response.url != FEED:
                raise ValueError('Unexpected feed redirect')
            data = response.read(5_000_001)

    result = sync(data, ROOT / 'content/staged/dataverso.json')
    print(f"Validated {len(result['articles'])} staged articles; approved Knowledge unchanged.")


if __name__ == '__main__':
    main()
