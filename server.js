const express = require('express')
const app = express()
const fs = require('fs')
const fileUpload = require('express-fileupload')
const { exec } = require("child_process")
require('dotenv').config()
const nodemailer = require('nodemailer')
const CryptoJS = require("crypto-js")

//Helper function to create random string (for folder names and confirmation codes)
let randomString = (length) => {
    return Array(length).fill(0).map(x => Math.random().toString(36).charAt(2)).join('')
}

let database = {
    projects: {},
    users: {}
}

//Creates a nonencrypted database.json file as well as the encrypted database.db file, so the data can be examined for development/debugging
let debugDatabase = true

//Function to save the database whenever
let saveDatabase = () => {
    //Decrypt the data
    let encryptedDatabase = CryptoJS.AES.encrypt(JSON.stringify(database), process.env.encrypt_key).toString()
    fs.writeFile('database.db', encryptedDatabase, function(err) {
        if (err) {
            console.log('Unable to save database: ' + err)
        }
    })
    if (debugDatabase) {
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
            let overrideData = false
            if (overrideData) {
                fs.readFile('database.json', 'utf8', (error, jsonData) => {
                    if (!error) {
                        try {
                            database = JSON.parse(jsonData)
                            saveDatabase()
                            return
                        }
                        catch(error) { }
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

let validUser = (email, password, mustBeVerified) => {
    let existingUser = database.users[email]
    if (existingUser != undefined && existingUser != null) { //Check if it actually exists
        return (password == existingUser.password) && (!mustBeVerified || existingUser.verified)
    }
    return false
}

let getUserName = (email) => {
    let user = database.users[email]
    if (user != null && user != undefined) return user.username
    return undefined
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.email,
        pass: process.env.password
    }
})
let mailOptions = {
    from: process.env.email,
    to: 'email@email.com',
    subject: 'GraphVideo Confirmation Email',
    text: 'Thank you for signing up.'
}
let sendConfirmationEmail = (user) => {
    mailOptions.to = user.email
    mailOptions.subject = 'GraphVideo Confirmation Email'
    mailOptions.text = `Thank you ${user.username} for signing up for GraphVideo. Please enter the code ${user.code} on the website to verify your email address (${user.email}). Thank you.`
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error)
      } else {
        console.log('Confirmation email (' + user.email + ') sent: ' + info.response)
      }
    })
}
let sendForgotPasswordEmail = (user) => {
    mailOptions.to = user.email
    mailOptions.subject = 'Forgot GraphVideo Password'
    mailOptions.text = `${user.username}, your password for GraphVideo is ${user.password}.`
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error)
      } else {
        console.log('Forgot password email (' + user.email + ') sent: ' + info.response)
      }
    })
}

