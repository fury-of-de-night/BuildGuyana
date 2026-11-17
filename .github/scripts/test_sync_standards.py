import unittest
import sync_standards as sync


class FakeGitHub:
    def __init__(self, contents, baseline=b'old'):
        import json
        self.files = {(repo, sync.FILE): content for repo, content in zip(sync.REPOS, contents)}
        self.files[sync.COORDINATOR, sync.STATE] = json.dumps({'sha256': sync.digest(baseline)}).encode()
        self.writes = []
        self.fail_repo = None

    def read(self, repo, path):
        value = self.files[repo, path]
        return value, sync.digest(value)

    def write(self, repo, path, content, sha):
        if repo == self.fail_repo:
            raise RuntimeError('fixture: protected branch')
        assert sync.digest(self.files[repo, path]) == sha
        self.files[repo, path] = content
        self.writes.append((repo, path))


class SyncTests(unittest.TestCase):
    def test_edit_from_any_repository(self):
        for source in range(4):
            contents = [b'old'] * 4
            contents[source] = b'new'
            api = FakeGitHub(contents)
            sync.synchronize(api)
            self.assertTrue(all(api.files[repo, sync.FILE] == b'new' for repo in sync.REPOS))
            api.writes.clear()
            sync.synchronize(api)
            self.assertEqual(api.writes, [])

    def test_conflict_preserves_all_copies(self):
        api = FakeGitHub([b'new', b'different', b'old', b'old'])
        with self.assertRaisesRegex(RuntimeError, 'Conflicting'):
            sync.synchronize(api)
        self.assertEqual(api.writes, [])

    def test_partial_failure_is_recoverable(self):
        api = FakeGitHub([b'old', b'old', b'old', b'new'])
        api.fail_repo = sync.REPOS[1]
        with self.assertRaises(RuntimeError):
            sync.synchronize(api)
        api.fail_repo = None
        sync.synchronize(api)
        self.assertTrue(all(api.files[repo, sync.FILE] == b'new' for repo in sync.REPOS))

    def test_missing_copy_stops_before_writes(self):
        api = FakeGitHub([b'new', b'old', b'old', b'old'])
        del api.files[sync.REPOS[2], sync.FILE]
        with self.assertRaises(KeyError):
            sync.synchronize(api)
        self.assertEqual(api.writes, [])


if __name__ == '__main__':
    unittest.main()
