# bork-backend
Backend server for the bork project

Welcome to the readme!

## Installation Instructions
### Requirements
 - MongoDB 2.2 or later
 - MongoDB Compass (recommended)
 - git
 - Node JS & NPM
 - A linux terminal or Cgywin installation to run it from.

To start, clone the repo into a new folder:

    git clone https://github.com/jamjar919/bork-backend.git

...or download it as a zip and extract all the files. You will need to have a MongoDB instance running on localhost:27017. Installation instructions for MongoDB can be found here: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/. When running the database, if you want to use the project directory as the database store, then select the `/db/config.cfg` file in the project as your config file when installing. You will need to change the paths in this file so they line up with the paths on your system.

Then, cd into the working directory for the project. Run the command:

    npm install

To install the packages required. Then run the command:

    npm start

To run the start script. You can then make requests to the server!

### Troubleshooting

#### "MongoDB Connection Error, promise not handled" 
You didn't start MongoDB, or it's not running on the default settings. Try connecting with MongoDB compass and if you can't then that's the problem.