app.use(express.json({ limit: '50mb', extended: true }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(fileUpload())

let load = (file, req, res) => {
    fs.readFile(file, function(err, data) {
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/html'})
            return res.end("404 error: file not found")
        }
        res.writeHead(200, {'Content-Type':'text/html'})
        res.write(data)
        return res.end()
    })
}

app.get('/', (req, res) => {
    return load('./community.html', req, res)
})

app.get('/signin', (req, res) => {
    return load('./signin.html', req, res)
})
app.get('/project', (req, res) => {
    return load('./project.html', req, res)
})
app.get('/community', (req, res) => {
    return load('./community.html', req, res)
})
app.get('/myprojects', (req, res) => {
    return load('./myprojects.html', req, res)
})

app.get('/login', (req, res) => {
    let credentials = JSON.parse(req.headers.credentials)
    if (validUser(credentials.email, credentials.password, false)) {
        res.writeHead(200, {
            'Content-Type': 'application/json'
        })
        res.end(JSON.stringify({
            success: true,
            email: credentials.email,
            username: database.users[credentials.email].username,
            password: credentials.password,
            verified: database.users[credentials.email].verified
        }))
    }
    else {
        res.writeHead(200, {
            'Content-Type': 'application/json'
        })
        res.end(JSON.stringify({
            success: false,
        }))
    }
})

app.get('/projects', (req, res) => {
    //Return info about projects.
    //This request does not require credentials

    res.writeHead(200, {
        'Content-Type': 'application/json'
    })
    return res.end(JSON.stringify({projects: database.projects}))
})

app.get('/user', (req, res) => {
    //Get info about yourself (used in MyProjects)
    //This does require credentials
    let credentials = JSON.parse(req.headers.credentials)
    if (validUser(credentials.email, credentials.password, true)) {
        let user = database.users[credentials.email]
        let projects = []
        for(let i in database.projects) {
            let project = database.projects[i]
            if (project.creator != undefined && project.creator == user.username) {
                //This user created it
                projects.push(project)
            }
        }
        res.writeHead(200, {
            'Content-Type': 'application/json'
        })
        res.end(JSON.stringify({
            success: true,
            username: user.username,
            projects: projects
        }))
    }
    else {
        res.writeHead(200, {
            'Content-Type': 'application/json'
        })
        res.end(JSON.stringify({
            success: false,
        }))
    }
})

app.post('/register', (req, res) => {
    let valid = true
    if (req.body.email.length == 0) valid = false
    if (req.body.username.length == 0) valid = false
    if (req.body.password.length == 0) valid = false

    if (valid) {
        //Find if a user exists (by email, people can have the same username, which might be removed later)
        let existingUser = database.users[req.body.email]
        if (existingUser == undefined || existingUser == null) {
            //No existing user! Create the account
            database.users[req.body.email] = {
                username: req.body.username,
                email: req.body.email,
                password: req.body.password,
                verified: false,
                code: randomString(6).toUpperCase()
            }
            saveDatabase()
            sendConfirmationEmail(database.users[req.body.email])
            res.writeHead(200, {
                'Content-Type': 'application/json'
            })
            res.end(JSON.stringify({
                success: true,
                email: req.body.email,
                username: req.body.username,
                password: req.body.password,
                verified: false
            }))
        }
        else {
            //Account is already taken
            res.writeHead(200, {
                'Content-Type': 'application/json'
            })
            res.end(JSON.stringify({
                success: false,
                error: 1 //Account taken
            }))
        }
    }
})

app.post('/verify', (req, res) => {
    let credentials = JSON.parse(req.headers.credentials)
    let user = database.users[credentials.email]
    if (user.code.toUpperCase() == req.body.code.toUpperCase()) {
        //Correct code
        user.verified = true
        saveDatabase()
        res.writeHead(200, {
            'Content-Type': 'application/json'
        })
        res.end(JSON.stringify({
            success: true,
        }))
    }
    else {
        res.writeHead(200, {
            'Content-Type': 'application/json'
        })
        res.end(JSON.stringify({
            success: false,
        }))
    }
})

app.get('/verifyEmail', (req, res) => {
    let credentials = JSON.parse(req.headers.credentials)
    if (validUser(credentials.email, credentials.password, false)) {
        sendConfirmationEmail(database.users[credentials.email])
        res.writeHead(200, {
            'Content-Type': 'application/json'
        })
        res.end(JSON.stringify({
            success: true,
        }))
    }
    else {
        res.writeHead(200, {
            'Content-Type': 'application/json'
        })
        res.end(JSON.stringify({
            success: false,
        }))
    }
})

// app.get('/forgotPassword', (req, res) => {
//     let credentials = JSON.parse(req.headers.credentials)
//     let existingUser = database.users[credentials.email]
//     if (existingUser != undefined && existingUser != null) {
//         //The user does exist, send them an email
//         sendForgotPasswordEmail(existingUser)
//         res.writeHead(200, {
//             'Content-Type': 'application/json'
//         })
//         res.end(JSON.stringify({
//             success: true,
//         }))
//     }
//     else {
//         //No user found
//         res.writeHead(200, {
//             'Content-Type': 'application/json'
//         })
//         res.end(JSON.stringify({
//             success: false,
//             error: 1 //No user found
//         }))
//     }
// })

app.get('/job', (req, res) => {
    let credentials = JSON.parse(req.headers.credentials)
    if (validUser(credentials.email, credentials.password, true)) {
        //Get the name of the project the user sent
        let projectName = req.headers.project
        //Get the project
        let project = database.projects[projectName]

        //Assign them a frame! This code is pretty much a copy-paste from /video and /image
        let message = {
            complete: 2,
            project: project
        }

        //If the project is finished, there is no point looking for a frame to assign because there are none.
        if (!project.finished) {
            message.assignedFrame = -1
            for(let f in project.todo) {
                if (project.todo[f] == 0) {
                    message.complete = 0
                    message.assignedFrame = f
                    break
                }
                else if (project.todo[f] == 1) {
                    message.complete = 1
                    //We cannot assign the frame to this one, but we know it is not complete. Let's keep looping to find an unassigned incomplete frame.
                }
            }
        }

        res.writeHead(200, {
            'Content-Type': 'application/json'
        })
        res.end(JSON.stringify({ 
            success: true,
            message: message,
            name: projectName,
            assignedFrame: message.assignedFrame,
            path: `uploads/${project.folderBaseName}`,
            workers: 0,
            project: project
        }))
    }
    else {
        res.writeHead(200, {
            'Content-Type': 'application/json'
        })
        res.end(JSON.stringify({ 
            success: false,
            name: projectName,
            assignedFrame: initialAssignedFrame,
            path: `uploads/${project.folderBaseName}`,
            workers: 0,
            project: project
        }))
    }
})

//Upload video, then process and send back information and assign a frame to user
app.post('/video', (req, res) => {
    //Check credentials first
    let credentials = JSON.parse(req.headers.credentials)
    if (!validUser(credentials.email, credentials.password, true)) {
        res.writeHead(403, {
            'Content-Type': 'application/json'
        })
        return res.end(JSON.stringify({ code: 'Invalid credentials' }))
    }
    let creator = getUserName(credentials.email)

    //Name of the video file
    let fileName = req.files.video.name
    //Name of the project (as determined by the user)
    let projectName = req.body.projectName
    //Name of the folder this data is stored in
    let folderBaseName = randomString(10) //Use a random string, not whatever they provide (could be dangerous!)
    //Directory of the folder
    let folderName = __dirname + '/uploads/' + folderBaseName

    //Begin by creating a new folder for this video and its project
    try {
        let folders = [
            folderName, //Base folder
            folderName + '/frames', //Frames extracted by ffmpeg
            folderName + '/editedFrames', //Frames edited to show only edges made with python + opencv
            folderName + '/svgFrames', //Frames in SVG form from potrace
            folderName + '/finalFrames'//Final graph frames made by client's desmos program, ready to be combined with ffmpeg
        ]
        folders.forEach(folder => {
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder)
            }
        })
    } catch (error) {
        console.error(error)
    }

    //Path to the video file
    let path = folderName + '/' + fileName

    //Move the file to a local path on the server
    req.files.video.mv(path, error => {
        if (error) {
            console.error(error)
            //Could not upload file
            res.writeHead(500, {
                'Content-Type': 'application/json'
            })
            res.end(JSON.stringify({ status: 'error', source: 'express-fileupload', message: error }))
            return
        }
        //Success uploading, now let's do our magic on it (ffmpeg/opencv-python/potrace) and send back the SVGs

        //FFMPEG begins by turning the video into individual frames
        exec(`ffmpeg -i "uploads/${folderBaseName}/${fileName}" -vf scale=192:144 "uploads/${folderBaseName}/frames/frame%05d.jpg"`, (error, stdout, stderr) => {
            if (error) {
                console.log(`FFMPEG-extract error: ${error.message}`)
                res.writeHead(500, {
                    'Content-Type': 'application/json'
                })
                res.end(JSON.stringify({ status: 'error', source: 'FFMPEG-extract', message: error.message }))
                return
            }
            console.log(`FFMPEG-extract stderr: ${stderr}`)
            console.log(`FFMPEG-extract stdout: ${stdout}`)
            console.log('FFMPEG-extract finished, now running PYTHON...')

            //We are going to assume it worked. Now make the vision-edited and svg frames using the python script editAllFrames.py
            exec(`python editAllFrames.py /uploads/${folderBaseName} frame`, (py_error, py_stdout, py_stderr) => {
                if (error) {
                    console.log(`PYTHON error: ${py_error.message}`)
                    res.writeHead(500, {
                        'Content-Type': 'application/json'
                    })
                    res.end(JSON.stringify({ status: 'error', source: 'PYTHON1', message: py_error.message }))
                    return
                }
                console.log(`PYTHON stderr: ${py_stderr}`)
                console.log(`PYTHON stdout: ${py_stdout}`)

                if (py_stdout.indexOf('editAllFrames.py finished, frames: ') != -1) {
                    //The python script worked. Get the number of frames, and respond to the client with a success

                    let frames = parseInt(py_stdout.substring(35))

                    //Create an entry for this process.
                    database.projects[projectName] = {
                        projectName: projectName,
                        creator: creator,
                        fileName: fileName,
                        folderBaseName: folderBaseName,
                        frames: frames,
                        fps: -1,
                        resolution: -1,
                        finished: false,
                        todo: {}
                    }
                    //Add todo frames (all of them). Todo indices start at 1, for ease of reading
                    for(let i = 1; i <= frames; i++) {
                        database.projects[projectName].todo[i] = 0 //0 = not done, 1 = assigned, 2 = complete
                    }
                    let initialAssignedFrame = 1 //So it can be changed dynamically, but normally just assign the first one
                    database.projects[projectName].todo[initialAssignedFrame] = 1 //Assign the frame


                    //Use ffprobe to get info about the file (framerate and resolution) for final video creation 
                    //  after all frames have been rendered. After that, save.
                    exec(`ffprobe "uploads/${folderBaseName}/${fileName}" -hide_banner`, (fp_error, fp_stdout, fp_stderr) => {
                        let lines = fp_stderr.split('\n')
                        let streamLine
                        for(l in lines) {
                            if (lines[l].includes('Stream #0')) {
                                streamLine = lines[l]
                                break
                            }
                        }
                    
                        let info = streamLine.split(',')
                        let fpsLine = info[4]
                        let resolutionLine = info[2]
                    
                        database.projects[projectName].fps = fpsLine.split(' ')[1]
                        database.projects[projectName].resolution = resolutionLine.split(' ')[1]
                        database.projects[projectName].resolution = '192x144'

                        
                        saveDatabase() //Save the added project
                    })


                    console.log('PYTHON finished, all images/SVGs are ready to be processed, sending status back to client...')
                    res.writeHead(201, {
                        'Content-Type': 'application/json'
                    })
                    
                    res.end(JSON.stringify({ 
                        status: 'success', 
                        name: projectName, 
                        assignedFrame: initialAssignedFrame, 
                        path: `uploads/${folderBaseName}`, 
                        workers: 0, 
                        project: database.projects[projectName] 
                    }))
                }
                else {
                    //An error occurred with the python script, return an error message
                    res.writeHead(500, {
                        'Content-Type': 'application/json'
                    })
                    res.end(JSON.stringify({ status: 'error', source: 'PYTHON2', message: py_stdout }))
                }
            })
        })
    })
})

