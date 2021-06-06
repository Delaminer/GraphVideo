//Run this script only when asked to (because credentials from signin.js need to be found beforehand)
var loadCommunity = (credentials) => {

    console.log(JSON.stringify(credentials))

    if (USER_EMAIL != null && USER_NAME != null && USER_PASSWORD != null
        && USER_EMAIL != undefined && USER_NAME != undefined && USER_PASSWORD != undefined) {
        //Sign in was a success

        document.getElementById('community-welcome').textContent = 'Welcome, '+USER_NAME+'!'

    }
    else {
        console.log('not found')
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