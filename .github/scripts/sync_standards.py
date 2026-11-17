"""Synchronize only the shared standards file; refuse divergent edits."""
import base64
import hashlib
import json
import os
import urllib.error
import urllib.request

REPOS = ['fury-of-de-night/BuildGuyana', 'fury-of-de-night/buildguyana-verification',
         'fury-of-de-night/Chinese-Takeaway', 'fury-of-de-night/johnson-rise---shine']
FILE = 'WEBSITE_BUILD_STANDARDS.md'
STATE = '.github/standards-sync-state.json'
COORDINATOR = REPOS[0]


def digest(content):
    return hashlib.sha256(content).hexdigest()


def choose(contents, baseline):
    changed = {digest(content): content for content in contents if digest(content) != baseline}
    if len(changed) > 1:
        raise RuntimeError('Conflicting standards edits. Reconcile the documents manually; nothing was overwritten.')
    return next(iter(changed.values()), None)


class GitHub:
    def __init__(self, token):
        self.token = token

    def request(self, route, payload=None):
        headers = {'Authorization': 'Bearer ' + self.token,
                   'Accept': 'application/vnd.github+json',
                   'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'shared-standards-sync'}
        data = None if payload is None else json.dumps(payload).encode()
        request = urllib.request.Request('https://api.github.com/repos/' + route,
                                         data=data, headers=headers, method='GET' if data is None else 'PUT')
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            # Never print response bodies, tokens, or credential-bearing request objects.
            raise RuntimeError(f'GitHub returned HTTP {error.code} for {route}; check access and branch protection.') from None

    def read(self, repo, path):
        value = self.request(repo + '/contents/' + path)
        return base64.b64decode(value['content']), value['sha']

    def write(self, repo, path, content, sha):
        self.request(repo + '/contents/' + path, {
            'message': 'docs: synchronize shared website build standards',
            'content': base64.b64encode(content).decode(), 'sha': sha,
        })


def synchronize(api):
    state_content, state_sha = api.read(COORDINATOR, STATE)
    baseline = json.loads(state_content)['sha256']
    # Read every copy before writing any: inaccessible or missing repositories stop the run.
    copies = [(repo, *api.read(repo, FILE)) for repo in REPOS]
    chosen = choose([content for _, content, _ in copies], baseline)
    if chosen is None:
        print('All standards copies match the recorded baseline.')
        return
    for repo, content, sha in copies:
        if content != chosen:
            api.write(repo, FILE, chosen, sha)
            print('Synchronized ' + repo)
    # Update last, so partial failures can be retried without losing the chosen version.
    state = json.dumps({'sha256': digest(chosen)}, indent=2).encode() + b'\n'
    api.write(COORDINATOR, STATE, state, state_sha)
    print('Shared baseline updated.')


if __name__ == '__main__':
    token = os.environ.get('STANDARDS_SYNC_TOKEN')
    if not token:
        raise SystemExit('Add the STANDARDS_SYNC_TOKEN GitHub Actions secret before enabling synchronization.')
    synchronize(GitHub(token))
