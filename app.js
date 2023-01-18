import express, { json } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createDb } from './helpers/connectToDb.js'
import { ObjectId } from 'mongodb';
import { paginationAdminRequest } from './helpers/pagination.js';
import { hash } from 'bcrypt';
import { verifyPassword } from './helpers/verifyPassword.js';
import jsonwebtoken from 'jsonwebtoken'
import cookieParser from 'cookie-parser';
import { v2 as cloudinary } from 'cloudinary'
import fileUpload from 'express-fileupload';
import fs from 'fs';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(fileUpload());
const APP_PORT = 5000;
let users;
let animals;
let trainingLogs;

cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.CLOUD_API_KEY, 
    api_secret: process.env.CLOUD_API_SECRET
  });

const jwtKey = process.env.JWT_STRING;
const jwtExpirySeconds= 300;

createDb().then((db) => {
    users = db.collection('users');
    animals = db.collection('animals');
    trainingLogs = db.collection('trainingLogs');
});

app.use(cors({ origin: true }));

app.get('/', (req, res) => {
    res.json({"Hello": "World",
            "Version": 2})
})

app.get('/api/health', (req, res) => {
    res.json({"healthy" : true})
})

app.post('/api/user', async (req, res) => {
    try {
        if(!req.body.email || !req.body.firstName || !req.body.lastName || !req.body.password) {
            res.status(400).send('Status: Parameter missing in body');
            return;
        }
        if (!(req.body.email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/))) {
            res.status(400).send('Status: Invalid email');
            return;
        }
        hash(req.body.password, 10, (err, hash) => {
            const userObj = {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                password: hash,
                profilePicture: "dummyUrl"
            };
            users.insertOne(userObj);
            res.status(200).send('Status: OK');
            return;
        });  
    }
    catch(error) {
        res.status(500).send('Status: ' + error);
        return;
    }
})

app.post('/api/animals', (req, res) => {
    if(!req.cookies.token) {
        res.status(401).send('No token present');
        return;
    }
    const token = req.cookies.token;
    try {
        let payload = jsonwebtoken.verify(token, jwtKey);
        if(!req.body.name || !req.body.hoursTrained) {
            res.status(400).send('Status: Parameter missing in body');
            return;
        }
        if(isNaN(req.body.hoursTrained)) {
            res.status(400).send('Status: Hours trained is not a valid number');
            return;
        }
        const animalObj = {
            name: req.body.name,
            hoursTrained: parseInt(req.body.hoursTrained),
            owner: payload.userId,
            dateOfBirth: req.body.date,
            profilePicture: "RandomString",
        }
        animals.insertOne(animalObj);
        res.status(200).send('Status: OK');
        return;
    }
    catch(error) {
        if(error instanceof jsonwebtoken.JsonWebTokenError) {
            res.status(401).send('Invalid token present');
            return;
        }
        res.status(500).send('Status ' + error);
        return;
    }
})

app.post('/api/training', async (req, res) => {
    if(!req.cookies.token) {
        res.status(401).send('No token present');
        return;
    }
    const token = req.cookies.token;
    try {
        let payload = jsonwebtoken.verify(token, jwtKey);
        if(!req.body.date || !req.body.description || !req.body.hours || !req.body.animal) {
            res.status(400).send("Status: Parameter missing in body");
            return;
        }
        if(isNaN(req.body.hours)) {
            res.status(400).send('Status: Hours is not a valid number');
            return;
        }
        if((await animals.findOne(ObjectId(req.body.animal))).owner !== req.body.user ) {
            res.status(400).send("Status: Animal's owner does not match owner given in request");
            return;
        }
        const trainingObj = {
            date: req.body.date,
            description: req.body.description,
            hours: parseInt(req.body.hours),
            animal: req.body.animal,
            user: payload.userId,
            trainingLogVideo: "RandomURL"
        }
        trainingLogs.insertOne(trainingObj);
        res.status(200).send('Status: OK');
        return;
    }
    catch(error) {
        if(error instanceof jsonwebtoken.JsonWebTokenError) {
            res.status(401).send('Invalid token present');
            return;
        }
        res.status(500).send('Status ' + error);
        return;
    }
})

