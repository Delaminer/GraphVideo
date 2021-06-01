// let USER_EMAIL = null
// let USER_NAME = null
// let USER_PASSWORD = null

//Run this script only when asked to (because credentials from signin.js need to be found beforehand)
var loadCommunity = (credentials) => {
    // USER_NAME = credentials.username
    // USER_EMAIL = credentials.email
    // USER_PASSWORD = credentials.password

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