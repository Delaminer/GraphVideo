import os, os.path
import sys
import editFrame

#Edit and SVGify frames. If arguments are provided, we will use them. If not, we will use the defaults
#Note: the first argument is always the name of the python script (editAllFrames.py), so ignore it

baseFolder = ''
baseImageName = 'out-'

if (len(sys.argv) > 1):
    #We do have arguments
    baseFolder = sys.argv[1]
    baseImageName = sys.argv[2]

count = 0
directory = os.getcwd() + baseFolder + '/frames'
for path in os.listdir(directory):
    if os.path.isfile(os.path.join(directory, path)):
        count += 1
        #Edit this frame
        imageName = baseImageName + str(count).zfill(5)
        editFrame.editFrame(baseFolder = baseFolder, filename = imageName)
        # os.system('potrace .\\editedFrames\\edit_{}.bmp -b svg -o .\\svgFrames\\svg_{}.svg'.format(imageName, imageName))
        os.system('potrace .{}\\editedFrames\\edit_{}.bmp -b svg -o .{}\\svgFrames\\svg_{}.svg'.format(baseFolder.replace('/','\\'), imageName, baseFolder.replace('/','\\'), imageName))
        # os.system('potrace {}/editedFramesedit_{}.bmp -b svg -o {}/svgFrames/svg_{}.svg'.format(baseFolder, imageName, baseFolder, imageName))

print('editAllFrames.py finished, frames: {}'.format(count))