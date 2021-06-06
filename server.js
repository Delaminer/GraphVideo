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
    fs.writeFile("database.db", encryptedDatabase, function(err) {
        if (err) {
            console.log("Unable to save database: "+err)
        }
    })
}
//Load database
fs.readFile("./database.db", 'utf8', (error, data) => {
    if (error) {
        console.log("No saved database found.")
        saveDatabase() //Create a blank file
    }
    else {
        console.log("Using saved database.")
        //Decrypt the data
        data  = CryptoJS.AES.decrypt(data, process.env.encrypt_key).toString(CryptoJS.enc.Utf8) 
        try {
            data = JSON.parse(data)
            database = data //No arrays are in the database right now (only objects), so their prototypes don't need to be manually edited, allowing this easy assignment to be used.
        }
        catch(error) {
            console.log('Not using saved database.')
            saveDatabase()
        }
    }
})

let validUser = (email, password) => {
    let existingUser = database.users[email]
    if (existingUser != undefined && existingUser != null) { //Check if it actually exists
        return password == existingUser.password
    }
    return false
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
// transporter.sendMail(mailOptions, function(error, info){
//   if (error) {
//     console.log(error)
//   } else {
//     console.log('Email sent: ' + info.response)
//   }
// })
let sendConfirmationEmail = (user) => {
    mailOptions.to = user.email
    mailOptions.text = `Thank you ${user.username} for signing up for GraphVideo. Please enter the code ${user.code} on the website to verify your email address (${user.email}). Thank you.`
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error)
      } else {
        console.log('Email sent: ' + info.response)
      }
    })
}