app.get('/api/admin/users', async (req, res) => {
    if(!req.cookies.token) {
        res.status(401).send('No token present');
        return;
    }
    const token = req.cookies.token;
    try {
        let payload = jsonwebtoken.verify(token, jwtKey);
        if(!req.body.pageSize || !req.body.pageNumber) {
            res.status(400).send('Status: Parameter missing in body');
            return;
        }
        if(isNaN(req.body.pageSize)) {
            res.status(400).send('Status: Page size is not a valid input (must be a number)');
            return;
        }
        if(isNaN(req.body.pageNumber)) {
            res.status(400).send('Status: Page number is not a valid input (must be a number)');
            return;
        }
        if(parseInt(req.body.pageSize) * parseInt(req.body.pageNumber) > users.count() || parseInt(req.body.pageSize) * parseInt(req.body.pageNumber) < 0) {
            res.status(400).send('Status: Page number and page size are not valid numbers for the collection');
            return;
        }
        res.send(await paginationAdminRequest(users,req.body.pageSize, req.body.pageNumber));
        res.status(200).send('Status: OK');
        return;
    }
    catch(error) {
        if(error instanceof jsonwebtoken.JsonWebTokenError) {
            res.status(401).send('Invalid token present');
            return;
        }
        res.status(500).send('Status ' + error);
        return;
    }
})

app.get('/api/admin/animals', async (req, res) => {
    if(!req.cookies.token) {
        res.status(401).send('No token present');
        return;
    }
    const token = req.cookies.token;
    try {
        let payload = jsonwebtoken.verify(token, jwtKey);
        if(!req.body.pageSize || !req.body.pageNumber) {
            res.status(400).send('Status: Parameter missing in body');
            return;
        }
        if(isNaN(req.body.pageSize)) {
            res.status(400).send('Status: Page size is not a valid input (must be a number)');
            return;
        }
        if(isNaN(req.body.pageNumber)) {
            res.status(400).send('Status: Page number is not a valid input (must be a number)');
            return;
        }
        if(parseInt(req.body.pageSize) * parseInt(req.body.pageNumber) > users.count() || parseInt(req.body.pageSize) * parseInt(req.body.pageNumber) < 0) {
            res.status(400).send('Status: Page number and page size are not valid numbers for the collection');
            return;
        }
        res.send(await paginationAdminRequest(animals,req.body.pageSize, req.body.pageNumber));
        return;
    }
    catch(error) {
        if(error instanceof jsonwebtoken.JsonWebTokenError) {
            res.status(401).send('Invalid token present');
            return;
        }
        res.status(500).send('Status ' + error);
        return;
    }
})

app.get('/api/admin/training', async (req, res) => {
    if(!req.cookies.token) {
        res.status(401).send('No token present');
        return;
    }
    const token = req.cookies.token;
    try {
        let payload = jsonwebtoken.verify(token, jwtKey);
        if(!req.body.pageSize || !req.body.pageNumber) {
            res.status(400).send('Status: Parameter missing in body');
            return;
        }
        if(isNaN(req.body.pageSize)) {
            res.status(400).send('Status: Page size is not a valid input (must be a number)');
            return;
        }
        if(isNaN(req.body.pageNumber)) {
            res.status(400).send('Status: Page number is not a valid input (must be a number)');
            return;
        }
        if(parseInt(req.body.pageSize) * parseInt(req.body.pageNumber) > users.count() || parseInt(req.body.pageSize) * parseInt(req.body.pageNumber) < 0) {
            res.status(400).send('Status: Page number and page size are not valid numbers for the collection');
            return;
        }
        res.send(await paginationAdminRequest(trainingLogs,req.body.pageSize, req.body.pageNumber));
        res.status(200).send('Status: OK');
        return;
    }
    catch(error) {
        if(error instanceof jsonwebtoken.JsonWebTokenError) {
            res.status(401).send('Invalid token present');
            return;
        }
        res.status(500).send('Status ' + error);
        return;
    }
})

