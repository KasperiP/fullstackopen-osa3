const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');

// Configuration for Morgan
const morganFormat = morgan(function (tokens, req, res) {
	const body = JSON.stringify(req.body);
	return [
		tokens.method(req, res),
		tokens.url(req, res),
		tokens.status(req, res),
		tokens.res(req, res, 'content-length'),
		'-',
		tokens['response-time'](req, res),
		'ms',
		body,
	].join(' ');
});

app.use(morganFormat);
app.use(express.json());
app.use(cors());
app.use(express.static('build'));

let persons = [
	{ id: 1, name: 'Arto Hellas', number: '040-123456' },
	{ id: 2, name: 'Ada Lovelace', number: '39-44-5323523' },
	{ id: 3, name: 'Dan Abramov', number: '12-43-234345' },
	{ id: 4, name: 'Mary Poppendieck', number: '39-23-6423122' },
];

const findPerson = (id) =>
	persons.find((person) => person.id.toString() === id);

// Get all persons
app.get('/api/persons', (req, res) => {
	res.json(persons);
});

// Get one person
app.get('/api/persons/:id', (req, res) => {
	const { id } = req.params;
	const person = findPerson(id);

	if (!person) {
		return res.status(404).end();
	}

	res.json(person);
});

// Delete one person
app.delete('/api/persons/:id', (req, res) => {
	const { id } = req.params;
	const person = findPerson(id);

	if (!person) {
		return res.status(404).end();
	}

	persons = persons.filter((person) => person.id.toString() !== id);

	res.status(204).end();
});

app.post('/api/persons', (req, res) => {
	const { name, number } = req.body;

	if (!name || !number) {
		return res.status(400).json({
			error: 'Name or number is not provided',
		});
	}

	const alreadyExists = persons.find((person) => person.name === name);

	if (alreadyExists) {
		return res.status(400).json({
			error: 'Name already exists',
		});
	}

	const generateId = () => Math.floor(Math.random() * 1000000);

	const person = {
		id: generateId(),
		name,
		number,
	};

	persons = persons.concat(person);

	res.json(person);
});

app.get('/info', (req, res) => {
	const date = new Date();
	res.send(`
    <p>Phonebook has info for ${persons.length} people</p>
    <p>${date}</p>
    `);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
