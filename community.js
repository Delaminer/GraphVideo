let clickElement = document.createElement('a')
let redirect = (location) => {
    clickElement.href = location
    clickElement.click()
}

let loadSignedInContent = () => {
    document.getElementById('community-project').textContent = 'Start a Project'
    document.getElementById('community-signin').textContent = 'Sign Out'
    document.getElementById('community-signin').onclick = () => { signOut() }
    document.getElementById('goto-profile').style.display = 'block'
    document.getElementById('community-welcome').textContent = 'Welcome, ' + USER_NAME + '!'
    document.getElementById('community-project').onclick = () => {
        redirect('/project')
    }
}
let loadGuestContent = () => {
    document.getElementById('community-project').textContent = 'Sign in to start a project'
    document.getElementById('community-signin').textContent = 'Sign In'
    document.getElementById('community-signin').onclick = () => { signIn() }
    document.getElementById('goto-profile').style.display = 'none'
    document.getElementById('community-welcome').textContent = 'Welcome, Guest!'
    document.getElementById('community-project').onclick = () => {
        redirect('/signin')
    }
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
            if (data.success) {
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
        for(let project in data.projects) {
            let projectElement = document.createElement('p')
            projectElement.textContent = `Project ${data.projects[project].projectName} has ${data.projects[project].frames} frames.`
            parent.appendChild(projectElement)
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
