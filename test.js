// const { exec } = require("child_process");

// let cmd = ''
// cmd = 'ffprobe .\\uploads\\ba_Trim_Trim\\ba_Trim_Trim.mp4 -hide_banner'
// cmd = 'ffprobe abv.mp4 -hide_banner'

// exec(cmd, (error, stdout, stderror) => {
//     // console.log(`Error: ${error}!`)
//     // console.log(`STD Error: ${stderror}!`)
//     // console.log(`STD Out: ${stdout}!`)

//     //Split lines:
//     let lines = stderror.split('\n')
//     let streamLine
//     for(l in lines) {
//         if (lines[l].includes('Stream #0')) {
//             streamLine = lines[l]
//             console.log(streamLine)
//             break
//         }

//     }

//     let info = streamLine.split(',')
//     let fpsLine = info[4]
//     let resolutionLine = info[2]

//     let fps = fpsLine.split(' ')[1]
//     let resolution = resoLine.split(' ')[1]

// })

// let i = {
//     a: 1,
//     b: 2,
//     c: {
//         x: 'xx',
//         y: 'yy'
//     }
// }
// let test = i.c
// test.x = 'gg'
// console.log(test.x)
// console.log(i.c.x)
require('dotenv').config()
// console.log(process.env.email)
const fs = require('fs')

var CryptoJS = require("crypto-js")
 
// var ciphertext = CryptoJS.AES.encrypt('my message', process.env.encrypt_key).toString()
// console.log(ciphertext)
// fs.writeFile("secret.json", ciphertext, function(err) {
//     if (err) {
//         console.log("Unable to save database: "+err)
//     }
// })


// var originalText  = CryptoJS.AES.decrypt(ciphertext, process.env.encrypt_key).toString(CryptoJS.enc.Utf8) 
// console.log(originalText)

fs.readFile("./secret.json", 'utf8', (error, data) => {
    if (error) {
        console.log("No saved database found.")
        return
    }
    var originalText  = CryptoJS.AES.decrypt(data, process.env.encrypt_key).toString(CryptoJS.enc.Utf8) 
    console.log(originalText)
})