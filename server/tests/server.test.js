const expect = require('expect')
const request = require('supertest')
const {ObjectID} = require('mongodb')
const {app} = require('./../server')
const {Todo} = require('./../models/todo')
const {User} = require('./../models/user')
const {todos, populateTodos, users, populateUsers} = require('./seed/seed')

beforeEach(populateUsers)
beforeEach(populateTodos)

describe('POST/ todos', () => {
    it('should create a new todo', (done) => {
        var text = 'Todo test text'
        
        request(app)
            .post('/todos')
            .set('x-auth', users[0].tokens[0].token)
            .send({text})
            .expect(200)
            .expect((res) => {
                expect(res.body.text).toBe(text)
            })
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                
                Todo.find({text}).then((todos) => {
                    expect(todos.length).toBe(1)
                    expect(todos[0].text).toBe(text)
                    done()
                }).catch((e) => done(e))
            })
    })
    
    it('should not create a todo with invalid data', (done) => {
        request(app)
            .post('/todos')
            .set('x-auth', users[0].tokens[0].token)
            .send()
            .expect(400)
            .end((err, res) => {
                if (err){
                    return done(err)
                }
            })
            
            Todo.find().then((todos) => {
                expect(todos.length).toBe(2)
                done()
            }).catch((e) => done(e))
        }) 
})

describe('GET /todos', () => {
    it('should get all todos', (done) => {
        request(app)
            .get('/todos')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.todos.length).toBe(1)
        })
        .end(done)
    })
})

console.log("ID: ", todos[0]._id.toHexString())

describe('GET /todos/:id', () => {
    it('should return todo doc', (done) => {
        request(app)
            .get(`/todos/${todos[0]._id.toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(todos[0].text)
            })
            .end(done)
    })
    
    it('should 404 if todo not found', (done) => {
        request(app)
            .get(`/todos/${new ObjectID().toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done)
    })
    
    it('should 404 if invalid object id', (done) => {
        request(app)
            .get(`/todos/12345`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done)
    })
    
    it('should not return todo doc created by another user', (done) => {
        request(app)
            .get(`/todos/${todos[1]._id.toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done)
    })
})


describe('DELETE /todos/:id', () => {
    it('should remove a todo', (done) => {
        var pid = todos[1]._id.toHexString()

    request(app)
        .delete(`/todos/${pid}`)
        .set('x-auth', users[1].tokens[0].token)
        .expect(200)
        .expect((res) => {
            expect(res.body.todo._id).toBe(pid)
        })
        .end((err, res) => {
            if (err) {
                return done(err)
            }
        
            Todo.findById(pid).then((todo) => {
                expect(todo).toNotExist()
                done()
            }).catch((e) => done(e))
        })
    })

    it('should 404 if todo not found', (done) => {
        var pid = new ObjectID().toHexString()

        request(app)
            .delete(`/todos/${pid}`)
            .set('x-auth', users[1].tokens[0].token)
            .expect(404)
            .end(done)
    })

    it('should 404 if invalid object id', (done) => {
        request(app)
            .delete('/todos/12345')
            .set('x-auth', users[1].tokens[0].token)
            .expect(404)
            .end(done)
    })
    
    it('should not remove a todo if user is not creator', (done) => {
        var pid = todos[0]._id.toHexString()

    request(app)
        .delete(`/todos/${pid}`)
        .set('x-auth', users[1].tokens[0].token)
        .expect(404)
        .end((err, res) => {
            if (err) {
                return done(err)
            }
        
            Todo.findById(pid).then((todo) => {
                expect(todo).toExist()
                done()
            }).catch((e) => done(e))
        })
    })
})

describe('PATCH /todos/:id', () => {
    it('should update the todo', (done) => {
        var id = todos[0]._id.toHexString()
        var text = "Update..."
        request(app)
            .patch(`/todos/${id}`)
            .set('x-auth', users[0].tokens[0].token)
            .send({
                text,
                completed: true
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(text)
                expect(res.body.todo.completed).toBe(true)
                expect(res.body.todo.completedAt).toBeA('number')
            })
            .end(done)
    })
    
    it('should not update the todo if user is not creator', (done) => {
        var id = todos[0]._id.toHexString()
        var text = "Update..."
        request(app)
            .patch(`/todos/${id}`)
            .set('x-auth', users[1].tokens[0].token)
            .send({
                text,
                completed: true
            })
            .expect(404 )
            .end(done)
    })
    
    it('should clear completedAt when todo complete is set to false', (done) => {
        var id = todos[1]._id.toHexString()
        var text = "Update..."
        request(app)
            .patch(`/todos/${id}`)
            .set('x-auth', users[1].tokens[0].token)
            .send({
                text,
                completed: false
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(text)
                expect(res.body.todo.completed).toBe(false)
                expect(res.body.todo.completedAt).toNotExist( )
            })
            .end(done)
    })
})

describe('GET /users/me', () => {
    it('should return user if auth success', (done) => {
        request(app)
            .get('/users/me')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body._id).toBe(users[0]._id.toHexString())
                expect(res.body.email).toBe(users[0].email)
            })
            .end(done)
    })

    it('should return 401 if auth fails', (done) => {
        request(app)
            .get('/users/me')
            .expect(401)
            .expect((res) => {
                expect(res.body).toEqual({})
            })
            .end(done)
    })
})

describe('POST /users', () => {
    it('should create a user', (done) => {
        var email = 'example@example.com'
        var password = 'qwerty1234'

        request(app)
            .post('/users')
            .send({email, password})
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).toExist()
                expect(res.body._id).toExist()
                expect(res.body.email).toBe(email)
            })
            .end((err) => {
                if (err) {
                    return done(err)
                }
                
                User.findOne({email}).then((user) => {
                    expect(user).toExist()
                    expect(user.password).toNotBe(password)
                    done()
                }).catch((e) => done(e))
            })
  })

  it('should return validation error for invalid request', (done) => {
        request(app)
            .post('/users')
            .send({
                email: 'and',
                password: '123'
            })
            .expect(400)
            .end(done)
  })

  it('should not create user with dupe email', (done) => {
        request(app)
            .post('/users')
            .send({
                email: users[0].email,
                password: 'Password123!'
            })
            .expect(400)
            .end(done)
  })
})

describe('POST /users/login', () => {
    it('should login user and return auth token', (done) => {

        request(app)
            .post('/users/login')
            .send({
                email: users[1].email,
                password: users[1].password 
            })
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).toExist()
            })
            .end((err, res) => {
                if (err) {
                    return done(err)
                } 
            User.findById(users[1]._id).then((user) => {
                expect(user.tokens[1]).toInclude({
                    access: 'auth',
                    token: res.headers['x-auth']
                })
                done()
            }).catch((e) => done(e))
        })
    })
    
    it('should reject invalid credentials', (done) => {

        request(app)
            .post('/users/login')
            .send({
                email: users[1].email,
                password: users[1].password + 'wrong'
            })
            .expect(400)
            .expect((res) => {
                expect(res.headers['x-auth']).toNotExist()
            })
            .end((err, res) => {
                if (err) {
                    return done(err)
                } 
            User.findById(users[1]._id).then((user) => {
                expect(user.tokens.length).toBe(1)
                done()
            }).catch((e) => done(e))
        })
    })
})

describe('DELETE /users/me/token', () => {
    it('should remove auth token on logging out', (done) => {
        request(app)
            .delete('/users/me/token')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .end((err, res) => {
                if (err){
                    return done(err)
                }
                User.findById(users[0]._id).then((user) => {
                    expect(user.tokens.length).toBe(0)
                    done()
                }).catch((e) => done(e))
            })
    }) 
})


