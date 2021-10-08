const express = require('express')
const mongoose = require('mongoose')
const {ObjectId} = mongoose.Types
const app = express()
const Meal = require('./mealSchema')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//mongoose related stuff
mongoose.connect("mongodb://localhost/EatingRoutine", { useNewUrlParser: true, useUnifiedTopology: true })
let db = mongoose.connection
db.on("error", console.error.bind(console, "connection error"))
db.once("open", () => console.log("Connection established"))


/**
  Send following JSON Body raw data along with request on Postman

    {
        "mealType": "Lunch",
        "foods": [
            {"food": ["one", "two", "three"]},
            {"food": ["four", "five"]}
        ]
    }
*/
app.post('/api/create', async (req, res) => {
    try {
        // Destructuring mealType and foods Array from req.body
        const {mealType, foods} = req.body
        // If any of the condition evaluates to true then returning an error
        if(!mealType ||  !foods || foods.length === 0) return res.status(400).json({error: "Incomplete data"})
        // Checking if a document with mealType(which is to be created) exists already 
        const ifExists = await Meal.findOne({mealType})
        // If it exists then returning an error
        if(ifExists) return res.status(400).json({error: "A meal with this mealType exists already"})
        // Creating new document
        const newMeal = new Meal({
            mealType,
            foods
        })
        // Saving document
        newMeal.save()
        // returning 200 status with the document created
        res.status(200).json({
            data: newMeal
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({error: "We are facing some issue, please try again later"})
    }
})

/**

 Send following body data along with request on Postman
    localhost:5000/api/update/seven
    {
        "mealId": "615fc3d04fc252e280b7cbed",
        "foodsId": "615fc3d04fc252e280b7cbef",
        "oldValue": "three"
    }

*/
app.patch("/api/update/:updateValue", async (req, res) => {
    try {
        // Destructuring required data from req.body
        const {mealId, foodsId, oldValue} = req.body
        const {updateValue} = req.params
        if(!mealId || !foodsId || !oldValue || !updateValue) return res.status(400).json({error: "Incomplete data"})

        // If the value to be changed do not exist then returning 400 status
        const ifExists = await Meal.findOne({_id: ObjectId(mealId), "foods.food": oldValue})
        if(!ifExists) return res.status(400).json({error: "There does not exists such food item"})

        // Updating old value to new value
        await Meal.updateOne({_id: ObjectId(mealId), "foods.food": oldValue}, {$set: {"foods.$[outer].food.$[inner]": updateValue}}, {arrayFilters: [{"outer._id": ObjectId(foodsId)}, {"inner": oldValue}]})

        res.status(200).json({
            data: "Success"
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({error: "We are facing some issue, please try again later"})
    }
})

/**
 Send following body data along with request on Postman
    localhost:5000/api/delete/{id of foods array you want to delete}
    {
        "mealId": "615fc3d04fc252e280b7cbed"
    }

*/
app.delete("/api/delete/:id", async (req, res) => {
    try {
        // Destructuring mealId from req.body
        const {mealId} = req.body
        // Destructuring id of the foods array from req.params
        const {id} = req.params
        if(!mealId || !id) return res.status(400).json({error: "Incomplete data"})

        // Returning 400 error if the foods array with the given id doesnt exists
        const ifExists = await Meal.findOne({_id: mealId, "foods._id": id})
        if(!ifExists) return res.status(400).json({error: "You do not have any document with the provided Data"})

        await Meal.updateOne({_id: mealId}, {$pull: {foods: {_id: id}}})

        res.status(200).json({
            data: "Success"
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({error: "We are facing some issue, please try again later"})
    }
})

app.get("/api/getAll", async (req, res) => {
    try {
        const meals = await Meal.find({})
        res.status(200).json(meals)
    } catch (error) {
        console.log(error)
        res.status(500).json({error: "We are facing some issue, please try again later"})
    }
})

app.get("/api/:mealType", async (req, res) => {
    try {
        const {mealType} = req.params
        if(!mealType) return res.status(400).json({error: "Incomplete data"})
        const meal = await Meal.find({mealType})
        res.status(200).json(meal)
    } catch (error) {
        console.log(error)
        res.status(500).json({error: "We are facing some issue, please try again later"})
    }
})

app.listen(5000, () => console.log("Server started on port 5000"))
