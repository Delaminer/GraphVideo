# GraphVideo
Create graphs from videos (and images eventually)!
Currently, you can upload a video file, the server will convert it into frames, convert those frames into SVGs, which your browser will then turn into functions displayed on your graph! It uses that window to render each frame, sending each completed render to the server, until the video is finished.

## Setup
A folder named 'uploads' needs to be created, it is currently added in the .gitignore, but the actual folder needs to be added, but the server cannot create it itself for some reason. Also, create a .env file with
```
email=youremail@email.com
password=youremailpassword
```
Your email account security settings may need to be lessened in order for emails to be sent through SMTP.

## Use
The server needs to be started with
```
node server.js
```
And go to http://localhost:3000/website.html
## Future changes
- Sign in option (so this can be ran securely on a real server)
- Share projects webpage (which would use the signin accounts)
- Pause and resume render progress (currently it has be rendered all at once)
- Allow multiple workers (possibly with NodeJS and not the broswer?)
- Customize output (currently it only shows the graph. In the future, I would like to show the equations needed to make the graphs, and posibly add more)
- Change vision processing? (Currently, it only uses edge detection, which doesn't always give the best resuts)

## Notes
This was based off of [this Youtube video](https://www.youtube.com/watch?v=BQvBq3K50u8&list=PLDBGIJ3hJ1-smfNoX4GzJlkfLLqSAcBuV&index=9).
It was originally just to make the same kind of program, but since then I have been using this as an intro project to learn how to make servers and webpages with users.
