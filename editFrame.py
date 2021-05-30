#Edit raw video frames into black and white frames for svg/bezier processing
import cv2
def resize(image, scale_percent=99):
    return cv2.resize(image, (int(image.shape[1] * scale_percent / 100), int(image.shape[0] * scale_percent / 100)), interpolation = cv2.INTER_AREA)

def ef(in_file, out_file):
    img = cv2.imread(in_file)
    #Image processing

    #Step 1: grayscale
    i = img
    i = cv2.cvtColor(i, cv2.COLOR_BGR2GRAY)
    i = cv2.Canny(i,100,200)
    i = cv2.bitwise_not(i)

    #Resizing RUINS the potrace svg line effect! It makes things more blocky (not good)
    # i = resize(i, 100)

    #Save the image
    cv2.imwrite(out_file, i)

def editFrame(baseFolder = '/', filename = 'out-001'):
    baseFolder = baseFolder[1:] #Remove the /
    ef(baseFolder + '/frames/' + filename + '.jpg', baseFolder + '/editedFrames/edit_' + filename + '.bmp')

if __name__ == '__main__':
    ef('s1.jpg','s1.bmp')