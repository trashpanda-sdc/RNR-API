const express = require('express');
const query = require('./queries.js');
const app = express();
const port = 3002;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', (req,res,next)=>{
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  next();
})

app.get('/reviews/:id/list',(req,res)=> {
  query.getReviews(req.params.id, req.query.sort, req.query.count)
  .then((data) => Promise.all(data.rows.map((review) => query.getPhotos(review))))
  .then((reviews) => {
    res.send({results: reviews});
  })
  .catch((err) => {
    console.log('failed to get reviews', err);
    res.status(502).send(err);
  })
})


app.get('/reviews/:id/meta', (req, res) => {
  query.getMetaData(req.params.id)
  .then((data) => {
    let metaData = {product_id: data.product_id, ratings: {}, characteristics: data.characteristics};
    metaData.ratings[1] = data.one;
    metaData.ratings[2] = data.two;
    metaData.ratings[3] = data.three;
    metaData.ratings[4] = data.four;
    metaData.ratings[5] = data.five;
    res.send(metaData);
  })
  .catch((err) => {
    console.log('failed to get meta data', err)
    res.status(502).send(err);
  })
})

app.post('/reviews/:id', (req, res) => {
  console.log('body ->', req.body)
  query.postReview(req.params.id, req.body)
  .then((response = {this: 'empty'}) => {
    res.send(response);
  })
  .catch((err) => {
    console.log('failed to post new review', err);
    res.status(502).end();
  })
})

app.put('/reviews/report/:reviewId', (req, res) => {
  query.reportReview(req.params.reviewId)
  .then((response) => {
    res.end();
  })
  .catch((err) => {
    console.log('failed to put report on review', err);
    res.status(502).send(err);
  })
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});