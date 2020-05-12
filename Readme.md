## Description

This Meteor package complements `bhunjadi:mongo-transaction` in a way that it patches Cursor.count and Collection.count and uses Collection.countDocuments when in transaction. This allows external packages that are not transaction aware to continue to work with `mongo-transaction` packages.  
An example is `ostrio:files` package.
