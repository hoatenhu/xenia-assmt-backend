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

const storage = multer.diskStorage({
  destination: path.join(__dirname, 'uploads'), 
  filename: (req, file, callback) => {
    callback(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage, limits: { fileSize: 2 * 1024 * 1024 } });

let data = [];

const uploadQueue = async.queue((task, callback) => {
  processFile(task, callback);
}, 1);

const processFile = async ({ name, email, avatarPath }, callback) => {
  try {
    data.push({ id: data.length + 1, name, email, avatar: avatarPath });

    callback(null, { name, email, avatar: avatarPath });
  } catch (error) {
    console.error('Error processing form data:', error);
    callback(error);
  }
};

app.post('/data', upload.single('avatar'), (req, res) => {
  const { name, email } = req.body;
  const avatarPath = req.file.path;

  uploadQueue.push({ name, email, avatarPath }, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(201).json(result);
    }
  });
});

app.use('/uploads', express.static('uploads'));

app.get('/data', (req, res) => {
  const simplifiedData = data.map(item => ({
    id: item.id,
    name: item.name,
    email: item.email,
    avatar: `http://localhost:3001/uploads/${path.basename(item.avatar)}`,
  }));

  res.json(simplifiedData);
});

app.delete('/data/:id', (req, res) => {
  const idToDelete = parseInt(req.params.id, 10);

  const indexToDelete = data.findIndex((item) => item.id === idToDelete);

  if (indexToDelete === -1) {
    res.status(404).json({ error: 'Item not found' });
  } else {
    const deletedItem = data.splice(indexToDelete, 1)[0];
    
    const filePath = path.join(__dirname, 'uploads', path.basename(deletedItem.avatar));
    fs.unlinkSync(filePath);

    res.status(200).json(deletedItem);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
