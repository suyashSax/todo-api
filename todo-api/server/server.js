var express = require('express')
var bodyParser = require('body-parser')

var {mongoose} =  require('./db/mongoose')
var {Todo} = require('./models/todo')
var {User} = require('./models/user')

var app = express()

app.use(bodyParser.json())

app.post('/todos/', (req, res) => {
    var todo = new Todo({
        text: req.body.text
    })
    
    console.log(JSON.stringify(todo))
    
    todo.save().then((doc) => {
        console.log("Save Response")
        res.send(doc)
        console.log("Sent Response")
    }, (e) => {
        console.log("Err Response")
        res.status(400).send(e)
        console.log("Sent Err")
    })
})

app.listen(3000, () => {
    console.log('Started on port 3000')
})