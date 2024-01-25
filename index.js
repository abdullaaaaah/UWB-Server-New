const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

app.use(bodyParser.json());

// MongoDB Atlas connection
const uri = "mongodb+srv://abdullahkiet89:abdullahkiet89@data.kvgwgri.mongodb.net/UWB?retryWrites=true&w=majority";

async function connectToMongoDB() {
  try {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    let isConnected = false;

    await client.connect();
    isConnected = true;

    const collection = client.db("UWB").collection("data");

    // Middleware to check API key
    const apiKeyMiddleware = (req, res, next) => {
      const apiKey = req.query.apiKey;

      // Check if apiKey is present and has the expected value
      if (!apiKey || apiKey !== 'default-api-key') {
        return res.status(401).json({ error: 'Invalid API key' });
      }

      // Continue to the next middleware or route handler
      next();
    };

    // Apply API key middleware to all routes
    app.use(apiKeyMiddleware);

    // Route to handle the incoming data
    app.post('/data', async (req, res) => {
      const data = req.body;

      try {
        if (!isConnected) {
          throw new Error("MongoDB client is not connected");
        }

        // Save the data to MongoDB using the MongoClient
        const result = await collection.insertOne(data);

        if (result.result.ok === 1 && result.insertedCount === 1) {
          console.log('Data saved to MongoDB Atlas:', result.ops[0]);
          res.json({ success: true });
        } else {
          console.error('Error saving data to MongoDB Atlas:', result);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      } catch (error) {
        console.error('Error saving data to MongoDB Atlas:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    // Start the server
    const port = 3000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to initialize MongoDB connection:', err);
  }
}

connectToMongoDB();
