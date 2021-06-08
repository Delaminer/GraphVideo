let a = (Math.random()*1e32).toString(36)
let b = Math.random().toString(36).substring(7)
let c = Math.random().toString(36).slice(2)
let randomString = (length) => {
    return Array(length).fill(0).map(x => Math.random().toString(36).charAt(2)).join('')
}
console.log(randomString(16))