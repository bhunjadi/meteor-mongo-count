## Description

This Meteor package complements `bhunjadi:mongo-transaction` in a way that it patches Cursor.count and Collection.count and uses Collection.countDocuments when in transaction. This allows external packages that are not transaction aware to continue to work with `mongo-transaction` package.  
An example is `ostrio:files` package.

Also, count() has become [deprecated](http://mongodb.github.io/node-mongodb-native/3.5/api/Collection.html#count) in `node-mongodb-native` driver.
