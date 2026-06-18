const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3030;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const reviews_data = JSON.parse(
  fs.readFileSync('data/reviews.json', 'utf8')
);

const dealerships_data = JSON.parse(
  fs.readFileSync('data/dealerships.json', 'utf8')
);

mongoose
  .connect('mongodb://localhost:27017/', {
    dbName: 'dealershipsDB',
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

const Reviews = require('./review');
const Dealerships = require('./dealership');

async function loadInitialData() {
  try {
    await Reviews.deleteMany({});
    await Reviews.insertMany(reviews_data.reviews);

    await Dealerships.deleteMany({});
    await Dealerships.insertMany(dealerships_data.dealerships);

    console.log('Initial data loaded successfully');
  } catch (error) {
    console.error('Error loading initial data:', error);
  }
}

loadInitialData();

// Express route to home
app.get('/', (req, res) => {
  res.send('Welcome to the Mongoose API');
});

// Express route to fetch all reviews
app.get('/fetchReviews', async (req, res) => {
  try {
    const documents = await Reviews.find();
    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error fetching reviews',
    });
  }
});

// Express route to fetch reviews by a particular dealer
app.get('/fetchReviews/dealer/:id', async (req, res) => {
  try {
    const documents = await Reviews.find({
      dealership: Number(req.params.id),
    });

    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error fetching dealer reviews',
    });
  }
});

// Express route to fetch all dealerships
app.get('/fetchDealers', async (req, res) => {
  try {
    const documents = await Dealerships.find();
    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error fetching dealerships',
    });
  }
});

// Express route to fetch dealers by a particular state
app.get('/fetchDealers/:state', async (req, res) => {
  try {
    const documents = await Dealerships.find({
      state: req.params.state,
    });

    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error fetching dealerships by state',
    });
  }
});

// Express route to fetch dealer by a particular ID
app.get('/fetchDealer/:id', async (req, res) => {
  try {
    const document = await Dealerships.findOne({
      id: Number(req.params.id),
    });

    if (!document) {
      return res.status(404).json({
        error: 'Dealer not found',
      });
    }

    res.json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error fetching dealer',
    });
  }
});

// Express route to insert a review
app.post('/insert_review', async (req, res) => {
  try {
    const data = req.body;

    const latestReview = await Reviews.findOne().sort({
      id: -1,
    });

    const newId = latestReview ? latestReview.id + 1 : 1;

    const review = new Reviews({
      id: newId,
      name: data.name,
      dealership: data.dealership,
      review: data.review,
      purchase: data.purchase,
      purchase_date: data.purchase_date,
      car_make: data.car_make,
      car_model: data.car_model,
      car_year: data.car_year,
    });

    const savedReview = await review.save();
    res.status(201).json(savedReview);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error inserting review',
    });
  }
});

// Start the Express server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${port}`);
});
