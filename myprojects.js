let clickElement = document.createElement('a')
let redirect = (location) => {
    clickElement.href = location
    clickElement.click()
}

//Save login in a global variable so they can be easily used
let signIn = () => {
    USER_NAME = localStorage.getItem('username')
    USER_EMAIL = localStorage.getItem('email')
    USER_PASSWORD = localStorage.getItem('password')
}
signIn()

/**
 * 
 * UI Stuff
 * 
 */

//Start a project button
document.getElementById('goto-project').onclick = () => {
    redirect('/project')
}
//Back to Community button
document.getElementById('goto-community').onclick = () => {
    redirect('/')
}


//Sign out button
document.getElementById('goto-signout').onclick = () => {
    //Clear global signin variables
    USER_NAME = null
    USER_EMAIL = null
    USER_PASSWORD = null
    //Clear local-save signin variables
    localStorage.setItem('username', '')
    localStorage.setItem('email', '')
    localStorage.setItem('password', '')

    redirect('/signin')
}

document.getElementById('myprojects-welcome').textContent = 'Welcome, ' + USER_NAME + '!'

//Get list of projects
fetch('/user', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'credentials': JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD })
    }
})
.then(response => response.json())
.then(data =>  {
    //Display the information received

    //Parent element this data will be presented on
    let parent = document.getElementById('myprojects-list')
    
    //Delete old children first
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }

    //Add the projects
    for(let p in data.projects) {
        let project = data.projects[p]
        let projectElement = document.createElement('li')
        let projectTitle = document.createElement('div')
        projectTitle.classList.add('title')
        projectTitle.textContent = `Project ${project.projectName} has ${project.frames} frames.`
        projectElement.appendChild(projectTitle)
        if (!project.finished) {
            //Add edit button so it can continue to be worked on
            let buttonElement = document.createElement('button')
            buttonElement.textContent = 'Edit'
            buttonElement.onclick = () => {
                //Edit element
                console.log('Editing project '+project.projectName)
                localStorage.setItem('job', project.projectName)
                redirect('/project')
            }
            projectElement.appendChild(buttonElement)
        }
        else {
            //Add video
            let videoElement = document.createElement('video')
            
            //Video settings
            videoElement.controls = true
            videoElement.loop = true
            // videoElement.autoplay = true
            // videoElement.muted = true
            videoElement.width = 400

            //Add source to video
            let sourceElement = document.createElement('source')
            sourceElement.src = '/uploads/' + project.folderBaseName + '/final_' + project.fileName
            videoElement.appendChild(sourceElement)
            projectElement.appendChild(videoElement)
        }
        parent.appendChild(projectElement)
    }
})