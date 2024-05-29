const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBServer()
// API 1
app.get('/todos/', async (request, response) => {
  const requestQuery = request.query
  const hasPriorityAndStatusProperties = requestQuery => {
    return (
      requestQuery.priority !== undefined && requestQuery.status !== undefined
    )
  }

  const hasPriorityProperty = requestQuery => {
    return requestQuery.priority !== undefined
  }

  const hasStatusProperty = requestQuery => {
    return requestQuery.status !== undefined
  }

  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`
      break
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`
  }
  const todos = await db.all(getTodosQuery)
  response.send(todos)
})

// API 2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const todo = await db.get(`SELECT * FROM todo WHERE id = ${todoId}`)
  response.send(todo)
})

// API 3
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const result = await db.run(`
    INSERT INTO todo (id, todo, priority, status)
    VALUES (${id}, '${todo}', '${priority}', '${status}')
  `)
  response.send(`Todo Successfully Added`)
})

// API 4
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body
  let updateColumn = ''
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
  }
  const priviousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`
  const priviousTodo = await db.get(priviousTodoQuery)
  const {
    todo = priviousTodo.todo,
    priority = priviousTodo.priority,
    status = priviousTodo.status,
  } = request.body
  const updateTodoQuery = `UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}' WHERE id = ${todoId};`
  await db.run(updateTodoQuery)
  response.send(`${updateColumn} Updated`)
})

// API 5
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const result = await db.run(`DELETE FROM todo WHERE id = ${todoId}`)
  response.send(`Todo Deleted`)
})

module.exports = app
