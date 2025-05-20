const mongoose = require('mongoose')
const cities = require('./cities')
const { descriptors, places } = require('./seedHelpers')
const Campground = require('../models/campground');

mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database Connected");
})

const sample = (array) => {
    return array[Math.floor(Math.random() * array.length)];
}

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 200; i++) {
        const random1000 = Math.floor(Math.random() * cities.length)
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author:'680114fa00f33243359d5fe6',
            location: `${cities[random1000].city}, ${cities[random1000].admin_name}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem ipsum, dolor sit amet consectetur adipisicing elit. Rem optio dolores vel tempore earum. Omnis eum ut similique consequatur harum suscipit, ipsa, sit, vel possimus iste praesentium cumque alias quisquam.',
            price: price,
            geometry:{
                type:"Point",
                coordinates:[
                    cities[random1000].lng,
                    cities[random1000].lat
                ]
            },
            images: [
                {
                  url: 'https://res.cloudinary.com/dprtbvb3q/image/upload/v1745756692/YelpCamp/vlfv55sir4krtna2gqve.jpg',
                  filename: 'YelpCamp/vlfv55sir4krtna2gqve'                },
                {
                  url: 'https://res.cloudinary.com/dprtbvb3q/image/upload/v1745756693/YelpCamp/hwx6ysoqczwpaf3dj2vp.jpg',
                  filename: 'YelpCamp/hwx6ysoqczwpaf3dj2vp'                }
              ]
        })
        await camp.save();
    }
}
seedDB().then(() => {
    mongoose.connection.close();
});