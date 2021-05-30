# These are some helpful commands for image/video manipulation. This shell file is not actually ran.

#Turn video file into frames - Change the 5 to a higher number if there are more than 99999 frames
ffmpeg -i sample.mp4 frames/out-%05d.jpg

#Turn bmp into an svg with potrace
potrace '.\edited frames\edited test.bmp' -b svg -o '.\svg frames\edited test.svg'
#potrace can invert bitmaps and export to only one path
potrace '.\edited frames\edited test.bmp' -b svg --flat --invert


#Build final video (without audio, just the frames)
ffmpeg -r 30 -f image2 -s 768x576 -i finalFrames/final_out-%05d.png -vcodec libx264 -crf 25 -pix_fmt yuv420p finalBA.mp4
#Build but with original audio (ba.mp4)
ffmpeg -r 30 -f image2 -s 768x576 -i finalFrames/final_out-%05d.png -i ba.mp4 -map 0:0 -map 1:1 -shortest -vcodec libx264 -crf 25 -pix_fmt yuv420p finalBA.mp4