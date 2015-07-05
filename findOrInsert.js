var config = require('./config.js')

function findOrInsert(collection, search, opts) {
  return collection.findOne(search, opts)
  .then(function (doc) {
    return doc || collection.insert(search, opts)
  })
}

module.exports = findOrInsert