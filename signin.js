//Simple script to sign in to the website, storing the email/password in a variable so it can be used in API requests.
//TODO: Add signout/profile settings

document.getElementById('signin-page').style.display = 'none'
document.getElementById('community-page').style.display = 'none'
document.getElementById('home-page').style.display = 'block'

let signIn = (credentials) => {
    document.getElementById('home-page').style.display = 'none'
    document.getElementById('signin-page').style.display = 'none'
    document.getElementById('community-page').style.display = 'block'
    
    //Update global variables
    USER_NAME = credentials.username
    USER_EMAIL = credentials.email
    USER_PASSWORD = credentials.password
    //Update local-save
    localStorage.setItem('username', credentials.username)
    localStorage.setItem('email', credentials.email)
    localStorage.setItem('password', credentials.password)

    loadCommunity(credentials)
}

let serverSignIn = (email, password, callback) => {
    fetch('/signin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => callback(data))
}

let autoSignIn = () => {
    let username = localStorage.getItem('username')
    let email = localStorage.getItem('email')
    let password = localStorage.getItem('password')
    if (username != null && email != null && password != null && username != '') {
        //Auto sign in
        serverSignIn(email, password, data => {
            if (data.success) {
                //Successfully signed in
                signIn(data)
            }
            else {
                document.getElementById('account-signin').style.display = 'block'
                document.getElementById('account-register').style.display = 'none'
                document.getElementById('home-page').style.display = 'none'
                document.getElementById('community-page').style.display = 'none'
                document.getElementById('signin-page').style.display = 'block'
            }
        })
    }
    else {
        document.getElementById('account-signin').style.display = 'block'
        document.getElementById('account-register').style.display = 'none'

        document.getElementById('home-page').style.display = 'none'
        document.getElementById('community-page').style.display = 'none'
        document.getElementById('signin-page').style.display = 'block'
    }
}
autoSignIn()

//Go to register page from signin page
document.getElementById('signin-goto-register').onclick = () => {
    document.getElementById('account-signin').style.display = 'none'
    document.getElementById('account-register').style.display = 'block'
}

//Go to signin page from register page
document.getElementById('register-goto-signin').onclick = () => {
    document.getElementById('account-signin').style.display = 'block'
    document.getElementById('account-register').style.display = 'none'
}

//Add input cycles for easy user input. This allows the Enter button to be used to move from field to field, which many users (including me) find convenient.

//Helper method for clicking/selecting
let selectElement = (element) => {
    if (element.tagName.toLowerCase() == 'input') {
        //Select it
        element.select()
    }
    else {
        //Click it
        element.click()
    }
}

//Actual cycle method
let addInputCycle = (elements) => {
    //Turn string IDs into their respective elements
    elements = elements.map(v => document.getElementById(v))

    elements.forEach((element, index) => {
        if (index < elements.length - 1) { //Don't add the enter listener to the last item
            element.addEventListener('keyup', (event) => {
                if (event.keyCode == 13) { //Enter key is pressed
                    event.preventDefault()
                    selectElement(elements[index + 1])
                }
            })
        }
    });
}

//Using the cycle to both signin and register pages
addInputCycle([
    'signin-form-email',
    'signin-form-password',
    'signin-form-button'
])
addInputCycle([
    'register-form-username',
    'register-form-email',
    'register-form-password',
    'register-form-confirm-password',
    'register-form-button'
])

//Error messages: for when signin/registration fails
let addError = (element, message) => {
    if (element.error == undefined || element.error == null || element.error == false) {
        element.error = true
        let errorMessage = document.createElement('p')
        errorMessage.classList.add('error')
        element.classList.add('error')
        errorMessage.textContent = '* ' + message
        element.parentElement.insertBefore(errorMessage, element)
        element.addEventListener('focus', (event) => {
            element.error = false
            element.classList.remove('error')
            if (errorMessage.parentElement)
            errorMessage.parentElement.removeChild(errorMessage)
        })
    }
}

//Attempt signin
document.getElementById('signin-form-button').onclick = () => {
    //Sign in. First check it is valid, then attempt sign in with server
    let email = document.getElementById('signin-form-email').value
    let password = document.getElementById('signin-form-password').value
    let hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Base64)

    serverSignIn(email, hashedPassword, data => {
        if (data.success) {
            //Successfully signed in
            signIn(data)
        }
        else {
            //Failed to sign in
            let form = document.getElementById('signin-form')
            if (form.error == undefined || form.error == null || form.error == false) {
                let errorMessage = document.createElement('p')
                errorMessage.classList.add('error')
                errorMessage.classList.add('center')
                errorMessage.textContent = 'Invalid email and password.'
                form.parentElement.insertBefore(errorMessage, form) //Put the message before the form and after the title
                form.error = true
            }
        }
    })
}

//Attempt register
document.getElementById('register-form-button').onclick = () => {
    let email = document.getElementById('register-form-email').value
    let username = document.getElementById('register-form-username').value
    let password = document.getElementById('register-form-password').value
    let confirmPassword = document.getElementById('register-form-confirm-password').value

    let valid = true

    //Check if it is valid
    //Do not use regex to validate, instead look for common issues so the error message may be more insightful (ex: missing @ or .com, typos)
    //Always make sure to use a confirmation email as well. (because a fake email like fake@email.com will work)

    if (email.length == 0) {
        valid = false
        addError(document.getElementById('register-form-email'), 'This field is required.')
    }
    else if (!email.includes('@')) {
        valid = false
        addError(document.getElementById('register-form-email'), 'Must be a valid email. Maybe you forgot the @ symbol?')
    }
    else if (!email.includes('.')) {
        valid = false
        addError(document.getElementById('register-form-email'), 'Must be a valid email. Maybe you forgot .com at the end?')
    }

    if (username.length == 0) {
        valid = false
        addError(document.getElementById('register-form-username'), 'This field is required.')
    }
    
    if (password.length == 0) {
        valid = false
        addError(document.getElementById('register-form-password'), 'This field is required.')
    }

    if (confirmPassword.length == 0) {
        valid = false
        addError(document.getElementById('register-form-confirm-password'), 'This field is required.')
    }
    else if (confirmPassword != password) {
        valid = false
        addError(document.getElementById('register-form-confirm-password'), 'Password and Confirm Password must be the same.')
    }
    
    if (valid) {
        //Adding a hash so your password is not actually ever used
        let hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Base64)
        fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: hashedPassword
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                //Successfully registered
                signIn(data)
            }
            else {
                //Failed to register

                //Get the error message
                let message = 'Unkown error when registering, try again later.'
                if (data.error == 1) {
                    message = 'Email is already used for another account.'
                }
                if (data.error == 2) {
                    message = 'Invalid login, try a different email/name/password.'
                }
                
                //Display the error message
                let form = document.getElementById('register-form')
                if (form.error == undefined || form.error == null || form.error == false) {
                    let errorMessage = document.createElement('p')
                    errorMessage.classList.add('error')
                    errorMessage.classList.add('center')
                    errorMessage.textContent = message
                    form.parentElement.insertBefore(errorMessage, form) //Put the message before the form and after the title
                    form.error = true
                }
            }
        })
    }
}