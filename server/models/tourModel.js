const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./userModel');
const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required:[true,'A tour must have a name'],
    maxlength: [40,'A tour name must be less than or equal to 40 character'],
    minlength: [3,'A tour name must be greater than or equal to 3 character'],
    // validate: [validator.isAlpha,'Tour name must only contains characters']
  },
  slug: String,
  duration: {
    type: Number,
    required: [true,'A tour must have a duration']
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a group size']
  },
  difficulty: {
    type: Number,
    required: [true, 'A tour must have a difficulty'],
    enum: {
      value:  ['easy', 'medium', 'difficult'],
      message: 'Difficulty is either easy, medium, difficult'
    }
  },
  ratingsAverage:{
    type: Number,
    default: 4.5,
    min: [1,'Rating must be above 0'],
    max: [1,'Rating cannot be more than 5'],
    set: val=> Math.round(val *10) /10
  },
  ratingQuantity:Number,
  priceDiscount: {
    type: Number,
    validate: {
      validator: function (val) {
        // will not work on update query

        return val < this.price;
      },
      message: `Discount price should be below the regular price`
    }
  },
  price: {
    type: Number,
    required: [true,'A tour must have a price']
  },
  summary:{
    type: String,
    trim: [,'A Tour must have a description']
  },
  description: {
    type: String,
    trim: true
  },
  imageCover: {
    type: String,
    required: [true,'A tour must have a cover image']
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false
  },
  startDates: [Date],
  secretTour: Boolean,
  secretTour:{
    type: boolean,
    default: false
  },
  startLocation:{
    type:{
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String
  },
  locations: [
    {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number
    }
  ],
  guides: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  ]
},{
  toJSON: {virtuals: true},
  toObject: {virtuals: true}
})

tourSchema.index({startLocation: '2dsphere' })

tourSchema.virtual('durationWeeks').get(function(){
  return this.duration / 7
});

/**
 * @description
 * Document middleware runs before .add() .create()
 * this middleware will only works in create query it will not work in update
 */

tourSchema.pre('save',function(next){
  this.slug = slugify(this.name,{lower: true})
  next();
})

// tourSchema.pre('save',async function(next){
//   const guidesPromises =this.guides.map(async id=> await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
// });
tourSchema.pre(/^find/,function(next){
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
})

// created an index on the basis of price
// tourSchema.index({price: 1});
tourSchema.index({price: 1,ratingsAverage: -1});
tourSchema.index({slug: 1});


// tourSchema.pre('save', function (next) {
//   this.slug = slugify(this.name, { lower: true })
//   next();
// })
// tourSchema.post('save',function(doc,next){

//   next();
// })




//Query middleware

tourSchema.pre(/^find/, function (next) {
  this.find({secretTour: {$ne: true}})
  this.start = Date.now()
  next();
})

// virtual populate
tourSchema.virtual('reviews',{
  ref: 'Review',
  foreignField:'tour',
  localField: '_id'
})
tourSchema.post(/^find/, function (docs,next) {
  console.log(`This query took ${Date.now() - this.start}`);

  next();
})

// aggregation middleware


// tourSchema.post('aggregate', function (next) {
//   // console.log(this.pipeline())
//   this.pipeline().unshift({$match: {secretTour: {$ne: true}}})
//   next();
// })



const Tour = mongoose.model('Tour',tourSchema);

module.exports = Tour;

