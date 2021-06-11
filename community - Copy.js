//Run this script only when asked to (because credentials from signin.js need to be found beforehand)
var loadCommunity = (credentials) => {

    console.log(JSON.stringify(credentials))

    if (USER_EMAIL != null && USER_NAME != null && USER_PASSWORD != null
        && USER_EMAIL != undefined && USER_NAME != undefined && USER_PASSWORD != undefined) {
        //Sign in was a success

        document.getElementById('community-welcome').textContent = 'Welcome, '+USER_NAME+'!'
        
        //Get list of projects to display
        fetch('/projects', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'credentials': JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD })
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
            for(let project in data.projects) {
                let projectElement = document.createElement('p')
                projectElement.textContent = `Project ${data.projects[project].projectName} has ${data.projects[project].frames} frames.`
                parent.appendChild(projectElement)
            }
        })
    }
    else {
        console.log('Could not load community. You are not signed in.')
    }

}

let signOut = () => {
    document.getElementById('signin-page').style.display = 'block'
    document.getElementById('community-page').style.display = 'none'
    document.getElementById('account-signin').style.display = 'block'
    document.getElementById('account-register').style.display = 'none'

    //Clear global signin variables
    USER_NAME = null
    USER_EMAIL = null
    USER_PASSWORD = null
    //Clear local-save signin variables
    localStorage.setItem('username', '')
    localStorage.setItem('email', '')
    localStorage.setItem('password', '')
}

document.getElementById('community-signout').onclick = () => {
    signOut()
}
document.getElementById('community-project').onclick = () => {
    
    document.getElementById('project-page').style.display = 'block'
    document.getElementById('community-page').style.display = 'none'

    document.getElementById('project-video').style.display = 'block'
    document.getElementById('project-image').style.display = 'none'

    document.getElementById('project-video-upload').style.display = 'block'
    document.getElementById('project-video-confirm').style.display = 'none'
    document.getElementById('project-video-render').style.display = 'none'
}