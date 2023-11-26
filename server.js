// server.js
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');
const async = require('async');
const path = require('path');
const fs = require('fs')

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// Set up multer storage to save images to a folder
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'uploads'), // Specify the folder to save images
  filename: (req, file, callback) => {
    callback(null, Date.now() + path.extname(file.originalname)); // Use a unique filename
  },
});

const upload = multer({ storage: storage, limits: { fileSize: 2 * 1024 * 1024 } });

let data = [];

const uploadQueue = async.queue((task, callback) => {
  processFile(task, callback);
}, 1);

const processFile = async ({ name, email, avatarPath }, callback) => {
  try {
    // Save the data to the in-memory array or your storage solution
    data.push({ id: data.length + 1, name, email, avatar: avatarPath });

    // Respond with success
    callback(null, { name, email, avatar: avatarPath });
  } catch (error) {
    // Handle error
    console.error('Error processing form data:', error);
    callback(error);
  }
};

app.post('/data', upload.single('avatar'), (req, res) => {
  const { name, email } = req.body;
  const avatarPath = req.file.path; // Use the path where the image is saved

  uploadQueue.push({ name, email, avatarPath }, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(201).json(result);
    }
  });
});

app.use('/uploads', express.static('uploads')); // Serve images from the 'uploads' folder

app.get('/data', (req, res) => {
  // Send simplified data with image URIs
  const simplifiedData = data.map(item => ({
    id: item.id,
    name: item.name,
    email: item.email,
    avatar: `http://localhost:3001/uploads/${path.basename(item.avatar)}`, // Use the URI
  }));

  res.json(simplifiedData);
});

app.delete('/data/:id', (req, res) => {
  const idToDelete = parseInt(req.params.id, 10);

  // Find the index of the item to delete in the 'data' array
  const indexToDelete = data.findIndex((item) => item.id === idToDelete);

  if (indexToDelete === -1) {
    // If the item with the specified ID is not found
    res.status(404).json({ error: 'Item not found' });
  } else {
    // Remove the item from the 'data' array
    const deletedItem = data.splice(indexToDelete, 1)[0];
    
    // If you need to delete the associated file, do it here
    const filePath = path.join(__dirname, 'uploads', path.basename(deletedItem.avatar));
    fs.unlinkSync(filePath);

    // Respond with the deleted item
    res.json(deletedItem);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
