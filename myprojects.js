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
    for(let project in data.projects) {
        let projectElement = document.createElement('p')
        projectElement.textContent = `Project ${data.projects[project].projectName} has ${data.projects[project].frames} frames.`
        parent.appendChild(projectElement)
    }
})