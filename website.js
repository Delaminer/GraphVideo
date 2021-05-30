let targetWidth = 1
let targetHeight = 1
let currentImageJob = null
let project = null

var elt = document.getElementById('calculator');
var calculator = Desmos.GraphingCalculator(elt);

let getSVGDimensions = (text) => {
    let wl = text.indexOf('width')
    let w = text.substring(wl+7, text.indexOf('pt',wl))
    let hl = text.indexOf('height')
    let h = text.substring(hl+8, text.indexOf('pt',hl))
    return [parseInt(w), parseInt(h)]
}

let getPathsFromText = (text) => {
    let paths = []
    let x = 0
    let i = text.indexOf('d="', x)
    while (i > -1) {
        x = text.indexOf("\"/>", i)
        paths.push(text.substring(i+3, x-1).replace(/\n/ig,' ')) //Get d text, replacing newlines with spaces also
        i = text.indexOf('d="', x)
    }

    //Now paths contains only the d attribute of each path. Use these strings to make a more useful data structure that can be used to create Desmos functions
    //M522 1131 c-53 -10 -98 -24 -103 -32 -5 -8 -7 -36 -3 -63 l6 -48 -59\n7 c-81 9 -97 -5 -88 -84 
    let newPaths = paths.map((path) => {
        //This processes one path string
        let commands = []
        let currentCommand = null
        let commandLength = -1
        let sets = path.split(' ')
        sets.forEach((item) => {
            //Items include: M522, 1131, c-53, 90z and so on
            if (item.search(/[a-z]/i) == 0) {
                //This item starts a new command
                if (currentCommand != null) { //End the previous command if it existed
                    commands.push(currentCommand)
                }
                currentCommand = {
                    'command': item.substring(0, 1),
                    'parameters': []
                }
                item = item.substring(1) //Remove the command from the front
                if (currentCommand.command == 'M' || currentCommand.command == 'm'|| currentCommand.command == 'l') {
                    commandLength = 2
                }
                else if (currentCommand.command == 'c') {
                    commandLength = 6
                }
                else {
                    console.log('Invalid command '+currentCommand.command)
                }
            }

            //If the current command already has enough parameters, start a new one of the same type (for repeated ones)
            if (currentCommand.parameters.length >= commandLength) {
                //Start a new one
                commands.push(currentCommand)
                currentCommand = {
                    'command': currentCommand.command,
                    'parameters': []
                }
            }

            //Add the item to the list of commands
            currentCommand.parameters.push(parseInt(item))
            
            if (item.search(/[a-z]/i) == item.length - 1) {
                //There is a command at the end of this, probably z
                commands.push(currentCommand)
                currentCommand = {
                    'command': item.substring(item.length - 1),
                    'parameters': []
                }
            }
        })
        commands.push(currentCommand)
        commands.push({
            'command': 'z',
            'parameters': []
        })

        return commands
    })

    return newPaths
}


let in_xRange;
let in_yRange;
let out_xRange;
let out_yRange;
let updateRanges = () => {
    in_xRange = [0, targetWidth * 10]
    in_yRange = [0, targetHeight * 10]
    out_xRange = [-10, 10]
    out_yRange = [-10 * targetHeight / targetWidth, 10 * targetHeight / targetWidth]
}

