const mongoose = require('mongoose')

const foodSchema = mongoose.Schema({
    food: [String]
})
const mealSchema = mongoose.Schema({
    mealType: String,
    foods: [foodSchema]
})

module.exports = mongoose.model("meal", mealSchema)