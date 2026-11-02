const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 }, // percent
    category: { type: String, required: [true, 'Category is required'], trim: true },
    image: { type: String, default: '' }, // main image (absolute URL)
    images: [String],
    style: { type: String, enum: ['casual', 'formal', 'party', 'gym'], default: 'casual' },
    gender: { type: String, enum: ['men', 'women', 'unisex'], default: 'unisex' },
    tag: { type: String, enum: ['new', 'top', 'none'], default: 'new' },
    sizes: [String],
    colors: [String],
    stock: { type: Number, default: 0, min: 0 },
    sold: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    reviews: [reviewSchema],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false }, toObject: { virtuals: true } }
);

productSchema.virtual('finalPrice').get(function () {
  return Math.round(this.price * (1 - this.discount / 100) * 100) / 100;
});

module.exports = mongoose.model('Product', productSchema);