app.post('/api/user/login', async (req, res) => {
    try {
        if(!req.body.password || !req.body.email) {
            res.status(400).send('Status: Parameter missing in body');
            return;
        }
        if (await verifyPassword(req, users)) {
            res.status(200).send('Status: Valid Combo');
            return;
        }
        else {
            res.status(403).send('Status: Invalid Combo');
            return;
        }
    }
    catch(error) {
        res.status(500).send('Status ' + error);
        return;
    }
})

app.post('/api/user/verify', async (req, res) => {
    try {
        if(!req.body.password || !req.body.email) {
            res.status(400).send('Status: Parameter missing in body');
            return;
        }
        if (await verifyPassword(req, users)) {
            let user = await users.findOne( {email:req.body.email});
            const payload = {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                userId: user._id.toString(),

            }
            const token = jsonwebtoken.sign(payload, jwtKey, {
                algorithm: "HS256",
                expiresIn: jwtExpirySeconds
            })
            res.cookie("token", token, {maxAge: jwtExpirySeconds * 1000 });
            res.status(200).send('Status: JWT Issued');
            return;
        }
        else {
            res.status(403).send('Status: Invalid Combo');
            return;
        }
    }
    catch(error) {
        res.status(500).send('Status ' + error);
        return;
    }
})

//Using the Cloudinary API
app.post('/api/file/upload', async (req, res) => {
    if(!req.cookies.token) {
        res.status(401).send('No token present');
        return;
    }
    if(!req.files) {
        res.status(500).send('Status: No file found');
    }
    const token = req.cookies.token;
    try {
        let payload = jsonwebtoken.verify(token, jwtKey);
        const file = req.files.file;
        if(!file) {
            res.status(500).send("Status: No file found, could be improperly named");
            return;
        }
        if(!req.body.fileType) {
            res.status(400).send("Status: No file type given");
            return;
        }
        file.mv(file.name);
        let cloudinaryObj = await cloudinary.uploader.upload(file.name, { tags: 'basic_sample' }, function (err, file) {
            if (err) { console.warn(err); }
        });
        let url = cloudinaryObj.url;
        if(req.body.fileType === "user") {
            users.update({'_id':ObjectId(payload.userId)},{$set:{'profilePicture':url}});
        }
        else if(req.body.fileType === "animal") {
            if(!req.body.id) {
                res.status(400).send("Status: No animal id given");
                return;
            }
            if(payload.userId !== (await animals.findOne(ObjectId(req.body.id))).owner) {
                res.status(500).send("Status: Invalid animal id for the current user");
                return;
            }
            animals.updateOne({'_id':ObjectId(req.body.id)}, {$set:{'profilePicture':url}});
        }
        else if(req.body.fileType === "trainingLog") {
            if(!req.body.id) {
                res.status(400).send("Status: No training log video given");
                return;
            }
            if(payload.userId !== (await animals.findOne(ObjectId((await trainingLogs.findOne(ObjectId(req.body.id))).animal))).owner) {
                res.status(500).send("Status: Invalid training log id for the current user");
                return;
            }
            trainingLogs.updateOne({'_id':ObjectId(req.body.id)}, {$set:{'trainingLogVideo':url}});
        }
        else {
            res.status(500).send("Status: Invalid id given");
            return;
        }
        fs.unlink(file.name, (err) => {
            if (err) {
                throw err;
            }
        });
        res.status(200).send('Status: OK');
        return;
    }
    catch(error) {
        if(error instanceof jsonwebtoken.JsonWebTokenError) {
            res.status(401).send('Invalid token present');
            return;
        }
        res.status(500).send('Status ' + error);
        return;
    }
})

app.listen(APP_PORT, () => {
    console.log(`api listening at http://localhost:${APP_PORT}`)
})