app.use(express.json({ limit: '50mb', extended: true }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(fileUpload())

app.use((req, res) => {
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
    else if (req.method.toUpperCase() == 'POST') {
        if (req.url == '/createImage') {
            let uri = req.body.uri
            //Save the image locally
            let buffer = Buffer.from(uri.split(",")[1], 'base64')
            // fs.writeFileSync(`uploads/${req.body.baseName}/finalFrames/final_frame${String(req.body.frame).padStart(5, '0')}.png`, buffer
            fs.writeFile(`uploads/${req.body.baseName}/finalFrames/final_frame${String(req.body.frame).padStart(5, '0')}.png`, buffer, error => {
                if (error)  { 
                    console.log('could not create file')
                    console.log(error)
                    res.writeHead(500, {
                        'Content-Type': 'application/json'
                    })
                    return res.end(JSON.stringify({ code: 'Could not create file' }))
                 };
                

                console.log(`Saved frame ${req.body.frame} of ${req.body.baseName}.`)

                //Creating a local project variable to help shorten variable names
                project = database.projects[req.body.baseName]

                //Update the database so this one is no longer needed
                project.todo[req.body.frame] = 2
                
                //Check if there is another
                complete = 2 //2 = complete, 1 = not complete but all the frames left are already assigned, 0 = not complete, you will be assigned a frame to work on
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
                    console.log(`Project ${project.baseName} completed, creating final video file...`)
                    console.log(`ffmpeg -r ${project.fps} -f image2 -s ${project.resolution} -i uploads/${project.baseName}/finalFrames/final_frame%05d.png -i uploads/${project.baseName}/${project.fileName} -map 0:0 -map 1:1 -shortest -vcodec libx264 -crf 25 -pix_fmt yuv420p uploads/${project.baseName}/final_${project.fileName}`)
                    exec(`ffmpeg -r ${project.fps} -f image2 -s ${project.resolution} -i uploads/${project.baseName}/finalFrames/final_frame%05d.png -i uploads/${project.baseName}/${project.fileName} -map 0:0 -map 1:1 -shortest -vcodec libx264 -crf 25 -pix_fmt yuv420p uploads/${project.baseName}/final_${project.fileName}`, (error, stdout, stderr) => {
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

        }
        else if (req.url == '/uploadVideo') {
            //Upload video, then process and send back svg data? (something like that)
            let fileName = req.files.video.name
            let baseName = fileName.substring(0, fileName.indexOf('.'))
            let folderName = __dirname + '/uploads/'+baseName

            //Create a new folder for this video and its project
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

            let path = folderName + '/' + fileName

            //Move the file to a local path
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
                //Success uploading, now let's do our magic on it and send back the SVGs

                exec(`ffmpeg -i uploads/${baseName}/${fileName} uploads/${baseName}/frames/frame%05d.jpg`, (error, stdout, stderr) => {
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

                    //We are going to assume it worked. Now make the edited and svg frames
                    exec(`python editAllFrames.py /uploads/${baseName} frame`, (py_error, py_stdout, py_stderr) => {
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
                            database.projects[baseName] = {
                                baseName: baseName,
                                fileName: fileName,
                                frames: frames,
                                fps: -1,
                                resolution: -1,
                                finished: false,
                                todo: {}
                            }
                            //Add todo frames (all of them)
                            for(let i = 1; i <= frames; i++) {
                                database.projects[baseName].todo[i] = 0 //0 = not done, 1 = assigned, 2 = complete
                            }
                            let initialAssignedFrame = 1 //So it can be changed dynamically, but normally just assign the first one
                            database.projects[baseName].todo[initialAssignedFrame] = 1 //Assign the frame


                            //Use ffprobe to get info about the file (framerate and resolution) for final video creation after all frames have been rendered
                            //After that, save.
                            exec(`ffprobe uploads/${baseName}/${fileName} -hide_banner`, (fp_error, fp_stdout, fp_stderr) => {
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
                            
                                database.projects[baseName].fps = fpsLine.split(' ')[1]
                                database.projects[baseName].resolution = resolutionLine.split(' ')[1]

                                
                                saveDatabase() //Save the added project
                            })


                            console.log('PYTHON finished, all images/SVGs are ready to be processed, sending status back to client...')
                            res.writeHead(201, {
                                'Content-Type': 'application/json'
                            })
                            res.end(JSON.stringify({ status: 'success', name: baseName, frames: frames, assignedFrame: initialAssignedFrame, path: `uploads/${baseName}`, workers: 0, project: database.projects[baseName] }))
                        }
                        else {
                            //An error occurred, return an error message
                            res.writeHead(500, {
                                'Content-Type': 'application/json'
                            })
                            res.end(JSON.stringify({ status: 'error', source: 'PYTHON2', message: py_stdout }))
                        }
                    })
                })
            })
        }
        else if (req.url == '/signin') {
            console.log('signin from '+JSON.stringify(req.body))

            // Sign-in is pretty straightforward. 
            // Credentials are used for every API call, so signing it doesn't actually do anything, 
            // it just validates the current credentials are correct, so it will use these for all future API calls.

            // The validUser method here will be used in all other API calls
            if (validUser(req.body.email, req.body.password)) {
                res.writeHead(200, {
                    'Content-Type': 'application/json'
                })
                res.end(JSON.stringify({
                    success: true,
                    email: req.body.email,
                    username: database.users[req.body.email].username,
                    password: req.body.password,
                    verified: database.users[req.body.email].verified
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
        }
        else if (req.url == '/register') {
            console.log('resgister from '+JSON.stringify(req.body))

            //Make sure it is valid
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
                        code: Math.random().toString(36).substring(7).toUpperCase()
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
            else {
                //Invalid info
                res.writeHead(200, {
                    'Content-Type': 'application/json'
                })
                res.end(JSON.stringify({
                    success: false,
                    error: 2 //Invalid
                }))
            }
        }
    }
    else {
        console.log('uknown method '+req.method)
        res.writeHead(400, {
            'Content-Type': 'application/json'
        })
        return res.end(JSON.stringify({error: 'Unkown or unsupported method'}))
    }
})

app.listen(3000, () => {
  console.log('listening on *:3000')
})