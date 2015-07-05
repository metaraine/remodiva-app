var monk = require('monk')
var config = require('./config.js')
var findOrInsert = require('./findOrInsert.js')
var db = monk(config.connectionString)
var users = db.get('users')

console.log('test')
findOrInsert(users, { a: 0 })
  .then(function (user1) {
    return findOrInsert(users, { a: 0 })
    .then(function (user2) {
      console.log(user1)
      console.log(user2)
      console.log(user1._id.toString() === user2._id.toString())
      return db.close()
    })
  })

