Package.describe({
    name: 'bhunjadi:mongo-count',
    version: '0.0.1',
    // Brief, one-line summary of the package.
    summary: '',
    // URL to the Git repository containing the source code for this package.
    git: '',
    // By default, Meteor will default to using README.md for documentation.
    // To avoid submitting documentation, set this field to null.
    documentation: 'README.md'
});

Package.onUse(function(api) {
    api.versionsFrom('1.10.1');
    api.use('typescript');
    api.use('mongo');
    api.mainModule('index.ts', 'server');
});

Package.onTest(function(api) {
    api.versionsFrom('1.10.1');
    api.use('meteortesting:mocha');
    api.use('typescript');
    api.use('mongo');
    api.use('bhunjadi:mongo-count');
    api.mainModule('tests/server.ts', 'server');
});
