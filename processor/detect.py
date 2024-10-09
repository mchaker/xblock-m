import numpy as np
import torch
import torchvision.transforms as T
from PIL import Image
from timm import create_model
from PIL import Image
import requests
from io import BytesIO
from safetensors.torch import load_model


MIN_CONFIDENCE = 0.75

LABELS = [
    "altright",
    "bluesky",
    "discord",
    "facebook",
    "fediverse",
    "instagram",
    "negative",
    "news",
    "ngl",
    "reddit",
    "threads",
    "tumblr",
    "twitter",
]

img_size = (224, 224)

valid_tfms = T.Compose(
    [
        T.Resize(img_size),
        T.ToTensor(),
        T.Normalize(mean=(0.5, 0.5, 0.5), std=(0.5, 0.5, 0.5)),
    ]
)

label2id, id2label = dict(), dict()
for i, label in enumerate(LABELS):
    label2id[label] = i
    id2label[i] = label

num_classes = len(LABELS)

# intialize the model
model_name = "swin_s3_base_224"
model = create_model(model_name, num_classes=num_classes)

load_model(model, f"/app/models/swin-s3-base-224-xblock/model.safetensors")

print("model loaded")


def transforms(batch):
    # convert all images in batch to RGB to avoid grayscale or transparent images
    batch["images"] = [x.convert("RGB") for x in batch["images"]]

    # apply torchvision.transforms per sample in the batch
    inputs = [valid_tfms(x) for x in batch["images"]]
    batch["pixel_values"] = inputs

    return batch


async def run_inference(posts):

    model.eval()
    for post in posts:
        batch = {"images": []}
        for url in post["urls"]:
            response = requests.get(url)
            img = Image.open(BytesIO(response.content))
            batch["images"].append(img)

        batch = transforms(batch)

        inputs = batch["pixel_values"].unsqueeze(0)

        with torch.no_grad():
            logits = model(inputs)

        # apply sigmoid activation to convert logits to probabilities
        # getting labels with high confidence thresholds
        predictions = logits.sigmoid() > MIN_CONFIDENCE

        # converting one-hot encoded predictions back to list of labels
        predictions = (
            predictions.float().numpy().flatten()
        )  # convert boolean predictions to float
        pred_labels = np.where(predictions >= 1)[
            0
        ]  # find indices where prediction is 1

        pred_labels = [id2label[label] for label in pred_labels]

        print(pred_labels)
        return pred_labels


#