let map = (x, in_min, in_max, out_min, out_max) => {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
let drawLine = (x1, x2, y1, y2) => {
    //Map all SVG coordinates to graphing coordinates
    x1 = map(x1, in_xRange[0], in_xRange[1], out_xRange[0], out_xRange[1])
    x2 = map(x2, in_xRange[0], in_xRange[1], out_xRange[0], out_xRange[1])
    y1 = map(y1, in_yRange[0], in_yRange[1], out_yRange[0], out_yRange[1])
    y2 = map(y2, in_yRange[0], in_yRange[1], out_yRange[0], out_yRange[1])
    calculator.setExpression({color: Desmos.Colors.RED, latex: `y-${y2}=\\frac{${y2}-${y1}}{${x2}-${x1}}\\left(x-${x2}\\right)\\left\\{${Math.min(x1, x2)}\\le x\\le${Math.max(x1, x2)}\\right\\}`})
}
let drawCurve = (x0, y0, x1, y1, x2, y2, x3, y3,) => {
    //Map all SVG coordinates to graphing coordinates
    x0 = map(x0, in_xRange[0], in_xRange[1], out_xRange[0], out_xRange[1])
    x1 = map(x1, in_xRange[0], in_xRange[1], out_xRange[0], out_xRange[1])
    x2 = map(x2, in_xRange[0], in_xRange[1], out_xRange[0], out_xRange[1])
    x3 = map(x3, in_xRange[0], in_xRange[1], out_xRange[0], out_xRange[1])
    y0 = map(y0, in_yRange[0], in_yRange[1], out_yRange[0], out_yRange[1])
    y1 = map(y1, in_yRange[0], in_yRange[1], out_yRange[0], out_yRange[1])
    y2 = map(y2, in_yRange[0], in_yRange[1], out_yRange[0], out_yRange[1])
    y3 = map(y3, in_yRange[0], in_yRange[1], out_yRange[0], out_yRange[1])
    
    //This is the equation for a cubic bezier curve in latex
    calculator.setExpression({color: Desmos.Colors.RED, latex: `
        \\left(\\left(1-t\\right)\\left(\\left(1-t\\right)\\left(${x0}\\left(1-t\\right)+${x1}t\\right)+t\\left(${x1}\\left(1-t\\right)+${x2}t\\right)\\right)+t\\left(\\left(1-t\\right)
        \\left(${x1}\\left(1-t\\right)+${x2}t\\right)+t\\left(${x2}\\left(1-t\\right)+${x3}t\\right)\\right),\\left(1-t\\right)\\left(\\left(1-t\\right)\\left(${y0}\\left(1-t\\right)+${y1}t
        \\right)+t\\left(${y1}\\left(1-t\\right)+${y2}t\\right)\\right)+t\\left(\\left(1-t\\right)\\left(${y1}\\left(1-t\\right)+${y2}t\\right)+t\\left(${y2}\\left(1-t\\right)+${y3}t\\right)
        \\right)\\right)`})
}

let draw = (path) => {
    
    let position = [0, 0]
    let newPosition = [0, 0]
    let startingPosition = [0, 0]
    console.log(path)
    path.forEach((command, index, array) => {
        switch(command.command) {
            case 'M':
                //Move to position
                position[0] = command.parameters[0]
                position[1] = command.parameters[1]
                startingPosition = [position[0], position[1]]
                break
            case 'm':
                //Move by a certain distance
                position[0] += command.parameters[0]
                position[1] += command.parameters[1]
                startingPosition = [position[0], position[1]]
                break
            case 'l':
                //Draw a line
                newPosition = [position[0] + command.parameters[0], position[1] + command.parameters[1]]
                drawLine(position[0], newPosition[0], position[1], newPosition[1])
                position = newPosition
                break
            case 'c':
                //Draw a curve

                newPosition = [position[0] + command.parameters[4], position[1] + command.parameters[5]]
                drawCurve(
                    position[0], position[1], 
                    position[0] + command.parameters[0], position[1] + command.parameters[1], 
                    position[0] + command.parameters[2], position[1] + command.parameters[3], 
                    position[0] + command.parameters[4], position[1] + command.parameters[5], 
                    )
                //drawLine(position[0], newPosition[0], position[1], newPosition[1])
                position = newPosition
                break
            case 'z':
                //Draw a line back to the origin
                drawLine(position[0], startingPosition[0], position[1], startingPosition[1])
                position = [startingPosition[0], startingPosition[1]]
                break;
            default:
                console.log('Draw path: Unkown command '+command.command)
        }
        // if (index == 0) { //So the z function actually works
        //     startingPosition = [position[0], position[1]]
        // }
    })

}

//Run this command to render an image. Can be ran to start the process, or after one is finished to proceed with the next one.
let nextImageJob = (frame) => {
    currentImageJob.frame = frame
    if (frame != undefined && frame != null && frame > 0) //Just in case
        SVGtoDesmos(`${currentImageJob.path}/svgFrames/svg_frame${String(frame).padStart(5, '0')}.svg`)
    else
        console.log('invalid frame '+frame)
}

let saveImage = (data) => {
    if (currentImageJob == null || currentImageJob == undefined) {
        console.log('Image will not be saved as this is not a job.')
        return
    }
    //Send screenshot URI to server to save it. In the future, this will expect a response confirming it saved, so we can send them the next image.
    fetch('/createImage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            uri: data,
            baseName: currentImageJob.baseName,
            frame: currentImageJob.frame,
        })
    })
    .then(response => response.json())
    .then(data =>  {
        //Receive info on what next needs to be done
        let status = data.status //0: assigned a frame, 1: no more frames left to be assigned (kind of confusing what to do for that one), 2: we just did the final frame and the video has been made
        project = data.project

        if (status == 0) { //Assigned to a frame
            calculator.setBlank()
            console.log('Proceeding to work on frame '+data.assignedFrame)
            document.getElementById('status').textContent = 'Working on frame '+data.assignedFrame+' of '+project.frames+' for '+project.baseName
            nextImageJob(data.assignedFrame)
        }
        else if (status == 1) { //Waiting for other people to finish
            //Not sure what to do here...
            console.log('waiting for others to finish...')
        }
        else if (status == 2) { //We finished!
            console.log('We can watch the final video now! at '+data.project.finalName)
        }
    })
    .catch((error) => {
        console.error('Error:', error)
    })
}

