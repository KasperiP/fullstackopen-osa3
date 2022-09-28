const express = require('express')
const app = express()
const morgan = require('morgan')
const cors = require('cors')
require('dotenv').config()
const Person = require('./models/person')

// Configuration for Morgan
const morganFormat = morgan(function (tokens, req, res) {
  const body = JSON.stringify(req.body)
  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'),
    '-',
    tokens['response-time'](req, res),
    'ms',
    body,
  ].join(' ')
})

app.use(morganFormat)
app.use(express.json())
app.use(cors())
app.use(express.static('build'))

// Get all persons
app.get('/api/persons', async (req, res) => {
  const persons = await Person.find()
  res.json(persons)
})

// Get one person
app.get('/api/persons/:id', async (req, res, next) => {
  const { id } = req.params

  try {
    const person = await Person.findById(id)
    if (!person) {
      return res.status(404).json({
        error: 'Person not found',
      })
    }

    res.json(person)
  } catch (error) {
    next(error)
  }
})

// Delete one person
app.delete('/api/persons/:id', async (req, res, next) => {
  const { id } = req.params

  try {
    const person = await Person.findByIdAndRemove(id)

    if (!person) {
      return res.status(404).json({
        error: 'Person not found',
      })
    }

    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

app.post('/api/persons', async (req, res, next) => {
  const { name, number } = req.body

  if (!name || !number) {
    return res.status(400).json({
      error: 'Name or number is not provided',
    })
  }

  try {
    const alreadyExists = await Person.findOne({ name })

    if (alreadyExists) {
      return res.status(400).json({
        error: 'Name already exists',
      })
    }
  } catch (error) {
    next(error)
  }

  const person = {
    name,
    number,
  }

  const newPerson = new Person(person)

  try {
    const savedPerson = await newPerson.save()
    res.json(savedPerson)
  } catch (error) {
    next(error)
  }
})

app.get('/info', async (_, res) => {
  const date = new Date()
  const persons = await Person.countDocuments()
  res.send(`
    <p>Phonebook has info for ${persons.length} people</p>
    <p>${date}</p>
    `)
})

app.put('/api/persons/:id', async (req, res, next) => {
  const { id } = req.params
  const { name, number } = req.body

  if (!name || !number) {
    return res.status(400).json({
      error: 'Name or number is not provided',
    })
  }

  try {
    const person = { name, number }
    const updatedPerson = await Person.findByIdAndUpdate(id, person, {
      new: true,
      runValidators: true,
      context: 'query',
    })

    // If the person is not found, return 404
    if (!updatedPerson) {
      return res.status(404).json({
        error: 'Person not found',
      })
    }

    res.json(updatedPerson)
  } catch (error) {
    next(error)
  }
})

const unknownEndpoint = (_, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

// olemattomien osoitteiden käsittely
app.use(unknownEndpoint)

const errorHandler = (error, _, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  }

  if (error.name === 'SyntaxError') {
    return response.status(400).send({ error: 'malformatted body' })
  }

  if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

// tämä tulee kaikkien muiden middlewarejen rekisteröinnin jälkeen!
app.use(errorHandler)

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
