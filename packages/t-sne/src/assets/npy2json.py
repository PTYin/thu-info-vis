import numpy as np
import json

if __name__ == '__main__':
    images = np.load('sampled_image.npy').tolist()
    labels = np.load('sampled_label.npy').tolist()
    data = {'images': images, 'labels': labels}
    with open('sampled.json', 'wt') as file:
        json.dump(data, file)
