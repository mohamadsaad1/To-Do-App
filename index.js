import { createRequire } from 'module';
import methodOverride from 'method-override'
const require = createRequire(import.meta.url);
const { MongoClient, ObjectId } = require("mongodb");
const connectionString = 'mongodb+srv://Lynn:Taylor77@cluster0.1ydp0.mongodb.net/toodoo?retryWrites=true&w=majority'
const express = require('express');
const bodyparser = require("body-parser");
const app = express();
app.set('view engine', 'ejs')
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());
app.use(methodOverride('_method'))

app.listen(process.env.PORT || 8000, () => {
  console.log('now listening to port 8000');
})


const completetionStatus = (task) => {
  return task.isComplete ? 'Complete' : 'In Progress';
}
const index = (collection, response) => {
  return collection.find().toArray()
    .then(tasks => {
    response.render('index.ejs', {
      tasks: tasks,
      completetionStatus: completetionStatus
    });
    })
    .catch(e => console.error(e));
}

MongoClient.connect(connectionString)
  .then(client => {
    console.log('Connected Successfully!');
    const db = client.db();
    const tasksCollection = db.collection('tasks');
    app.get('/', async (req, res) => {
      return index(tasksCollection, res);
    })
    app.get('/task', async (req, res) => {
      index(tasksCollection, res);
    })
    app.post('/task', async (req, res) => {
      req.body['isComplete'] = false;
      tasksCollection.insert(req.body).then(() => index(tasksCollection, res));
    })
    app.delete(`/task/:id`, async (req, res) => {
      const id = ObjectId(req.params.id);
      return await tasksCollection.remove({ _id: id })
        .then(result => {
          if (result.deletedCount === 0) {
            res.send('Task not found')
          } else {
            index(tasksCollection, res)
          }
        }).catch(e => console.error(e))
    })
    app.put('/task/toggle/:id', async (req, res) => {
      const id = new ObjectId(req.params.id);
      return tasksCollection.find({ _id: id }).toArray().then(async (tasks) => {
        if (tasks.length > 0) {
          const task = tasks[0];
          return tasksCollection.update({ _id: id }, { '$set': { isComplete: !task.isComplete } })
            .then((result) => {
              return index(tasksCollection, res);
            })
        }
      })
    })
  })
