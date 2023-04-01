## Introduction
My name is Avaye Dawadi and I am a CS major at Georgia Tech. For this dev assessment I completed all parts of the assessment (from easy to expert). Thank you!

## Project Details

**MongoDB**
I used MongoDB on this project. Specifically, I used MongoDB Atlas to store the database on the cloud.

**Cloudinary**
For the expert part of the project, I used a cloud storage provider called Cloudinary that stores the images and videos and returns a URL to store this data. I am on the free plan for this.

**.env File**
I have the DATABASE_URI for MongoDB and the JWT_STRING in my .env file. I also have the Cloudinary API keys in the .env file. If you would like to run my project, please email me at adawadi6@gatech.edu for the .env file. I do not wish to post it publicly for safety concerns.

## API Endpoints

`/api/health`
- GET
- Sample request to test if API server is working

`/api/user`
- POST `{"email":"test@example.com", "firstName":"Avaye", "lastName":"Dawadi", "password":"examplePassword"}`
- Creates a new user 
- Uses encryption and hashing to hash the password before it is stored in the database
- Email is checked using regex to make sure it is a valid email

`/api/animals`
- POST `{"name": "Bob", "hoursTrained":6, dateOfBirth:"1-1-2019"`
- Creates a new animal

`/api/training`
- POST `{"date":"1-1-2023", "description": "Example description", "hours":5, "animal":"animalObjectId", "user":"userObjectId"}`
- Creates a new training long in the database

`/api/admin/users`
- GET `{"pageSize": 5, "pageNumber": 2}`
- Gets a list of users from the database (gets users based on number of pages of users and number of users per page using pagination)

`/api/admin/animals`
- GET `{"pageSize": 5, "pageNumber": 2}`
- Gets a list of animals from the database (gets animals based on number of pages of users and number of users per page using pagination)

`/api/admin/training`
- GET `{"pageSize": 5, "pageNumber": 2}`
- Gets a list of training logs from the database (gets training logs based on number of pages of users and number of users per page using pagination)

`/api/user/login`
- POST `{"email": "test@example.com", "password":"examplePassword"`
- Tests whether the email and password combo that the user inputs is valid
- Checks the plain text password versus the hash in the database

`/api/user/verify`
- POST `{"email": "test@example.com", "password":"examplePassword"`
- If the email and password combo is valid, a Json Web Token (JWT) with a 300 second expiry is issues into the cookies of the user
- Endpoints use the JWT to validate if the user is logged in and when possible, information is pulled from the JWT encoding

`/api/file/upload`
- POST `{file:exampleImgOrVideo,"fileType":"user", "id":"exampleObjectId"}`
- id only needs to be inputted for file types "animal" and "trainingLog." For users, information is pulled from the JWT
- Validation is done for the animal and trainingLog to make sure that the user (based on the JWT) is the "owner" of the animal and trainingLog in the database