let SVGtoDesmos = (svgFileName) => {
    let file = new XMLHttpRequest();
    file.open("GET", svgFileName, false);
    file.onreadystatechange = function ()
    {
        if(file.readyState === 4)
        {
            if(file.status === 200 || file.status == 0)
            {
                let allText = file.responseText;
                let dimensions = getSVGDimensions(allText)
                targetWidth = dimensions[0]
                targetHeight = dimensions[1]
                updateRanges()

                let paths = getPathsFromText(allText)
                paths.forEach((v) => {
                    draw(v)
                })

                calculator.asyncScreenshot(
                    {
                    mode: 'preserveX',
                    width: targetWidth*4,
                    height: targetHeight*4,
                    mathBounds: { left: -10, right: 10 }
                }, 
                saveImage);
            }
        }
    }
    file.send(null);
}

// SVGtoDesmos('svgFrames/svg_out-'+String(svgIndex).padStart(5, '0')+'.svg')

document.getElementById('useFile').onclick = () => {
    //Use file to create a video!
    let files = document.getElementById('videoUpload').files
    if (files.length > 0) { //There must be a file...

        //Create a form to be sent
        let form = new FormData()
        form.append('video', files[0]) //Only using the first file

        //Upload it
        fetch('/uploadVideo', {
            method: 'POST',
            body: form
        })
        .then(response => response.json())
        .then(data => {
            console.log(data)

            //The data has been processed, starting work now...
            currentImageJob = {
                baseName: data.name,
                path: data.path,
                frame: data.assignedFrame
            }
            project = data.project

            document.getElementById('status').textContent = 'Starting to work! Frame '+data.assignedFrame+' of '+project.frames+' for '+project.baseName

            //Old job system:
            // // Add jobs. If there are 0 workers, do all of them. If 1, do every other, and so on.
            // for(let i = 1; i <= frames; i += workers + 1) {
            //     // jobs.push(`${path}/svgFrames/svg_frame${String(i).padStart(5, '0')}.svg`)
            //     jobs.push({ baseName: name, path: path, frame: i, svgFile: `${path}/svgFrames/svg_frame${String(i).padStart(5, '0')}.svg` })
            // }

            //Start working!
            nextImageJob(data.assignedFrame)

        })
        .catch(error => {
            console.log(error)
        })
    }
}

// SVGtoDesmos('zTest.svg')
// SVGtoDesmos('uploads/ba/svgFrames/svg_frame00175.svg')



/**
 * 
 * UI and stuff
 * 
 * Stuff down here is for managing the client
 * Includes signin, viewing other creations, uploading? etc...
 * 
 */

document.getElementById('signin-form-button').onclick = () => {
    document.getElementById('project-page').style.display = 'block'
    document.getElementById('signin-page').style.display = 'none'
}