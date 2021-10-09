const Pool = require('pg').Pool
const pool = new Pool({
  user: 'api',
  host: '/tmp',
  database: 'rnrapi',
  password: 'apiconnect',
  port: 5432,
})
const sortColOpts = {
  relevant: 'product_id',
  helpful: 'helpfulness',
  newest: 'date'
}
const metaIn = {
  '1': 0,
  '2': 0,
  '3': 0,
  '4': 0,
  '5': 0,
}
async function getReviews(pid, sort, count) {
  let sortCol = sortColOpts[sort];
  return queryResults = await pool.query('select * from reviews where product_id = $1 and reported = FALSE order by $2 limit $3;', [pid,sortCol,count])
}

async function getPhotos(review) {
  let reviewWithPhotos = review;
  await pool.query('select * from review_photos where review_id = $1', [review.id])
  .then((photos) => {
    if (review.response === 'null'){
      reviewWithPhotos.response = null;
    }
    reviewWithPhotos.photos = photos.rows;
  })
  .catch((err)=>{console.log('err getting photos', err)})
  return reviewWithPhotos;
}


async function getMetaData(pid) {
  let metaPromise = await pool.query('select * from meta where product_id = $1', [pid]);
  let charPromise = await pool.query('select id, name, ratingTotal, numOfRatings from characteristics where product_id = $1', [pid]);
  return Promise.all(([metaPromise, charPromise]))
    .then((responses) => {
      let meta = responses[0].rows[0];
      let chars = responses[1].rows;
      let characteristics = {};
      chars.forEach( char => {
        characteristics[char.name] = {value: ((char.ratingtotal/char.numofratings) || 0), id: char.id.toString()};
      })
      if(meta) {
      meta.characteristics = characteristics;
      return meta;
      } else {return {}}
    })
}

async function reportReview(reviewId) {
  return promise = await pool.query('update reviews set reported = TRUE where id = $1', [reviewId])
}

async function postReview(pid, {
  rating,
  summary,
  body,
  recommend,
  name,
  email,
  photos,
  characteristics
}) {
  let date = Date.now();
  pool.query('insert into reviews (id, product_id, rating, summary, body, recommend, reviewer_name, reviewer_email, date) values(default, $1, $2, $3, $4, $5, $6, $7, $8) returning id', [pid, rating, summary, body, recommend, name, email, date])
  .then((reponse) => {
    if (photos) {
      photos.forEach(photo=>pool.query('insert into review_photos (review_id, url) values($1, $2)', [response.rows[0], photo[0]]));
    }
  })
  .catch((err) => {console.log('failed to post review to database', err)});
  metaIn[rating] = 1;
  pool.query('update meta set one = one + $1, two = two + $2, three = three + $3, four = four + $4, five = five + $5 where product_id = $6', [metaIn['1'],metaIn['2'],metaIn['3'],metaIn['4'],metaIn['5'], pid])
  .catch((err) => {console.log('failed meta', err)});
  metaIn[rating] = 0;
  Object.keys(characteristics).forEach((key) => {
    pool.query('update characteristics set ratingtotal = ratingtotal + $1, numofratings = numofratings + 1 where id = $2', [parseInt(characteristics[key]), key])
    .catch((err) => {console.log('failed charateristics', err)});
  })

}



module.exports = {
  getReviews,
  getPhotos,
  getMetaData,
  reportReview,
  postReview,
}