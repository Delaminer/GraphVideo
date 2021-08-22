let clickElement = document.createElement('a')
let redirect = (location) => {
    clickElement.href = location
    clickElement.click()
}

let loadSignedInContent = () => {
    //Left
    document.getElementById('community-project').textContent = 'Start a Project'
    document.getElementById('community-project').onclick = () => {
        redirect('/project')
    }
    document.getElementById('community-myprojects').style.display = 'block'
    document.getElementById('community-myprojects').onclick = () => {
        //Go to my-projects page
        redirect('/myprojects')
    }

    //Right
    document.getElementById('community-signin').textContent = 'Sign Out'
    document.getElementById('community-signin').onclick = () => { signOut() }
    document.getElementById('goto-profile').style.display = 'block'

    //Mainpage stuff
    document.getElementById('community-welcome').textContent = 'Welcome, ' + USER_NAME + '!'
}
let loadGuestContent = () => {
    //Left
    document.getElementById('community-project').textContent = 'Sign in to start a project'
    document.getElementById('community-project').onclick = () => {
        redirect('/signin')
    }
    document.getElementById('community-myprojects').style.display = 'none'

    //Right
    document.getElementById('community-signin').textContent = 'Sign In'
    document.getElementById('community-signin').onclick = () => { signIn() }
    document.getElementById('goto-profile').style.display = 'none'

    //Mainpage stuff
    document.getElementById('community-welcome').textContent = 'Welcome, Guest!'
}

let autoSignIn = () => {
    let username = localStorage.getItem('username')
    let email = localStorage.getItem('email')
    let password = localStorage.getItem('password')
    if (username != null && email != null && password != null && username != '') {
        //Auto sign in
        fetch('/login', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'credentials': JSON.stringify({ email: email, password: password })
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.verified) {
                //Successfully signed in
                USER_NAME = username
                USER_EMAIL = email
                USER_PASSWORD = password
                loadSignedInContent()
            }
            else {
                loadGuestContent()
            }
        })
    }
    else {
        loadGuestContent()
    }
}
autoSignIn()

//Get community project info
var loadCommunity = () => {

    fetch('/projects', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data =>  {
        //Display project information on community page

        //Parent element this data will be presented on
        let parent = document.getElementById('community-projects')
        
        //Delete old children first
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }

        //Add the projects
        for(let p in data.projects) {

            let project = data.projects[p]

            //Only show finished projects
            if (project.finished) {
                let projectElement = document.createElement('li')
                let projectTitle = document.createElement('div')
                projectTitle.classList.add('title')
                projectTitle.textContent = project.creator? `${project.projectName} by ${project.creator}` : project.projectName
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
                
                //Connect elements
                videoElement.appendChild(sourceElement)
                projectElement.appendChild(projectTitle)
                projectElement.appendChild(videoElement)
                parent.appendChild(projectElement)
            }

        }
    })
}
loadCommunity()

let signOut = () => {

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
let signIn = () => {
    redirect('/signin')
}
