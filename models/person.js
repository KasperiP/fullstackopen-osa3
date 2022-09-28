const mongoose = require('mongoose')

const url = process.env.MONGODB_URI

mongoose
  .connect(url)
  .then(() => {
    console.log('Connected to MongoDB')
  })
  .catch((error) => {
    console.log('Error connecting to MongoDB:', error.message)
  })

const personSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
  },
  number: {
    type: String,
    required: true,
    minlength: 8,
    validate: {
      validator: function (v) {
        // V needs to contain 2 parts, separated by -
        // First part needs to be 2-3 digits
        // Second part needs to be 7-8 digits
        const parts = v.split('-')
        if (parts.length !== 2) {
          return false
        }
        const firstPart = parts[0]
        const secondPart = parts[1]
        if (firstPart.length < 2 || firstPart.length > 3) {
          return false
        }

        if (secondPart.length < 7 || secondPart.length > 8) {
          return false
        }

        return true
      },
    },
  },
})

personSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})

module.exports = mongoose.model('Person', personSchema)