//Upload a single image from a job rendering a video
app.post('/image', (req, res) => {
    //Check credentials first
    let credentials = JSON.parse(req.headers.credentials)
    if (!validUser(credentials.email, credentials.password, true)) {
        res.writeHead(403, {
            'Content-Type': 'application/json'
        })
        return res.end(JSON.stringify({ code: 'Invalid credentials' }))
    }

    //Save the image locally
    let buffer = Buffer.from(req.body.uri.split(",")[1], 'base64')
    fs.writeFile(`uploads/${req.body.folderBaseName}/finalFrames/final_frame${String(req.body.frame).padStart(5, '0')}.png`, buffer, error => {
        if (error)  { //Error when creating the file. Usually this occurs if the directory is bad (at least during development)
            console.log('Could not create image file.')
            console.log(error)
            res.writeHead(500, {
                'Content-Type': 'application/json'
            })
            return res.end(JSON.stringify({ code: 'Could not create image file' }))
        };
        
        console.log(`Saved frame ${req.body.frame} of ${req.body.projectName}.`)

        //Creating a local project variable to help shorten variable names
        project = database.projects[req.body.projectName]

        //Update the database so this one is no longer needed
        project.todo[req.body.frame] = 2
        
        //Check if there is another
        //2 = complete, 
        //1 = not complete but all the frames left are already assigned (hopefully never occurs),
        //0 = not complete, you will be assigned a frame to work on
        complete = 2
        assignedFrame = -1
        for(let f in project.todo) {
            if (project.todo[f] == 0) {
                complete = 0
                assignedFrame = f
                break
            }
            else if (project.todo[f] == 1) {
                complete = 1
                //We cannot assign the frame to this one, but we know it is not complete. Let's keep looping to find an unassigned incomplete frame.
            }
        }
        let message = {
            status: complete,
            assignedFrame: -1,
            project: project
        }
        if (complete == 0) {
            //Assign the frame
            project.todo[assignedFrame] = 1
            message.assignedFrame = assignedFrame
        }
        if (complete == 2) {
            //Complete some extra steps to finish the video
            //Use FFMPEG to combine the final frames and the audio of the original source
            console.log(`Project ${project.projectName} completed, creating final video file...`)
            let command = `ffmpeg -r ${project.fps} -f image2 -s ${project.resolution} -i "uploads/${project.folderBaseName}/finalFrames/final_frame%05d.png" -i "uploads/${project.folderBaseName}/${project.fileName}" -map 0:0 -map 1:1 -shortest -vcodec libx264 -crf 25 -pix_fmt yuv420p "uploads/${project.folderBaseName}/final_${project.fileName}"`
            console.log(command)
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.log(`FFMPEG-build error: ${error.message}`)
                    res.writeHead(500, {
                        'Content-Type': 'application/json'
                    })
                    res.end(JSON.stringify({ status: 'error', source: 'FFMPEG-build', message: error.message, status: message }))
                    return
                }
                console.log(`FFMPEG-build stderr: ${stderr}`)
                console.log(`FFMPEG-build stdout: ${stdout}`)
                console.log(`Project ${project.projectName} finished.`)

                //Video has been finished!
                project.finalName = 'final_'+project.fileName
                project.finished = true
                saveDatabase()

                res.writeHead(201, {
                    'Content-Type': 'application/json'
                })
                return res.end(JSON.stringify(message))
            })
        }
        else {
            saveDatabase()
            res.writeHead(201, {
                'Content-Type': 'application/json'
            })
            return res.end(JSON.stringify(message))
        }
    })
})

app.use((req, res) => {
    //This is only for returning files
    if (req.method.toUpperCase() == 'GET') {
        req.url = req.url.replace(/%20/g,' ')
        fs.readFile("." + req.url, function(err, data) {
            if (err) {
                res.writeHead(404, {'Content-Type': 'text/html'})
                return res.end("404 error: file not found")
            }
            let type = 'html'
            if (req.url.includes('css'))
                type = 'css'
            res.writeHead(200, {'Content-Type':'text/'+type})
            res.write(data)
            return res.end()
        })
    }
    else {
        console.log('uknown method '+req.method)
        res.writeHead(400, {
            'Content-Type': 'application/json'
        })
        return res.end(JSON.stringify({error: 'Unkown or unsupported method'}))
    }
})

let port = 80
app.listen(port, () => {
  console.log('listening on *:'+port)
})