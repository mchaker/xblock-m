/**
 * @file
 * This is a lot of overridden stuff from Transformers.js to facilitate me using a
 * SwinV2 model in conjunction with multi-label inference (e.g., sigmoid over softmax).
 *
 * You probably just want to import `pipeline` from @xenova/transformers and use that instead if you're
 * not using a fine-tuned multi-label model.
 */

import {
  AutoProcessor,
  getTopItems,
  Pipeline,
  PretrainedMixin,
  PreTrainedModel,
  RawImage,
  SequenceClassifierOutput,
} from "@xenova/transformers";

import { dispatchCallback } from "@xenova/transformers/src/utils/core.js";

export async function pipeline(
  task = "multi-label-image-classification",
  model = "howdyaendra/microsoft-swinv2-small-patch4-window16-256-finetuned-xblockm",
  {
    quantized = true,
    progress_callback = null,
    config = null,
    cache_dir = null,
    local_files_only = false,
    revision = "main",
    model_file_name = null,
  } = {}
) {
  // Helper method to construct pipeline

  // Get pipeline info
  const pipelineInfo = {
    pipeline: MultiLabelImageClassificationPipeline,
    model: Swinv2ForMultiLabelImageClassification,
    processor: AutoProcessor,
    type: "multimodal",
  };

  const pretrainedOptions = {
    quantized,
    progress_callback,
    config,
    cache_dir,
    local_files_only,
    revision,
    model_file_name,
  };

  const classes = new Map([
    ["tokenizer", undefined],
    ["model", pipelineInfo.model],
    ["processor", pipelineInfo.processor],
  ]);

  // Load model, tokenizer, and processor (if they exist)
  const results = await loadItems(classes, model, pretrainedOptions);
  results.task = task;

  dispatchCallback(progress_callback, {
    status: "ready",
    task: task,
    model: model,
  });

  const pipelineClass = pipelineInfo.pipeline;
  return new pipelineClass(results);
}

async function prepareImages(images) {
  if (!Array.isArray(images)) {
    images = [images];
  }

  // Possibly convert any non-images to images
  return await Promise.all(images.map((x) => RawImage.read(x)));
}

function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z));
}

export function sigmoidArr(arr: number[]) {
  return arr.map(sigmoid);
}

export class MultiLabelImageClassificationPipeline extends Pipeline {
  /**
   * Create a new MultiLabelImageClassificationPipeline.
   */
  constructor(options) {
    super(options);
  }

  async _call(images, { topk = 4 } = {}) {
    const isBatched = Array.isArray(images);
    const preparedImages = await prepareImages(images);

    const { pixel_values } = await this.processor(preparedImages);
    const output = await this.model({ pixel_values });

    const id2label = this.model.config.id2label;
    const toReturn: any[] = [];
    for (const batch of output.logits) {
      const scores = getTopItems(sigmoidArr(batch.data), topk);

      const vals = scores.map((x) => ({
        label: id2label[x[0]],
        score: x[1],
      }));
      if (topk === 1) {
        toReturn.push(...vals);
      } else {
        toReturn.push(vals);
      }
    }

    return isBatched || topk === 1 ? toReturn : toReturn[0];
  }
}

/**
 * Helper function to get applicable model, tokenizer, or processor classes for a given model.
 * @param {Map<string, any>} mapping The mapping of names to classes, arrays of classes, or null.
 * @param {string} model The name of the model to load.
 * @param {import('./utils/hub.js').PretrainedOptions} pretrainedOptions The options to pass to the `from_pretrained` method.
 * @private
 */
async function loadItems(mapping, model, pretrainedOptions) {
  const result = Object.create(null);

  const promises: Promise<any>[] = [];
  for (let [name, cls] of mapping.entries()) {
    if (!cls) continue;

    /**@type {Promise} */
    let promise;
    if (Array.isArray(cls)) {
      promise = new Promise(async (resolve, reject) => {
        let e;
        for (let c of cls) {
          if (c === null) {
            // If null, we resolve it immediately, meaning the relevant
            // class was not found, but it is optional.
            resolve(null);
            return;
          }
          try {
            resolve(await c.from_pretrained(model, pretrainedOptions));
            return;
          } catch (err) {
            e = err;
          }
        }
        reject(e);
      });
    } else {
      promise = cls.from_pretrained(model, pretrainedOptions);
    }

    result[name] = promise;
    promises.push(promise);
  }

  // Wait for all promises to resolve (in parallel)
  await Promise.all(promises);

  // Then assign to result
  for (let [name, promise] of Object.entries(result)) {
    result[name] = await promise;
  }

  return result;
}

export class Swinv2PreTrainedModel extends PreTrainedModel {}
export class Swinv2Model extends Swinv2PreTrainedModel {}
export class Swinv2ForMultiLabelImageClassification extends Swinv2PreTrainedModel {
  /**
   * @param {any} model_inputs
   */
  async _call(model_inputs) {
    return new SequenceClassifierOutput(await super._call(model_inputs));
  }
}

const MODEL_FOR_MULTI_LABEL_IMAGE_CLASSIFICATION_MAPPING_NAMES = new Map([
  [
    "swinv2",
    [
      "Swinv2ForMultiLabelImageClassification",
      Swinv2ForMultiLabelImageClassification,
    ],
  ],
]);

export class AutoModelForMultiLabelImageClassification extends PretrainedMixin {
  static MODEL_CLASS_MAPPINGS = [
    MODEL_FOR_MULTI_LABEL_IMAGE_CLASSIFICATION_MAPPING_NAMES,
  ];
}
