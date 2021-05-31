//Simple script to sign in to the website, storing the email/password in a variable so it can be used in API requests.
//TODO: Add localstorage so returning users are automatically signed in
//TODO: Add signout/profile settings

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

// //Add messages requiring a field to be completed if it is clicked out of before it is completedd
// let addRequiredField = (element) => {

// }

// [
//     // 'signin-form-email',
//     'signin-form-password',
//     // 'signin-form-button',
//     'register-form-username',
//     // 'register-form-email',
//     'register-form-password',
//     'register-form-confirm-password',
//     // 'register-form-button'
// ].map(v => document.getElementById(v)).forEach(v => {
//     v.addEventListener('focusout', (event) => {
//         console.log('hi')
//         // if (v.value.length == 0) {
//         //     console.log('hey')
//         // }
//     })
// })

//Error messages: for when signin/registration fails
let addError = (element, message) => {
    if (element.error == undefined || element.error == null || element.error == false) {
        element.error = true
        let msg = document.createElement('p')
        msg.classList.add('error')
        element.classList.add('error')
        msg.textContent = '* ' + message
        element.parentElement.insertBefore(msg, element)
        element.addEventListener('focus', (event) => {
            element.error = false
            element.classList.remove('error')
            if (msg.parentElement)
                msg.parentElement.removeChild(msg)
        })
    }
}
// addError(document.getElementById('register-form-password'), 'This field is required.')


//Attempt signin
document.getElementById('signin-form-button').onclick = () => {
    //Sign in. First check it is valid, then attempt sign in with server
    let email = document.getElementById('signin-form-email').value
    let password = document.getElementById('signin-form-password').value

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
    .then(data => {
        if (data.success) {
            console.log('signed in')
        }
        else {
            console.log('failed to sign in')
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
        fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('successfully registered')
            }
            else {
                if (data.error == 1) {
                    console.log('Account email already  taken')
                }
                else {
                    console.log('Unkown error registering')
                }
            }
        })
    }
}