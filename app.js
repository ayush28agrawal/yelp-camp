if(process.env.NODE_ENV !=="production"){
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session')
const flash = require('connect-flash')
const ExpressError = require('./utils/ExpressError')
const methodOverride = require('method-override')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const User = require('./models/user') 
const helmet = require('helmet')
const MongoStore = require('connect-mongo');

const mongoSanitize = require('express-mongo-sanitize');

 
const userRoutes = require('./routes/users')
const campgroundRoutes = require('./routes/campgrounds')
const reviewRoutes = require('./routes/reviews')
const dbUrl= process.env.DB_URL||'mongodb://127.0.0.1:27017/yelp-camp'
mongoose.connect(dbUrl);

const db = mongoose.connection;
db.on("erroe",console.error.bind(console, "connection error:"));
db.once("open",()=>{
    console.log("Database Connected");
})

const app = express();

app.engine('ejs',ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname,'public')))
app.use(mongoSanitize({
    replaceWith:'_'
}));


const secret = process.env.SECRET || 'thisshouldbeabettersecret!'
const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24*60*60,
    crypto:{
        secret
    }  
})
store.on("error",function(e){
    console.log("SESSION STORE ERROR",e)
})

const sessionConfig = {
    store,
    name:'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie:{
        httpOnly:true,
        secure:true,
        expires: Date.now() + (1000*60*60*24*7),
        maxAge:1000*60*60*24*7
    }
}
app.set('trust proxy', 1);

app.use(session(sessionConfig))
app.use(flash())
app.use(helmet())


const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.maptiler.com/",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.maptiler.com/", 
];
const connectSrcUrls = [
    "https://api.maptiler.com/", 
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dprtbvb3q/",  
                "https://api.maptiler.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);





app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())


app.use((req,res,next)=>{
    
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    next()
})



app.use('/',userRoutes)
app.use("/campgrounds",campgroundRoutes)
app.use("/campgrounds/:id/reviews",reviewRoutes)

app.get('/', (req, res) => {
    res.render('home')
})



app.all('*',(req,res,next)=>{
    next(new ExpressError('Page Not Found',404))
})

app.use((err,req,res,next)=>{
    const {statusCode=500} = err
    if(!err.message)
        err.message='Something went Wrong!!'
    res.status(statusCode).render('error',{err});
})

app.listen(3000, () => {
    console.log('Serving on port 3000!');
})