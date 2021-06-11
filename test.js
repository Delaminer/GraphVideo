const express = require('express')
const app = express()
const fs = require('fs')
const fileUpload = require('express-fileupload')
const { exec } = require("child_process")
require('dotenv').config()
const nodemailer = require('nodemailer')
const CryptoJS = require("crypto-js")


let database = {
    projects: {},
    users: {}
}

//Function to save the database whenever
let saveDatabase = () => {
    //Decrypt the data
    let encryptedDatabase = CryptoJS.AES.encrypt(JSON.stringify(database), process.env.encrypt_key).toString()
    fs.writeFile('database.db', encryptedDatabase, function(err) {
        if (err) {
            console.log('Unable to save database: ' + err)
        }
    })
    if (true) {
        fs.writeFile('database.json', JSON.stringify(database, null, 4), function(err) {
            if (err) {
                console.log('Unable to save JSON database: '+err)
            }
        })
    }
}
//Load database
fs.readFile('database.db', 'utf8', (error, data) => {
    if (error) {
        console.log('No saved database found. Creating a new one.')
        saveDatabase() //Create a blank file
    }
    else {
        console.log('Using saved database.')
        //Decrypt the data
        data  = CryptoJS.AES.decrypt(data, process.env.encrypt_key).toString(CryptoJS.enc.Utf8) 
        try {
            data = JSON.parse(data)
            database = data //No arrays are in the database right now (only objects), so their prototypes don't need to be manually edited, allowing this easy assignment to be used.
        
            //Helper tool: clears projects from database while keeping users
            let deleteProjects = false
            if (deleteProjects) {
                database.projects = {}
                saveDatabase()
            }

            //Helper tool: overwrites encrypted data with modifiable JSON data
            let overrideData = true
            if (overrideData) {
                fs.readFile('database.json', 'utf8', (error, jsonData) => {
                    if (!error) {
                        try {
                            database = JSON.parse(jsonData)
                            saveDatabase()
                            return
                        }
                        catch(error) { 
                            console.log(error)
                        }
                    }
                    console.log('Failed to overwrite database with JSON data.')
                })
            }
        }
        catch(error) {
            console.log('Database is corrupt, overwriting...')
            saveDatabase() //Overwrite with a blank database
        }
    }
})